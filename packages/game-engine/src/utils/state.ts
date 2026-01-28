/**
 * Game State Factory
 * 
 * Creates new game states, handles setup, and provides state manipulation utilities.
 */

import {
  GameState,
  GameStatus,
  TurnPhase,
  Player,
  PlayerType,
  AIDifficulty,
  Ship,
  ShipType,
  Tile,
  CardState,
  MapConfig,
  FACTIONS,
  CardType,
  AdvanceCard
} from '@quantum/types';
import { createCardDeck } from '../cards.js';
import { shuffle, rollDie } from './dice.js';
import { getOrbitalPositions } from './board.js';

// =============================================================================
// ID GENERATION
// =============================================================================

let idCounter = 0;

export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now().toString(36)}-${(idCounter++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Create the initial card decks and market
 */
export function createCardDecks(): CardState {
  const gambitDeck = createCardDeck(CardType.GAMBIT);
  const commandDeck = createCardDeck(CardType.COMMAND);
  
  return {
    gambitDeck: gambitDeck.slice(3),
    commandDeck: commandDeck.slice(3),
    gambitMarket: gambitDeck.slice(0, 3),
    commandMarket: commandDeck.slice(0, 3),
    gambitDiscard: [],
    commandDiscard: [],
  };
}

// =============================================================================
// MAP CONFIGURATIONS
// =============================================================================

/**
 * Predefined map configurations
 * Each tile is a 3x3 grid, positioned by top-left corner
 */
export const MAP_CONFIGS: MapConfig[] = [
  // 2-player starter map
  {
    id: 'binary-stars',
    name: 'Binary Stars',
    playerCount: [2],
    cubesPerPlayer: 5,
    tiles: [
      { id: 'tile-1', position: { x: 0, y: 0 }, planetNumber: 8 },
      { id: 'tile-2', position: { x: 3, y: 0 }, planetNumber: 7 },
      { id: 'tile-3', position: { x: 6, y: 0 }, planetNumber: 9 },
      { id: 'tile-4', position: { x: 0, y: 3 }, planetNumber: 10 },
      { id: 'tile-5', position: { x: 3, y: 3 }, planetNumber: 8 },
      { id: 'tile-6', position: { x: 6, y: 3 }, planetNumber: 7 },
    ],
    startingPlanets: {
      'quantum': 'tile-1',
      'void': 'tile-6',
    },
  },
  // 3-player map
  {
    id: 'tri-sector',
    name: 'Tri-Sector',
    playerCount: [3],
    cubesPerPlayer: 5,
    tiles: [
      { id: 'tile-1', position: { x: 3, y: 0 }, planetNumber: 9 },
      { id: 'tile-2', position: { x: 0, y: 3 }, planetNumber: 8 },
      { id: 'tile-3', position: { x: 6, y: 3 }, planetNumber: 8 },
      { id: 'tile-4', position: { x: 3, y: 3 }, planetNumber: 10 },
      { id: 'tile-5', position: { x: 0, y: 6 }, planetNumber: 7 },
      { id: 'tile-6', position: { x: 3, y: 6 }, planetNumber: 9 },
      { id: 'tile-7', position: { x: 6, y: 6 }, planetNumber: 7 },
    ],
    startingPlanets: {
      'quantum': 'tile-5',
      'void': 'tile-7',
      'stellar': 'tile-1',
    },
  },
  // 4-player map
  {
    id: 'quadrant',
    name: 'The Quadrant',
    playerCount: [4],
    cubesPerPlayer: 4,
    tiles: [
      { id: 'tile-1', position: { x: 0, y: 0 }, planetNumber: 8 },
      { id: 'tile-2', position: { x: 3, y: 0 }, planetNumber: 10 },
      { id: 'tile-3', position: { x: 6, y: 0 }, planetNumber: 8 },
      { id: 'tile-4', position: { x: 0, y: 3 }, planetNumber: 9 },
      { id: 'tile-5', position: { x: 3, y: 3 }, planetNumber: 7 },
      { id: 'tile-6', position: { x: 6, y: 3 }, planetNumber: 9 },
      { id: 'tile-7', position: { x: 0, y: 6 }, planetNumber: 8 },
      { id: 'tile-8', position: { x: 3, y: 6 }, planetNumber: 10 },
      { id: 'tile-9', position: { x: 6, y: 6 }, planetNumber: 8 },
    ],
    startingPlanets: {
      'quantum': 'tile-1',
      'void': 'tile-3',
      'stellar': 'tile-7',
      'nebula': 'tile-9',
    },
  },
  // Large 2-player map for longer games
  {
    id: 'expanse',
    name: 'The Expanse',
    playerCount: [2],
    cubesPerPlayer: 7,
    tiles: [
      { id: 'tile-1', position: { x: 0, y: 0 }, planetNumber: 7 },
      { id: 'tile-2', position: { x: 3, y: 0 }, planetNumber: 9 },
      { id: 'tile-3', position: { x: 6, y: 0 }, planetNumber: 11 },
      { id: 'tile-4', position: { x: 9, y: 0 }, planetNumber: 8 },
      { id: 'tile-5', position: { x: 0, y: 3 }, planetNumber: 10 },
      { id: 'tile-6', position: { x: 3, y: 3 }, planetNumber: 8 },
      { id: 'tile-7', position: { x: 6, y: 3 }, planetNumber: 8 },
      { id: 'tile-8', position: { x: 9, y: 3 }, planetNumber: 10 },
      { id: 'tile-9', position: { x: 0, y: 6 }, planetNumber: 9 },
      { id: 'tile-10', position: { x: 3, y: 6 }, planetNumber: 12 },
      { id: 'tile-11', position: { x: 6, y: 6 }, planetNumber: 12 },
      { id: 'tile-12', position: { x: 9, y: 6 }, planetNumber: 9 },
    ],
    startingPlanets: {
      'quantum': 'tile-1',
      'void': 'tile-4',
    },
  },
];

// =============================================================================
// GAME CREATION
// =============================================================================

export interface CreateGameOptions {
  mapConfigId: string;
  players: Array<{
    type: PlayerType;
    userId?: string;
    aiDifficulty?: AIDifficulty;
    factionId: string;
  }>;
  cubesOverride?: number;  // Override default cubes per player
}

/**
 * Create a new game state
 */
export function createGame(options: CreateGameOptions): GameState {
  const mapConfig = MAP_CONFIGS.find(m => m.id === options.mapConfigId);
  if (!mapConfig) {
    throw new Error(`Unknown map config: ${options.mapConfigId}`);
  }
  
  if (!mapConfig.playerCount.includes(options.players.length)) {
    throw new Error(`Map ${mapConfig.name} doesn't support ${options.players.length} players`);
  }
  
  const gameId = generateId('game-');
  const cubesPerPlayer = options.cubesOverride ?? mapConfig.cubesPerPlayer;
  
  // Create tiles from map config
  const tiles: Tile[] = mapConfig.tiles.map(tileConfig => ({
    id: tileConfig.id,
    position: tileConfig.position,
    planetNumber: tileConfig.planetNumber,
    quantumCube: null,
  }));
  
  // Create players
  const players: Player[] = options.players.map((playerConfig, index) => {
    const startingTileId = mapConfig.startingPlanets[playerConfig.factionId];
    const startingTile = tiles.find(t => t.id === startingTileId);
    
    if (!startingTile) {
      throw new Error(`No starting planet defined for faction ${playerConfig.factionId}`);
    }
    
    // Place initial quantum cube on starting planet
    startingTile.quantumCube = generateId('player-');
    
    return {
      id: startingTile.quantumCube,  // Use same ID for player
      type: playerConfig.type,
      userId: playerConfig.userId ?? null,
      aiDifficulty: playerConfig.aiDifficulty ?? null,
      factionId: playerConfig.factionId,
      quantumCubesRemaining: cubesPerPlayer - 1,  // One already placed
      researchCounter: 1,
      dominanceCounter: 0,
      activeCommandCards: [],
      scrapyard: [],
      actionsRemaining: 3,
      cubesPlacedThisTurn: 0,
      achievedBreakthroughThisTurn: false,
      bonusMoves: 0,
    };
  });
  
  // Roll initial ships for each player and place in orbit
  const ships: Ship[] = [];
  for (const player of players) {
    const startingTileId = mapConfig.startingPlanets[player.factionId];
    const startingTile = tiles.find(t => t.id === startingTileId)!;
    const orbitalPositions = getOrbitalPositions(startingTile);
    
    // Roll 3 ships and place in orbital positions
    for (let i = 0; i < 3; i++) {
      const shipValue = rollDie();
      ships.push({
        id: generateId('ship-'),
        ownerId: player.id,
        pipValue: shipValue,
        position: orbitalPositions[i],  // Place in first 3 orbital positions
        hasMovedThisTurn: false,
        hasUsedAbilityThisTurn: false,
        isCarried: false,
        carriedById: null,
      });
    }
  }
  
   // Create card decks
  const cards = createCardDecks();
  
  // Determine turn order (shuffle player IDs)
  const turnOrder = shuffle(players.map(p => p.id));

  return {
    id: gameId,
    status: GameStatus.IN_PROGRESS,
    mapConfigId: options.mapConfigId,
    createdAt: new Date(),
    updatedAt: new Date(),
    finishedAt: null,
    winnerId: null,
    turnNumber: 1,
    currentPlayerId: turnOrder[0],
    currentPhase: TurnPhase.ACTIONS,
    turnOrder,
    tiles,
    ships,
    cards,
    players,
    activeCombat: null,
    actionLog: [],
  };
}

// =============================================================================
// STATE UTILITIES
// =============================================================================

/**
 * Get a player by ID
 */
export function getPlayer(state: GameState, playerId: string): Player | undefined {
  return state.players.find(p => p.id === playerId);
}

/**
 * Get current player
 */
export function getCurrentPlayer(state: GameState): Player {
  const player = getPlayer(state, state.currentPlayerId);
  if (!player) {
    throw new Error('Current player not found');
  }
  return player;
}

/**
 * Get a ship by ID
 */
export function getShip(state: GameState, shipId: string): Ship | undefined {
  return state.ships.find(s => s.id === shipId);
}

/**
 * Get ships owned by a player
 */
export function getPlayerShips(state: GameState, playerId: string): Ship[] {
  return state.ships.filter(s => s.ownerId === playerId);
}

/**
 * Get deployed ships (on board, not in scrapyard)
 */
export function getDeployedShips(state: GameState, playerId: string): Ship[] {
  return getPlayerShips(state, playerId).filter(s => s.position !== null);
}

/**
 * Get a tile by ID
 */
export function getTile(state: GameState, tileId: string): Tile | undefined {
  return state.tiles.find(t => t.id === tileId);
}

/**
 * Deep clone game state (for immutable updates)
 */
export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}
