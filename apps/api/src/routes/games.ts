/**
 * Game Routes
 * 
 * API endpoints for game management
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { 
  GameState, 
  GameStatus, 
  PlayerType, 
  AIDifficulty,
  ActionType,
} from '@quantum/types';
import { 
  GameEngine, 
  createGame, 
  MAP_CONFIGS,
  type CreateGameOptions,
} from '@quantum/game-engine';
import { createAI } from '@quantum/ai';
import { Game } from '../models/index.js';
import { authMiddleware, optionalAuth, getUser } from '../middleware/auth.js';

const games = new Hono();

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CreateGameSchema = z.object({
  mapConfigId: z.string(),
  players: z.array(z.object({
    type: z.enum(['human', 'ai']),
    factionId: z.string(),
    aiDifficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  })).min(2).max(4),
  cubesOverride: z.number().min(3).max(10).optional(),
});

const GameActionSchema = z.object({
  type: z.nativeEnum(ActionType),
  params: z.record(z.any()),
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /games/maps
 * List available map configurations
 */
games.get('/maps', (c) => {
  const maps = MAP_CONFIGS.map(m => ({
    id: m.id,
    name: m.name,
    playerCount: m.playerCount,
    cubesPerPlayer: m.cubesPerPlayer,
  }));
  return c.json({ maps });
});

/**
 * POST /games
 * Create a new game
 */
games.post('/', optionalAuth, async (c) => {
  const body = await c.req.json();
  const parsed = CreateGameSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.issues }, 400);
  }
  
  const { mapConfigId, players, cubesOverride } = parsed.data;
  
  // Validate map exists
  const mapConfig = MAP_CONFIGS.find(m => m.id === mapConfigId);
  if (!mapConfig) {
    return c.json({ error: 'Invalid map configuration' }, 400);
  }
  
  // Validate player count for map
  if (!mapConfig.playerCount.includes(players.length)) {
    return c.json({ 
      error: `Map ${mapConfig.name} doesn't support ${players.length} players` 
    }, 400);
  }
  
  // Check faction assignments
  const usedFactions = new Set<string>();
  for (const player of players) {
    if (usedFactions.has(player.factionId)) {
      return c.json({ error: 'Duplicate faction assignment' }, 400);
    }
    usedFactions.add(player.factionId);
  }
  
  try {
    const user = getUser(c);
    
    // Build player configs
    const playerConfigs: CreateGameOptions['players'] = players.map((p, index) => ({
      type: p.type === 'human' ? PlayerType.HUMAN : PlayerType.AI,
      userId: p.type === 'human' && index === 0 ? user?.userId : undefined,
      factionId: p.factionId,
      aiDifficulty: p.aiDifficulty as AIDifficulty | undefined,
    }));
    
    // Create game state
    const gameState = createGame({
      mapConfigId,
      players: playerConfigs,
      cubesOverride,
    });
    
    // Save to database
    const gameDoc = new Game({
      _id: gameState.id,
      status: gameState.status,
      mapConfigId,
      playerIds: gameState.players.map(p => p.userId).filter(Boolean),
      playerFactions: Object.fromEntries(
        gameState.players.map(p => [p.id, p.factionId])
      ),
      state: gameState,
    });
    
    await gameDoc.save();
    
    return c.json({ 
      game: gameState,
      message: 'Game created successfully',
    }, 201);
    
  } catch (error) {
    console.error('Error creating game:', error);
    return c.json({ error: 'Failed to create game' }, 500);
  }
});

/**
 * GET /games/:id
 * Get game state
 */
games.get('/:id', async (c) => {
  const gameId = c.req.param('id');
  
  try {
    const gameDoc = await Game.findById(gameId);
    
    if (!gameDoc) {
      return c.json({ error: 'Game not found' }, 404);
    }
    
    return c.json({ game: gameDoc.state });
    
  } catch (error) {
    console.error('Error fetching game:', error);
    return c.json({ error: 'Failed to fetch game' }, 500);
  }
});

/**
 * POST /games/:id/action
 * Perform a game action
 */
games.post('/:id/action', optionalAuth, async (c) => {
  const gameId = c.req.param('id');
  const body = await c.req.json();
  
  const parsed = GameActionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid action', details: parsed.error.issues }, 400);
  }
  
  try {
    const gameDoc = await Game.findById(gameId);
    
    if (!gameDoc) {
      return c.json({ error: 'Game not found' }, 404);
    }
    
    if (gameDoc.status !== 'in_progress') {
      return c.json({ error: 'Game is not in progress' }, 400);
    }
    
    const engine = new GameEngine(gameDoc.state as GameState);
    const currentPlayer = engine.getCurrentPlayer();
    const playerId = currentPlayer.id;
    
    // TODO: Validate that the user is the current player (for multiplayer)
    
    const { type, params } = parsed.data;
    let result;
    
    switch (type) {
      case ActionType.RECONFIGURE:
        result = engine.reconfigure(playerId, params.shipId);
        break;
      case ActionType.DEPLOY:
        result = engine.deploy(playerId, params.shipIndex, params.targetPosition);
        break;
      case ActionType.MOVE:
        result = engine.move(playerId, params.shipId, params.targetPosition);
        break;
      case ActionType.ATTACK:
        result = engine.attack(playerId, params.shipId, params.targetPosition, params.moveToTarget);
        break;
      case ActionType.CONSTRUCT:
        result = engine.construct(playerId, params.tileId);
        break;
      case ActionType.RESEARCH:
        result = engine.research(playerId);
        break;
      case ActionType.END_TURN:
        result = engine.endTurn(playerId);
        break;
      case ActionType.SELECT_ADVANCE_CARD:
        result = engine.selectAdvanceCard(playerId, params.cardId, params.discardCommandId);
        break;
      default:
        return c.json({ error: 'Unknown action type' }, 400);
    }
    
    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }
    
    // Update database
    const newState = result.data;
    gameDoc.state = newState;
    gameDoc.status = newState.status;
    if (newState.winnerId) {
      gameDoc.winnerId = newState.winnerId;
      gameDoc.finishedAt = newState.finishedAt;
    }
    
    await gameDoc.save();
    
    // If next player is AI, process AI turn
    const nextPlayer = newState.players.find(p => p.id === newState.currentPlayerId);
    if (nextPlayer?.type === PlayerType.AI && newState.status === GameStatus.IN_PROGRESS) {
      // Process AI turn asynchronously
      processAITurn(gameId, nextPlayer.aiDifficulty || AIDifficulty.MEDIUM);
    }
    
    return c.json({ game: newState });
    
  } catch (error) {
    console.error('Error processing action:', error);
    return c.json({ error: 'Failed to process action' }, 500);
  }
});

/**
 * GET /games/:id/available-actions
 * Get available actions for current player
 */
games.get('/:id/available-actions', async (c) => {
  const gameId = c.req.param('id');
  
  try {
    const gameDoc = await Game.findById(gameId);
    
    if (!gameDoc) {
      return c.json({ error: 'Game not found' }, 404);
    }
    
    const engine = new GameEngine(gameDoc.state as GameState);
    const available = engine.getAvailableActions();
    
    return c.json({ availableActions: available });
    
  } catch (error) {
    console.error('Error getting available actions:', error);
    return c.json({ error: 'Failed to get available actions' }, 500);
  }
});

// =============================================================================
// AI PROCESSING
// =============================================================================

async function processAITurn(gameId: string, difficulty: AIDifficulty): Promise<void> {
  try {
    const gameDoc = await Game.findById(gameId);
    if (!gameDoc || gameDoc.status !== 'in_progress') return;
    
    const engine = new GameEngine(gameDoc.state as GameState);
    const ai = createAI(difficulty);
    
    await ai.executeTurn(engine);
    
    // Save updated state
    const newState = engine.getState();
    gameDoc.state = newState;
    gameDoc.status = newState.status;
    if (newState.winnerId) {
      gameDoc.winnerId = newState.winnerId;
      gameDoc.finishedAt = newState.finishedAt;
    }
    
    await gameDoc.save();
    
    // If still AI's turn (shouldn't happen but safety check), or next player is AI
    const nextPlayer = newState.players.find(p => p.id === newState.currentPlayerId);
    if (nextPlayer?.type === PlayerType.AI && newState.status === GameStatus.IN_PROGRESS) {
      // Small delay before next AI turn
      setTimeout(() => {
        processAITurn(gameId, nextPlayer.aiDifficulty || AIDifficulty.MEDIUM);
      }, 500);
    }
    
  } catch (error) {
    console.error('Error processing AI turn:', error);
  }
}

export default games;
