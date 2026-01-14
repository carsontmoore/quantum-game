/**
 * Quantum AI Opponent
 * 
 * Rule-based AI for MVP. Evaluates available actions and picks the best one
 * based on heuristics. Can be upgraded to MCTS or other algorithms later.
 */

import {
  GameState,
  AIDifficulty,
  AvailableActions,
  Player,
  Ship,
  Tile,
  Position,
  ShipType,
  ActionType,
} from '@quantum/types';
import {
  GameEngine,
  getAvailableActions,
  getPlayerShipsInOrbit,
  getOrbitalPositions,
  positionKey,
  getShipAtPosition,
  getTileCenterPosition,
  manhattanDistance,
} from '@quantum/game-engine';

// =============================================================================
// TYPES
// =============================================================================

interface ScoredAction {
  type: ActionType;
  score: number;
  params: Record<string, unknown>;
  description: string;
}

interface AIContext {
  state: GameState;
  player: Player;
  available: AvailableActions;
  difficulty: AIDifficulty;
}

// =============================================================================
// SCORING WEIGHTS
// =============================================================================

const WEIGHTS = {
  [AIDifficulty.EASY]: {
    constructCube: 100,
    nearConstruct: 20,
    attack: 15,
    moveToOrbit: 10,
    research: 5,
    reconfigure: 3,
    randomFactor: 0.3, // Add randomness for easier AI
  },
  [AIDifficulty.MEDIUM]: {
    constructCube: 150,
    nearConstruct: 40,
    attack: 30,
    moveToOrbit: 20,
    research: 15,
    reconfigure: 5,
    randomFactor: 0.15,
  },
  [AIDifficulty.HARD]: {
    constructCube: 200,
    nearConstruct: 60,
    attack: 50,
    moveToOrbit: 35,
    research: 25,
    reconfigure: 10,
    randomFactor: 0.05,
  },
};

// =============================================================================
// AI OPPONENT CLASS
// =============================================================================

export class AIOpponent {
  private difficulty: AIDifficulty;
  
  constructor(difficulty: AIDifficulty = AIDifficulty.MEDIUM) {
    this.difficulty = difficulty;
  }
  
  /**
   * Decide the next action for the AI player
   */
  decideAction(state: GameState, playerId: string): ScoredAction | null {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return null;
    
    const available = getAvailableActions(state);
    
    const context: AIContext = {
      state,
      player,
      available,
      difficulty: this.difficulty,
    };
    
    const actions = this.scoreAllActions(context);
    
    if (actions.length === 0) {
      // No actions available, end turn
      return {
        type: ActionType.END_TURN,
        score: 0,
        params: {},
        description: 'End turn (no actions available)',
      };
    }
    
    // Sort by score descending
    actions.sort((a, b) => b.score - a.score);
    
    // Add randomness based on difficulty
    const weights = WEIGHTS[this.difficulty];
    if (weights.randomFactor > 0 && actions.length > 1) {
      // Sometimes pick a suboptimal action
      if (Math.random() < weights.randomFactor) {
        const randomIndex = Math.floor(Math.random() * Math.min(3, actions.length));
        return actions[randomIndex];
      }
    }
    
    return actions[0];
  }
  
  /**
   * Execute a full turn for the AI
   */
  async executeTurn(engine: GameEngine): Promise<void> {
    console.log('AI executeTurn started');
    const state = engine.getState();
    const playerId = state.currentPlayerId;
    const player = state.players.find(p => p.id === playerId);
    
    if (!player) return;
    
    // Keep taking actions until we run out or decide to end
    let actionsThisTurn = 0;
    const maxActions = 10; // Safety limit
    
    while (actionsThisTurn < maxActions) {
      const currentState = engine.getState();
      
      // Check if still our turn
      if (currentState.currentPlayerId !== playerId) break;
      
      const action = this.decideAction(currentState, playerId);
      
      if (!action || action.type === ActionType.END_TURN) {
        engine.endTurn(playerId);
        break;
      }
      
      // Execute the action
      const result = this.executeAction(engine, playerId, action);
      
      if (!result) {
        // Action failed, try to end turn
        engine.endTurn(playerId);
        break;
      }
      
      actionsThisTurn++;
      
      // Small delay for human players to see AI actions (optional)
      await this.delay(850);
    }
  }
  
  // ===========================================================================
  // ACTION SCORING
  // ===========================================================================
  
  private scoreAllActions(context: AIContext): ScoredAction[] {
    const actions: ScoredAction[] = [];
    
    // Score construct actions (highest priority)
    actions.push(...this.scoreConstructActions(context));
    
    // Score attack actions
    actions.push(...this.scoreAttackActions(context));
    
    // Score move actions
    actions.push(...this.scoreMoveActions(context));
    
    // Score research
    if (context.available.canResearch) {
      actions.push(this.scoreResearch(context));
    }
    
    // Score reconfigure
    actions.push(...this.scoreReconfigureActions(context));
    
    // Score deploy
    actions.push(...this.scoreDeployActions(context));
    
    return actions;
  }
  
  private scoreConstructActions(context: AIContext): ScoredAction[] {
    const actions: ScoredAction[] = [];
    const weights = WEIGHTS[context.difficulty];
    
    for (const tileId of context.available.canConstruct) {
      // Constructing a cube is almost always the best action
      let score = weights.constructCube;
      
      // Bonus if this would win the game
      if (context.player.quantumCubesRemaining === 1) {
        score += 1000;
      }
      
      actions.push({
        type: ActionType.CONSTRUCT,
        score,
        params: { tileId },
        description: `Construct cube on ${tileId}`,
      });
    }
    
    return actions;
  }
  
  private scoreAttackActions(context: AIContext): ScoredAction[] {
    const actions: ScoredAction[] = [];
    const weights = WEIGHTS[context.difficulty];
    
    for (const [shipId, targetIds] of Object.entries(context.available.canAttack)) {
      const ship = context.state.ships.find(s => s.id === shipId);
      if (!ship) continue;
      
      for (const targetId of targetIds) {
        const target = context.state.ships.find(s => s.id === targetId);
        if (!target || !target.position) continue;
        
        // Calculate expected combat outcome
        const attackerValue = ship.pipValue as number;
        const defenderValue = target.pipValue as number;
        
        // Lower values are better in combat
        // Score based on advantage
        const advantage = defenderValue - attackerValue;
        let score = weights.attack + (advantage * 5);
        
        // Bonus for attacking in orbital positions (disrupts enemy construction)
        const targetTile = context.state.tiles.find(t => {
          const orbitals = getOrbitalPositions(t);
          return orbitals.some(o => o.x === target.position!.x && o.y === target.position!.y);
        });
        if (targetTile && targetTile.quantumCube !== context.player.id) {
          score += 10;
        }
        
        // Penalty if we're likely to lose
        if (advantage < -2) {
          score -= 20;
        }
        
        actions.push({
          type: ActionType.ATTACK,
          score: Math.max(0, score),
          params: { shipId, targetPosition: target.position },
          description: `Attack ${targetId} with ${shipId}`,
        });
      }
    }
    
    return actions;
  }
  
  private scoreMoveActions(context: AIContext): ScoredAction[] {
    const actions: ScoredAction[] = [];
    const weights = WEIGHTS[context.difficulty];
    
    for (const [shipId, positions] of Object.entries(context.available.canMove)) {
      const ship = context.state.ships.find(s => s.id === shipId);
      if (!ship || !ship.position) continue;
      
      for (const position of positions) {
        let score = 0;
        
        // Check if this move puts us in orbital position
        const targetTile = context.state.tiles.find(t => {
          const orbitals = getOrbitalPositions(t);
          return orbitals.some(o => o.x === position.x && o.y === position.y);
        });
        
        if (targetTile) {
          // Bonus for moving to orbital position
          score += weights.moveToOrbit;
          
          // Extra bonus if we're close to constructing
          const shipsInOrbit = getPlayerShipsInOrbit(
            targetTile, 
            context.state.ships, 
            context.player.id
          );
          const currentSum = shipsInOrbit.reduce((s, sh) => s + (sh.pipValue as number), 0);
          const withThis = currentSum + (ship.pipValue as number);
          const diff = Math.abs(withThis - targetTile.planetNumber);
          
          if (diff === 0 && !targetTile.quantumCube) {
            score += weights.nearConstruct * 2; // Perfect sum!
          } else if (diff <= 2) {
            score += weights.nearConstruct;
          }
          
          // Prefer planets without enemy cubes
          if (targetTile.quantumCube && targetTile.quantumCube !== context.player.id) {
            score -= 5;
          }
        }
        
        // Small bonus for moving toward center of map (more options)
        const centerDist = this.distanceToMapCenter(position, context.state);
        score += Math.max(0, 5 - centerDist);
        
        if (score > 0) {
          actions.push({
            type: ActionType.MOVE,
            score,
            params: { shipId, targetPosition: position },
            description: `Move ${shipId} to (${position.x},${position.y})`,
          });
        }
      }
    }
    
    return actions;
  }
  
  private scoreResearch(context: AIContext): ScoredAction {
    const weights = WEIGHTS[context.difficulty];
    let score = weights.research;
    
    // Higher score if close to breakthrough
    const toBreakthrough = 6 - context.player.researchCounter;
    score += (6 - toBreakthrough) * 3;
    
    // Lower priority if we can construct this turn
    if (context.available.canConstruct.length > 0) {
      score -= 10;
    }
    
    return {
      type: ActionType.RESEARCH,
      score: Math.max(0, score),
      params: {},
      description: `Research (${context.player.researchCounter}/6)`,
    };
  }
  
  private scoreReconfigureActions(context: AIContext): ScoredAction[] {
    const actions: ScoredAction[] = [];
    const weights = WEIGHTS[context.difficulty];
    
    for (const shipId of context.available.canReconfigure) {
      const ship = context.state.ships.find(s => s.id === shipId);
      if (!ship || !ship.position) continue;
      
      // Check if reconfiguring could help with construction
      const orbitalTile = context.state.tiles.find(t => {
        const orbitals = getOrbitalPositions(t);
        return orbitals.some(o => o.x === ship.position!.x && o.y === ship.position!.y);
      });
      
      let score = weights.reconfigure;
      
      if (orbitalTile && !orbitalTile.quantumCube) {
        const shipsInOrbit = getPlayerShipsInOrbit(
          orbitalTile,
          context.state.ships,
          context.player.id
        );
        const currentSum = shipsInOrbit.reduce((s, sh) => s + (sh.pipValue as number), 0);
        const needed = orbitalTile.planetNumber - (currentSum - (ship.pipValue as number));
        
        // If we need a specific value and it's achievable (1-6)
        if (needed >= 1 && needed <= 6 && needed !== ship.pipValue) {
          score += weights.nearConstruct;
        }
      }
      
      actions.push({
        type: ActionType.RECONFIGURE,
        score,
        params: { shipId },
        description: `Reconfigure ${shipId}`,
      });
    }
    
    return actions;
  }
  
  private scoreDeployActions(context: AIContext): ScoredAction[] {
    const actions: ScoredAction[] = [];
    
    if (context.player.scrapyard.length === 0) return actions;
    
    for (const position of context.available.canDeploy) {
      let score = 15; // Base deploy score
      
      // Check which tile this deploys to
      const tile = context.state.tiles.find(t => {
        const orbitals = getOrbitalPositions(t);
        return orbitals.some(o => o.x === position.x && o.y === position.y);
      });
      
      if (tile) {
        // Check if this helps with construction
        const shipsInOrbit = getPlayerShipsInOrbit(tile, context.state.ships, context.player.id);
        const currentSum = shipsInOrbit.reduce((s, sh) => s + (sh.pipValue as number), 0);
        
        if (currentSum < tile.planetNumber) {
          score += 10;
        }
      }
      
      actions.push({
        type: ActionType.DEPLOY,
        score,
        params: { shipIndex: 0, targetPosition: position },
        description: `Deploy to (${position.x},${position.y})`,
      });
    }
    
    return actions;
  }
  
  // ===========================================================================
  // ACTION EXECUTION
  // ===========================================================================
  
  private executeAction(engine: GameEngine, playerId: string, action: ScoredAction): boolean {
    switch (action.type) {
      case ActionType.CONSTRUCT:
        return engine.construct(playerId, action.params.tileId as string).success;
        
      case ActionType.ATTACK:
        return engine.attack(
          playerId,
          action.params.shipId as string,
          action.params.targetPosition as Position,
          true
        ).success;
        
      case ActionType.MOVE:
        return engine.move(
          playerId,
          action.params.shipId as string,
          action.params.targetPosition as Position
        ).success;
        
      case ActionType.RESEARCH:
        return engine.research(playerId).success;
        
      case ActionType.RECONFIGURE:
        return engine.reconfigure(playerId, action.params.shipId as string).success;
        
      case ActionType.DEPLOY:
        return engine.deploy(
          playerId,
          action.params.shipIndex as number,
          action.params.targetPosition as Position
        ).success;
        
      default:
        return false;
    }
  }
  
  // ===========================================================================
  // UTILITIES
  // ===========================================================================
  
  private distanceToMapCenter(pos: Position, state: GameState): number {
    // Find approximate center of all tiles
    let sumX = 0, sumY = 0;
    for (const tile of state.tiles) {
      const center = getTileCenterPosition(tile);
      sumX += center.x;
      sumY += center.y;
    }
    const centerX = sumX / state.tiles.length;
    const centerY = sumY / state.tiles.length;
    
    return Math.abs(pos.x - centerX) + Math.abs(pos.y - centerY);
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export function createAI(difficulty: AIDifficulty = AIDifficulty.MEDIUM): AIOpponent {
  return new AIOpponent(difficulty);
}
