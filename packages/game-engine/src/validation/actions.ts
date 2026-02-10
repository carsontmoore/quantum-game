/**
 * Action Validation
 * 
 * Validates whether actions are legal given the current game state.
 */

import {
  GameState,
  GameStatus,
  TurnPhase,
  ActionType,
  ActionValidation,
  AvailableActions,
  ShipType,
  Position,
  Ship,
} from '@quantum/types';
import {
  getPlayer,
  getCurrentPlayer,
  getShip,
  getPlayerShips,
  getDeployedShips,
  getTile,
} from '../utils/state.js';
import {
  getOrbitalPositions,
  getAdjacentPositions,
  positionsEqual,
  isValidPosition,
  getShipAtPosition,
  findReachablePositions,
  positionKey,
  getPlayerShipsInOrbit,
  getTileCenterPosition,
  getDiagonalPositions,
} from '../utils/board.js';

// =============================================================================
// BASIC VALIDATION
// =============================================================================

/**
 * Check if it's the player's turn
 */
export function isPlayerTurn(state: GameState, playerId: string): boolean {
  return state.currentPlayerId === playerId;
}

/**
 * Check if game is in progress
 */
export function isGameInProgress(state: GameState): boolean {
  return state.status === GameStatus.IN_PROGRESS;
}

/**
 * Check if currently in action phase
 */
export function isActionPhase(state: GameState): boolean {
  return state.currentPhase === TurnPhase.ACTIONS;
}

/**
 * Check if currently in advance cards phase
 */
export function isAdvanceCardsPhase(state: GameState): boolean {
  return state.currentPhase === TurnPhase.ADVANCE_CARDS;
}

// =============================================================================
// ACTION-SPECIFIC VALIDATION
// =============================================================================

/**
 * Validate Reconfigure action
 * - Must have actions remaining
 * - Ship must be deployed (on board)
 * - Ship must be owned by player
 */
export function validateReconfigure(
  state: GameState,
  playerId: string,
  shipId: string
): ActionValidation {
  if (!isGameInProgress(state)) {
    return { valid: false, reason: 'Game is not in progress' };
  }
  
  if (!isPlayerTurn(state, playerId)) {
    return { valid: false, reason: 'Not your turn' };
  }
  
  if (!isActionPhase(state)) {
    return { valid: false, reason: 'Not in action phase' };
  }
  
  const player = getPlayer(state, playerId);
  if (!player || player.actionsRemaining < 1) {
    return { valid: false, reason: 'No actions remaining' };
  }
  
  const ship = getShip(state, shipId);
  if (!ship) {
    return { valid: false, reason: 'Ship not found' };
  }
  
  if (ship.ownerId !== playerId) {
    return { valid: false, reason: 'Ship not owned by player' };
  }
  
  if (!ship.position) {
    return { valid: false, reason: 'Ship is not deployed' };
  }
  
  return { valid: true };
}

/**
 * Validate Deploy action
 * - Must have actions remaining
 * - Must have ships in scrapyard
 * - Target position must be orbital position of a planet with player's cube
 * - Target position must be empty
 */
export function validateDeploy(
  state: GameState,
  playerId: string,
  targetPosition: Position
): ActionValidation {
  if (!isGameInProgress(state)) {
    return { valid: false, reason: 'Game is not in progress' };
  }
  
  if (!isPlayerTurn(state, playerId)) {
    return { valid: false, reason: 'Not your turn' };
  }
  
  if (!isActionPhase(state)) {
    return { valid: false, reason: 'Not in action phase' };
  }
  
  const player = getPlayer(state, playerId);
  if (!player || player.actionsRemaining < 1) {
    return { valid: false, reason: 'No actions remaining' };
  }
  
  if (player.scrapyard.length === 0) {
    return { valid: false, reason: 'No ships in scrapyard' };
  }
  
  // Find tile where this position is orbital
  const tile = state.tiles.find(t => {
    const orbitals = getOrbitalPositions(t);
    return orbitals.some(pos => positionsEqual(pos, targetPosition));
  });
  
  if (!tile) {
    return { valid: false, reason: 'Target is not an orbital position' };
  }
  
  if (tile.quantumCube !== playerId) {
    return { valid: false, reason: 'You do not have a quantum cube on this planet' };
  }
  
  // Check position is empty
  const shipAtPosition = getShipAtPosition(targetPosition, state.ships);
  if (shipAtPosition) {
    return { valid: false, reason: 'Position is occupied' };
  }
  
  return { valid: true };
}

/**
 * Validate Move action
 * - Must have actions remaining
 * - Ship must be deployed and owned by player
 * - Ship must not have moved this turn
 * - Target must be reachable
 */
export function validateMove(
  state: GameState,
  playerId: string,
  shipId: string,
  targetPosition: Position
): ActionValidation {
  if (!isGameInProgress(state)) {
    return { valid: false, reason: 'Game is not in progress' };
  }
  
  if (!isPlayerTurn(state, playerId)) {
    return { valid: false, reason: 'Not your turn' };
  }
  
  if (!isActionPhase(state)) {
    return { valid: false, reason: 'Not in action phase' };
  }
  
  const player = getPlayer(state, playerId);
  if (!player || player.actionsRemaining < 1) {
    return { valid: false, reason: 'No actions remaining' };
  }
  
  const ship = getShip(state, shipId);
  if (!ship) {
    return { valid: false, reason: 'Ship not found' };
  }
  
  if (ship.ownerId !== playerId) {
    return { valid: false, reason: 'Ship not owned by player' };
  }
  
  if (!ship.position) {
    return { valid: false, reason: 'Ship is not deployed' };
  }
  
  if (ship.hasMovedThisTurn) {
    return { valid: false, reason: 'Ship has already moved this turn' };
  }
  
  // Check if Interceptor with Maneuver ability
  const allowDiagonal = ship.pipValue === ShipType.INTERCEPTOR;
  
  const reachable = findReachablePositions(ship, state, allowDiagonal);
  if (!reachable.has(positionKey(targetPosition))) {
    return { valid: false, reason: 'Target position not reachable' };
  }
  
  // Check if target has enemy ship (would be attack, not move)
  const targetShip = getShipAtPosition(targetPosition, state.ships);
  if (targetShip && targetShip.ownerId !== playerId) {
    return { valid: false, reason: 'Target has enemy ship - use Attack action' };
  }
  
  return { valid: true };
}

/**
 * Validate Attack action
 * - Must have actions remaining
 * - Ship must be deployed and owned by player
 * - Ship must not have moved this turn
 * - Target must be reachable and contain enemy ship
 */
export function validateAttack(
  state: GameState,
  playerId: string,
  shipId: string,
  targetPosition: Position
): ActionValidation {
  if (!isGameInProgress(state)) {
    return { valid: false, reason: 'Game is not in progress' };
  }
  
  if (!isPlayerTurn(state, playerId)) {
    return { valid: false, reason: 'Not your turn' };
  }
  
  if (!isActionPhase(state)) {
    return { valid: false, reason: 'Not in action phase' };
  }
  
  const player = getPlayer(state, playerId);
  if (!player || player.actionsRemaining < 1) {
    return { valid: false, reason: 'No actions remaining' };
  }
  
  const ship = getShip(state, shipId);
  if (!ship) {
    return { valid: false, reason: 'Ship not found' };
  }
  
  if (ship.ownerId !== playerId) {
    return { valid: false, reason: 'Ship not owned by player' };
  }
  
  if (!ship.position) {
    return { valid: false, reason: 'Ship is not deployed' };
  }
  
  if (ship.hasMovedThisTurn) {
    return { valid: false, reason: 'Ship has already moved this turn' };
  }
  
  // Check if Interceptor with Maneuver ability
  const allowDiagonal = ship.pipValue === ShipType.INTERCEPTOR;
  
  const reachable = findReachablePositions(ship, state, allowDiagonal);
  if (!reachable.has(positionKey(targetPosition))) {
    return { valid: false, reason: 'Target position not reachable' };
  }
  
  // Check target has enemy ship
  const targetShip = getShipAtPosition(targetPosition, state.ships);
  if (!targetShip) {
    return { valid: false, reason: 'No ship at target position' };
  }
  
  if (targetShip.ownerId === playerId) {
    return { valid: false, reason: 'Cannot attack own ship' };
  }
  
  return { valid: true };
}

/**
 * Validate Construct action
 * - Must have 2 actions remaining (or 1 with Industrious card)
 * - Tile must not already have a quantum cube
 * - Player's ships in orbit must sum exactly to planet number
 */
export function validateConstruct(
  state: GameState,
  playerId: string,
  tileId: string
): ActionValidation {
  if (!isGameInProgress(state)) {
    return { valid: false, reason: 'Game is not in progress' };
  }
  
  if (!isPlayerTurn(state, playerId)) {
    return { valid: false, reason: 'Not your turn' };
  }
  
  if (!isActionPhase(state)) {
    return { valid: false, reason: 'Not in action phase' };
  }
  
  const player = getPlayer(state, playerId);
  if (!player) {
    return { valid: false, reason: 'Player not found' };
  }

  const actionCost = 2;
  
  if (player.actionsRemaining < actionCost) {
    return { valid: false, reason: `Need 2 actions to construct` };
  }
  
  if (player.quantumCubesRemaining < 1) {
    return { valid: false, reason: 'No quantum cubes remaining' };
  }
  
  const tile = getTile(state, tileId);
  if (!tile) {
    return { valid: false, reason: 'Tile not found' };
  }
  
  if (tile.quantumCube !== null) {
    return { valid: false, reason: 'Planet already has a quantum cube' };
  }
  
  // Calculate sum of player's ships in orbit
  const shipsInOrbit = getPlayerShipsInOrbit(tile, state.ships, playerId);
  let shipSum = shipsInOrbit.reduce((sum, ship) => sum + (ship.pipValue as number), 0);

  // Check for Ingenious card - corner ships count toward construct value
  const hasIngenious = player.activeCommandCards.some(
    c => c.id.toString().split('-')[0].toLowerCase() === 'ingenious'
  );
  
  if (hasIngenious) {
    const cornerPositions = getDiagonalPositions(tile.position);
    const cornerShips = state.ships.filter(s => 
      s.ownerId === playerId &&
      s.position && 
      cornerPositions.some(cp => cp.x === s.position!.x && cp.y === s.position!.y)
    );
    const cornerSum = cornerShips.reduce((sum, ship) => sum + (ship.pipValue as number), 0);
    shipSum += cornerSum;
  }
  
  // Check for Intelligent card 
  const hasIntelligent = player.activeCommandCards.some(
    c => c.id.toString().split('-')[0].toLowerCase() === 'intelligent'
  );
  if (hasIntelligent) {
    if(shipSum < tile.planetNumber - 1 || shipSum > tile.planetNumber + 1) {
      return {
        valid: false,
        reason: `Ships sum to ${shipSum}, need within +/- 1 of ${tile.planetNumber}`
      };
    }
  } else {
      if (shipSum !== tile.planetNumber) {
        return { 
          valid: false, 
          reason: `Ships sum to ${shipSum}, need exactly ${tile.planetNumber}` 
        };
      }
    }  
  return { valid: true };
}

/**
 * Validate Research action
 * - Must have actions remaining
 * - Research counter must be less than 6 (or allow breakthrough)
 */
export function validateResearch(
  state: GameState,
  playerId: string
): ActionValidation {
  if (!isGameInProgress(state)) {
    return { valid: false, reason: 'Game is not in progress' };
  }
  
  if (!isPlayerTurn(state, playerId)) {
    return { valid: false, reason: 'Not your turn' };
  }
  
  if (!isActionPhase(state)) {
    return { valid: false, reason: 'Not in action phase' };
  }
  
  const player = getPlayer(state, playerId);
  if (!player || player.actionsRemaining < 1) {
    return { valid: false, reason: 'No actions remaining' };
  }
  
  // Research can always be performed (6 triggers breakthrough)
  return { valid: true };
}

/**
 * Validate ability use
 */
export function validateUseAbility(
  state: GameState,
  playerId: string,
  shipId: string
): ActionValidation {
  if (!isGameInProgress(state)) {
    return { valid: false, reason: 'Game is not in progress' };
  }
  
  if (!isPlayerTurn(state, playerId)) {
    return { valid: false, reason: 'Not your turn' };
  }
  
  if (!isActionPhase(state)) {
    return { valid: false, reason: 'Not in action phase' };
  }
  
  const ship = getShip(state, shipId);
  if (!ship) {
    return { valid: false, reason: 'Ship not found' };
  }
  
  if (ship.ownerId !== playerId) {
    return { valid: false, reason: 'Ship not owned by player' };
  }
  
  if (!ship.position) {
    return { valid: false, reason: 'Ship is not deployed' };
  }
  
  if (ship.hasUsedAbilityThisTurn) {
    return { valid: false, reason: 'Ship has already used ability this turn' };
  }
  
  // Ability-specific validations would go here
  // For now, just check that ability can be used
  
  return { valid: true };
}

/**
 * Validate end turn
 */
export function validateEndTurn(
  state: GameState,
  playerId: string
): ActionValidation {
  if (!isGameInProgress(state)) {
    return { valid: false, reason: 'Game is not in progress' };
  }
  
  if (!isPlayerTurn(state, playerId)) {
    return { valid: false, reason: 'Not your turn' };
  }
  
  // Can end turn during either phase
  return { valid: true };
}

// =============================================================================
// AVAILABLE ACTIONS CALCULATOR
// =============================================================================

/**
 * Calculate all available actions for the current player
 */
export function getAvailableActions(state: GameState): AvailableActions {
  const player = getCurrentPlayer(state);
  const playerId = player.id;
  
  const available: AvailableActions = {
    canReconfigure: [],
    canDeploy: [],
    canMove: {},
    canAttack: {},
    canConstruct: [],
    canResearch: false,
    canUseAbility: {},
    canEndTurn: true,
  };
  
  if (state.status !== GameStatus.IN_PROGRESS) {
    return available;
  }
  
  const deployedShips = getDeployedShips(state, playerId);
  
  // Check each ship for valid actions
  for (const ship of deployedShips) {
    // Reconfigure
    if (validateReconfigure(state, playerId, ship.id).valid) {
      available.canReconfigure.push(ship.id);
    }
    
    // Move / Attack
    const hasAgile = player.activeCommandCards.some(
      c => c.id.toString().split('-')[0].toLowerCase() === 'agile'
    );
    const hasEnergetic = player.activeCommandCards.some(
      c => c.id.toString().split('-')[0].toLowerCase() === 'energetic'
    );
    const bonusRange = hasAgile ? 1 : 0;

    if ((!ship.hasMovedThisTurn || hasEnergetic) && player.actionsRemaining >= 1) {
      const allowDiagonal = ship.pipValue === ShipType.INTERCEPTOR;
      const reachable = findReachablePositions(ship, state, allowDiagonal, bonusRange);
      
      const movePositions: Position[] = [];
      const attackTargets: string[] = [];
      
      for (const [key] of reachable) {
        const pos = { 
          x: parseInt(key.split(',')[0]), 
          y: parseInt(key.split(',')[1]) 
        };
        const targetShip = getShipAtPosition(pos, state.ships);
        
        if (targetShip && targetShip.ownerId !== playerId) {
          attackTargets.push(targetShip.id);
        } else if (!targetShip) {
          movePositions.push(pos);
        }
      }
      
      if (movePositions.length > 0) {
        available.canMove[ship.id] = movePositions;
      }
      if (attackTargets.length > 0) {
        available.canAttack[ship.id] = attackTargets;
      }
    }
    
    // Use Ability
    if (validateUseAbility(state, playerId, ship.id).valid) {
      available.canUseAbility[ship.id] = true;
    }
  }
  
  // Deploy positions
  const hasStealthy = player.activeCommandCards.some(
    c => c.id.toString().split('-')[0].toLowerCase() === 'stealthy'
  );

  if (player.scrapyard.length > 0 && player.actionsRemaining >= 1) {
    if (hasStealthy) {
      // Stealthy: deploy to any orbital position not adjacent to any ship
      for (const tile of state.tiles) {
        const orbitals = getOrbitalPositions(tile);
        for (const pos of orbitals) {
          if (!getShipAtPosition(pos, state.ships)) {
            const hasAdjacentShip = state.ships.some(s => {
              if (!s.position) return false; 
              const adjacentPositions = getAdjacentPositions(pos);
              return adjacentPositions.some(adj => adj.x === s.position!.x && adj.y === s.position!.y);
          });
            if (!hasAdjacentShip) {
              available.canDeploy.push(pos);
            }
          }
        }
      }
    } else {
      // Normal: deploy to orbital positions on planets with player's cube
      for (const tile of state.tiles) {
        if (tile.quantumCube === playerId) {
          const orbitals = getOrbitalPositions(tile);
          for (const pos of orbitals) {
            if (!getShipAtPosition(pos, state.ships)) {
              available.canDeploy.push(pos);
            }
          }
        }       
      }
    }
  }

  if (player.scrapyard.length > 0 && player.actionsRemaining >= 1) {
    for (const tile of state.tiles) {
      if (tile.quantumCube === playerId) {
        const orbitals = getOrbitalPositions(tile);
        for (const pos of orbitals) {
          if (!getShipAtPosition(pos, state.ships)) {
            available.canDeploy.push(pos);
          }
        }
      }
    }
  }
  
  // Construct
  for (const tile of state.tiles) {
    if (validateConstruct(state, playerId, tile.id).valid) {
      available.canConstruct.push(tile.id);
    }
  }
  
  // Research
  available.canResearch = validateResearch(state, playerId).valid;
  
  return available;
}
