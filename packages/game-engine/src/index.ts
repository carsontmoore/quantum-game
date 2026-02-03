/**
 * Quantum Game Engine
 * 
 * The core game engine that processes actions and manages game state.
 * This is a pure TypeScript module with no frontend/backend dependencies.
 */

import {
  GameState,
  GameStatus,
  TurnPhase,
  ActionType,
  GameAction,
  GameEvent,
  GameEventType,
  Result,
  ShipType,
  Position,
  Ship,
  Player,
  CombatResult,
  ReconfigureAction,
  DeployAction,
  MoveAction,
  AttackAction,
  ConstructAction,
  ResearchAction,
  EndTurnAction,
  CardType,
  GambitCardId,
  AdvanceCard,
} from '@quantum/types';
import {
  cloneState,
  getPlayer,
  getCurrentPlayer,
  getShip,
  getTile,
  getDeployedShips,
  generateId,
} from './utils/state.js';
import {
  rollDie,
  rollDifferent,
  calculateCombatResult,
} from './utils/dice.js';
import {
  validateReconfigure,
  validateDeploy,
  validateMove,
  validateAttack,
  validateConstruct,
  validateResearch,
  validateEndTurn,
  getAvailableActions,
} from './validation/actions.js';
import {
  positionsEqual,
  getMovePath,
  getShipAtPosition,
  getOrbitalPositions,
} from './utils/board.js';

// =============================================================================
// TYPES
// =============================================================================

export type EventHandler = (event: GameEvent) => void;

export interface EngineOptions {
  onEvent?: EventHandler;
}

// =============================================================================
// GAME ENGINE
// =============================================================================

export class GameEngine {
  private state: GameState;
  private onEvent?: EventHandler;
  
  constructor(initialState: GameState, options: EngineOptions = {}) {
    this.state = cloneState(initialState);
    this.onEvent = options.onEvent;
  }
  
  // Private Helpers
  private hasCommandCard(player: Player, cardName: string): boolean {
    return player.activeCommandCards.some(
      c => c.id.toString().split('-')[0].toLowerCase() === cardName.toLowerCase()
    );
  }

  // ===========================================================================
  // STATE ACCESS
  // ===========================================================================
  
  getState(): GameState {
    return cloneState(this.state);
  }
  
  getAvailableActions() {
    return getAvailableActions(this.state);
  }
  
  getCurrentPlayer(): Player {
    return getCurrentPlayer(this.state);
  }
  
  // ===========================================================================
  // EVENT EMISSION
  // ===========================================================================
  
  private emit(event: GameEvent): void {
    if (this.onEvent) {
      this.onEvent(event);
    }
  }
  
  // ===========================================================================
  // RESET TURN FLAGS
  // ===========================================================================

  resetTurnFlags(playerId: string): void {
  const player = getPlayer(this.state, playerId);
  if (player) {
    player.cubesPlacedThisTurn = 0;
    player.achievedBreakthroughThisTurn = false;
  }
}

  // ===========================================================================
  // Start Turn
  // ===========================================================================

  startTurn(playerId: string): Result<GameState> {
    const player = getPlayer(this.state, playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    // Reset turn flags
    player.hasUsedFlexibleThiisTurn = false;
    player.bonusMoves = 0;

    // Brilliant: +2 research at turn start
    if (this.hasCommandCard(player, 'brilliant')) {
      player.researchCounter += 2;
    
      // Check for breakthrough
      if (player.researchCounter >= 6) {
        player.researchCounter -= 6;
        player.achievedBreakthroughThisTurn = true;
      }
    }

    // Curious: +1 free peaceful move (tracked separately)
    if (this.hasCommandCard(player, 'curious')) {
      player.bonusMoves = 1;
    } 

    
    this.state.updatedAt = new Date();
    return { success: true, data: this.getState() };
  }

  // ===========================================================================
  // ACTION: RECONFIGURE
  // ===========================================================================
  
  reconfigure(playerId: string, shipId: string): Result<GameState> {
    const validation = validateReconfigure(this.state, playerId, shipId);
    if (!validation.valid) {
      return { success: false, error: validation.reason! };
    }
    
    const ship = getShip(this.state, shipId)!;
    const previousValue = ship.pipValue;
    const newValue = rollDifferent(previousValue);
    
    ship.pipValue = newValue;
    
    const player = getPlayer(this.state, playerId)!;
    player.actionsRemaining -= 1;
    
    const action: ReconfigureAction = {
      type: ActionType.RECONFIGURE,
      playerId,
      timestamp: new Date(),
      shipId,
      previousValue,
      newValue,
    };
    this.state.actionLog.push(action);
    this.state.updatedAt = new Date();
    
    this.emit({
      type: GameEventType.ACTION_PERFORMED,
      gameId: this.state.id,
      playerId,
      data: { action },
      timestamp: new Date(),
    });
    
    return { success: true, data: this.getState() };
  }
  
  // ===========================================================================
  // ACTION: DEPLOY
  // ===========================================================================
  
  deploy(playerId: string, shipIndex: number, targetPosition: Position): Result<GameState> {
    const validation = validateDeploy(this.state, playerId, targetPosition);
    if (!validation.valid) {
      return { success: false, error: validation.reason! };
    }
    
    const player = getPlayer(this.state, playerId)!;
    
    if (shipIndex < 0 || shipIndex >= player.scrapyard.length) {
      return { success: false, error: 'Invalid ship index' };
    }
    
    const shipValue = player.scrapyard.splice(shipIndex, 1)[0];
    
    const newShip: Ship = {
      id: generateId('ship-'),
      ownerId: playerId,
      pipValue: shipValue,
      position: targetPosition,
      hasMovedThisTurn: false,
      hasUsedAbilityThisTurn: false,
      isCarried: false,
      carriedById: null,
    };
    
    this.state.ships.push(newShip);
    const hasEager = this.hasCommandCard(player, 'eager');
    if (!hasEager) {
      player.actionsRemaining -= 1;
    }
    
    
    const action: DeployAction = {
      type: ActionType.DEPLOY,
      playerId,
      timestamp: new Date(),
      shipIndex,
      shipValue,
      targetPosition,
    };
    this.state.actionLog.push(action);
    this.state.updatedAt = new Date();
    
    this.emit({
      type: GameEventType.ACTION_PERFORMED,
      gameId: this.state.id,
      playerId,
      data: { action },
      timestamp: new Date(),
    });
    
    return { success: true, data: this.getState() };
  }
  
  // ===========================================================================
  // ACTION: Free DEPLOY
  // ===========================================================================

  freeDeploy(playerId: string, shipIndex: number, targetPosition: Position): Result<GameState> {
    const player = getPlayer(this.state, playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }
    
    if (player.scrapyard.length <= shipIndex) {
      return { success: false, error: 'Invalid scrapyard index' };
    }
    
    const tile = this.state.tiles.find(t => {
      const orbitals = getOrbitalPositions(t);
      return orbitals.some(pos => pos.x === targetPosition.x && pos.y === targetPosition.y);
    });
    
    if (!tile || tile.quantumCube !== playerId) {
      return { success: false, error: 'Invalid deploy position' };
    }
    
    if (getShipAtPosition(targetPosition, this.state.ships)) {
      return { success: false, error: 'Position occupied' };
    }
    
    const shipValue = player.scrapyard.splice(shipIndex, 1)[0];
    
    const newShip: Ship = {
      id: generateId('ship-'),
      ownerId: playerId,
      pipValue: shipValue,
      position: targetPosition,
      hasMovedThisTurn: false,
      hasUsedAbilityThisTurn: false,
      isCarried: false,
      carriedById: null,
    };
    
    this.state.ships.push(newShip);
    this.state.updatedAt = new Date(); 
    
    return { success: true, data: this.getState() };
  }

  // ===========================================================================
  // ACTION: MOVE
  // ===========================================================================
  
  move(playerId: string, shipId: string, targetPosition: Position): Result<GameState> {
    const validation = validateMove(this.state, playerId, shipId, targetPosition);
    if (!validation.valid) {
      return { success: false, error: validation.reason! };
    }
    
    const ship = getShip(this.state, shipId)!;
    const fromPosition = ship.position!;
    
    const allowDiagonal = ship.pipValue === ShipType.INTERCEPTOR;
    const path = getMovePath(ship, targetPosition, this.state, allowDiagonal);
    
    ship.position = targetPosition;
    ship.hasMovedThisTurn = true;
    
    const player = getPlayer(this.state, playerId)!;
    const enemyAtDestination = getShipAtPosition(targetPosition, this.state.ships);
    const isPeacefulMove = !enemyAtDestination || enemyAtDestination.ownerId === playerId;
    
    // Use bonus move if available and move is peaceful
    if (isPeacefulMove && player.bonusMoves > 0) {
      player.bonusMoves -= 1;
      // Don't deduct action 
    } else {
      player.actionsRemaining -= 1;
    }
    
    const action: MoveAction = {
      type: ActionType.MOVE,
      playerId,
      timestamp: new Date(),
      shipId,
      fromPosition,
      toPosition: targetPosition,
      path: path || [targetPosition],
    };
    this.state.actionLog.push(action);
    this.state.updatedAt = new Date();
    
    this.emit({
      type: GameEventType.ACTION_PERFORMED,
      gameId: this.state.id,
      playerId,
      data: { action },
      timestamp: new Date(),
    });
    
    return { success: true, data: this.getState() };
  }
  
  // ===========================================================================
  // ACTION: ATTACK
  // ===========================================================================
  
  attack(
    playerId: string, 
    shipId: string, 
    targetPosition: Position,
    moveToTarget: boolean = true
  ): { success: true; data: GameState; combatResult: CombatResult } | { success: false; error: string } {
    const validation = validateAttack(this.state, playerId, shipId, targetPosition);
    if (!validation.valid) {
      return { success: false, error: validation.reason! };
    }
    
    const attackerShip = getShip(this.state, shipId)!;
    const defenderShip = getShipAtPosition(targetPosition, this.state.ships)!;
    const attackerOrigin = attackerShip.position!;
    
    // Roll combat dice
    const attackerRoll = rollDie();
    const defenderRoll = rollDie();
    
    const { winner, attackerTotal, defenderTotal } = calculateCombatResult(
      attackerShip.pipValue,
      defenderShip.pipValue,
      attackerRoll,
      defenderRoll
    );
    
    let defenderNewPipValue: ShipType | null = null;
    let attackerFinalPosition: Position;
    
    if (winner === 'attacker') {
      // Defender is destroyed
      defenderNewPipValue = rollDie();
      
      // Move defender to scrapyard
      const defenderPlayer = getPlayer(this.state, defenderShip.ownerId)!;
      defenderPlayer.scrapyard.push(defenderNewPipValue);
      defenderPlayer.dominanceCounter -= 1;
      
      // Remove defender from board
      const defenderIndex = this.state.ships.findIndex(s => s.id === defenderShip.id);
      this.state.ships.splice(defenderIndex, 1);
      
      // Update attacker position based on choice
      attackerFinalPosition = moveToTarget ? targetPosition : attackerOrigin;
      attackerShip.position = attackerFinalPosition;
      
      // Update attacker's dominance
      const attackerPlayer = getPlayer(this.state, playerId)!;
      attackerPlayer.dominanceCounter += 1;
    } else {
      // Defender wins - attacker stays in place
      attackerFinalPosition = attackerOrigin;
    }
    
    attackerShip.hasMovedThisTurn = true;
    
    const player = getPlayer(this.state, playerId)!;
    player.actionsRemaining -= 1;
    
    const combatResult: CombatResult = {
      attackerRoll,
      defenderRoll,
      attackerTotal,
      defenderTotal,
      winner,
      attackerFinalPosition,
      defenderNewPipValue,
      effectsApplied: [],
    };
    
    const action: AttackAction = {
      type: ActionType.ATTACK,
      playerId,
      timestamp: new Date(),
      shipId,
      fromPosition: attackerOrigin,
      targetPosition,
      targetShipId: defenderShip.id,
      combatResult,
      targetPlayerId: defenderShip.ownerId,
    };
    this.state.actionLog.push(action);
    this.state.updatedAt = new Date();
    
    this.emit({
      type: GameEventType.COMBAT_RESOLVED,
      gameId: this.state.id,
      playerId,
      data: { action, combatResult },
      timestamp: new Date(),
    });
    
    return { success: true, data: this.getState(), combatResult };
  }
  
  // ===========================================================================
  // ACTION: CONSTRUCT
  // ===========================================================================
  
  construct(playerId: string, tileId: string): Result<GameState> {
    const validation = validateConstruct(this.state, playerId, tileId);
    if (!validation.valid) {
      return { success: false, error: validation.reason! };
    }
    
    const player = getPlayer(this.state, playerId)!;
    const tile = getTile(this.state, tileId)!;
    

    
    // Place cube
    tile.quantumCube = playerId;
    player.quantumCubesRemaining -= 1;
    player.actionsRemaining -= 1;
    player.cubesPlacedThisTurn += 1;
    
    const action: ConstructAction = {
      type: ActionType.CONSTRUCT,
      playerId,
      timestamp: new Date(),
      tileId,
      shipIds: [], // Could track which ships were in orbit
    };
    this.state.actionLog.push(action);
    this.state.updatedAt = new Date();
    
    this.emit({
      type: GameEventType.CUBE_PLACED,
      gameId: this.state.id,
      playerId,
      data: { tileId, cubesRemaining: player.quantumCubesRemaining },
      timestamp: new Date(),
    });
    
    // Check for win condition
    if (player.quantumCubesRemaining === 0) {
      this.state.status = GameStatus.FINISHED;
      this.state.winnerId = playerId;
      this.state.finishedAt = new Date();
      
      this.emit({
        type: GameEventType.GAME_ENDED,
        gameId: this.state.id,
        playerId,
        data: { winner: playerId },
        timestamp: new Date(),
      });
    }
    
    return { success: true, data: this.getState() };
  }
  
  // ===========================================================================
  // ACTION: RESEARCH
  // ===========================================================================
  
  research(playerId: string): Result<GameState> {
    const validation = validateResearch(this.state, playerId);
    if (!validation.valid) {
      return { success: false, error: validation.reason! };
    }
    
    const player = getPlayer(this.state, playerId)!;
    const previousValue = player.researchCounter;
    
    // Check for Brilliant card
    const hasBrilliant = player.activeCommandCards.some(c => c.name === 'Brilliant');
    const increment = hasBrilliant ? 2 : 1;

    // Check for Precocious card
    const hasPrecocious = this.hasCommandCard(player, 'precocious');
    const breakthroughThreshold = hasPrecocious ? 4 : 6;
    
    let newValue = previousValue + increment;
    let breakthrough = false;
    
    if (newValue >= breakthroughThreshold) {
      breakthrough = true;
      player.achievedBreakthroughThisTurn = true;
      newValue = 1; // Reset after breakthrough
    }
    
    player.researchCounter = newValue;
    player.actionsRemaining -= 1;
    
    const action: ResearchAction = {
      type: ActionType.RESEARCH,
      playerId,
      timestamp: new Date(),
      previousValue,
      newValue,
      breakthrough,
    };
    this.state.actionLog.push(action);
    this.state.updatedAt = new Date();
    
    if (breakthrough) {
      this.emit({
        type: GameEventType.BREAKTHROUGH_ACHIEVED,
        gameId: this.state.id,
        playerId,
        data: {},
        timestamp: new Date(),
      });
    }
    
    this.emit({
      type: GameEventType.ACTION_PERFORMED,
      gameId: this.state.id,
      playerId,
      data: { action },
      timestamp: new Date(),
    });
    
    return { success: true, data: this.getState() };
  }
  
  // ===========================================================================
  // ACTION: END TURN
  // ===========================================================================
  
  endTurn(playerId: string): Result<GameState> {
    const validation = validateEndTurn(this.state, playerId);
    if (!validation.valid) {
      return { success: false, error: validation.reason! };
    }
    
    const player = getPlayer(this.state, playerId)!;
    
    // Calculate cards earned this turn
    let cardsEarned = player.cubesPlacedThisTurn;
    if (player.achievedBreakthroughThisTurn) {
      cardsEarned += 1;
    }
    
    // TODO: Handle advance card selection phase if cards earned > 0
    // For now, skip to next turn
    
    // Reset turn state for current player
    player.cubesPlacedThisTurn = 0;
    player.achievedBreakthroughThisTurn = false;
    
    // Reset ships for current player
    for (const ship of this.state.ships) {
      if (ship.ownerId === playerId) {
        ship.hasMovedThisTurn = false;
        ship.hasUsedAbilityThisTurn = false;
      }
    }
    
    // Advance to next player
    const currentIndex = this.state.turnOrder.indexOf(playerId);
    const nextIndex = (currentIndex + 1) % this.state.turnOrder.length;
    const nextPlayerId = this.state.turnOrder[nextIndex];
    
    // If we've wrapped around, increment turn number
    if (nextIndex === 0) {
      this.state.turnNumber += 1;
    }
    
    this.state.currentPlayerId = nextPlayerId;
    this.state.currentPhase = TurnPhase.ACTIONS;
    
    // Reset next player's actions
    const nextPlayer = getPlayer(this.state, nextPlayerId)!;
    
    // Check for Resourceful card
    const hasResourceful = nextPlayer.activeCommandCards.some(c => c.name === 'Resourceful');
    nextPlayer.actionsRemaining = hasResourceful ? 4 : 3;
    
    const action: EndTurnAction = {
      type: ActionType.END_TURN,
      playerId,
      timestamp: new Date(),
      cardsEarned,
    };
    this.state.actionLog.push(action);
    this.state.updatedAt = new Date();
    
    this.emit({
      type: GameEventType.TURN_ENDED,
      gameId: this.state.id,
      playerId,
      data: { cardsEarned },
      timestamp: new Date(),
    });
    
    this.emit({
      type: GameEventType.TURN_STARTED,
      gameId: this.state.id,
      playerId: nextPlayerId,
      data: { turnNumber: this.state.turnNumber },
      timestamp: new Date(),
    });
    
    return { success: true, data: this.getState() };
  }
  
  // ===========================================================================
  // CARD SELECTION (simplified for MVP)
  // ===========================================================================
  
selectAdvanceCard(playerId: string, cardId: string, discardCommandId?: string): Result<GameState> {
  const player = getPlayer(this.state, playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }
  
  // Find card in either market
  let card = this.state.cards.gambitMarket.find(c => c.id === cardId);
  let isGambit = true;
  
  if (!card) {
    card = this.state.cards.commandMarket.find(c => c.id === cardId);
    isGambit = false;
  }
  
  if (!card) {
    return { success: false, error: 'Card not found in market' };
  }
  
  if (isGambit) {
    // Gambit: immediate effect, then discard
    this.executeGambitEffect(card, player);
    
    const index = this.state.cards.gambitMarket.findIndex(c => c.id === cardId);
    this.state.cards.gambitMarket.splice(index, 1);
    this.state.cards.gambitDiscard.push(card);
    
    // Refill market
    if (this.state.cards.gambitDeck.length > 0) {
      this.state.cards.gambitMarket.push(this.state.cards.gambitDeck.pop()!);
    }
  } else {
    // Command: add to active cards
    if (player.activeCommandCards.length >= 3) {
      if (!discardCommandId) {
        return { success: false, error: 'Must discard a command card first' };
      }
      
      const discardIndex = player.activeCommandCards.findIndex(c => c.id === discardCommandId);
      if (discardIndex === -1) {
        return { success: false, error: 'Card to discard not found' };
      }
      
      const discarded = player.activeCommandCards.splice(discardIndex, 1)[0];
      this.state.cards.commandDiscard.push(discarded);
    }
    
    // Add new card with turn tracking
    const index = this.state.cards.commandMarket.findIndex(c => c.id === cardId);
    this.state.cards.commandMarket.splice(index, 1);
    player.activeCommandCards.push({
      ...card,
      gainedOnTurn: this.state.turnNumber,
    });
    
    // Refill market
    if (this.state.cards.commandDeck.length > 0) {
      this.state.cards.commandMarket.push(this.state.cards.commandDeck.pop()!);
    }
  }
  
  this.state.updatedAt = new Date();
  
  this.emit({
    type: GameEventType.CARD_DRAWN,
    gameId: this.state.id,
    playerId,
    data: { cardId, cardType: isGambit ? CardType.GAMBIT : CardType.COMMAND },
    timestamp: new Date(),
  });
  
  // Reset turn earning flags after card is selected
  player.cubesPlacedThisTurn = 0;
  player.achievedBreakthroughThisTurn = false;
  return { success: true, data: this.getState() };
}

// ===========================================================================
// CARD EXECUTION
// ===========================================================================

/**
 * Execute a Gambit card's immediate effect
 */
private executeGambitEffect(card: AdvanceCard, player: Player): void {
  // Extract base card ID (strip instance suffix like "expansion-0" -> "expansion")
  const baseId = card.id.toString().split('-')[0].toUpperCase();
  
  switch (baseId) {
    case 'EXPANSION':
      // Add 1 ship to fleet - roll for value, add to scrapyard
      const newShipValue = Math.floor(Math.random() * 6) + 1;
      player.scrapyard.push(newShipValue);
      break;
      
    case 'AGGRESSION':
      // +2 dominance immediately
      player.dominanceCounter += 2;
      break;
      
    case 'MOMENTUM':
      // +2 actions for bonus turn
      player.actionsRemaining += 2;
      // Reset ship turn flags for this bonus turn
      const playerShips = this.state.ships.filter(s => s.ownerId === player.id);
      for (const ship of playerShips) {
        ship.hasMovedThisTurn = false;
        ship.hasUsedAbilityThisTurn = false;
      }
      break;
      
    case 'RELOCATION':
      // Handled via UI flow in gameStore - no immediate effect
      break;
      
    case 'REORGANIZATION':
      // Handled via UI flow in gameStore - no immediate effect
      break;
      
    case 'SABOTAGE':
      // Handled via UI flow in gameStore - no immediate effect
      break;
      
    default:
      console.warn(`Unknown gambit effect: ${baseId}`);
  }
}

// ===========================================================================
// REORGANIZATION
// ===========================================================================

reorganizeShips(playerId: string, shipIds: string[], scrapyardIndices: number[]): Result<GameState> {
  const player = getPlayer(this.state, playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Re-roll deployed ships - move to scrapyard with new values
  for (const shipId of shipIds) {
    const shipIndex = this.state.ships.findIndex(s => s.id === shipId && s.ownerId === playerId);
    if (shipIndex !== -1) {
      // Remove from board
      this.state.ships.splice(shipIndex, 1);
      // Add new value to scrapyard
      const newValue = Math.floor(Math.random() * 6) + 1;
      player.scrapyard.push(newValue);
    }
  }

  // Re-roll scrapyard ships in place
  for (const index of scrapyardIndices) {
    if (index >= 0 && index < player.scrapyard.length) {
      player.scrapyard[index] = Math.floor(Math.random() * 6) + 1;
    }
  }

  this.state.updatedAt = new Date();
  return { success: true, data: this.getState() };
}

// ===========================================================================
// RELOCATION
// ===========================================================================

relocateCube(playerId: string, sourceTileId: string, destTileId: string): Result<GameState> {
  const sourceTile = getTile(this.state, sourceTileId);
  const destTile = getTile(this.state, destTileId);
  
  if (!sourceTile || !destTile) {
    return { success: false, error: 'Invalid tile' };
  }
  
  if (!sourceTile.quantumCube) {
    return { success: false, error: 'No cube on source planet' };
  }
  
  const cubeOwnerId = sourceTile.quantumCube;
  
  // Can't relocate your own cube
  if (cubeOwnerId === playerId) {
    return { success: false, error: 'Cannot relocate your own cube' };
  }
  
  // Destination can't already have this player's cube
  if (destTile.quantumCube === cubeOwnerId) {
    return { success: false, error: 'Opponent already has cube on destination planet' };
  }
  
  // Move the cube
  sourceTile.quantumCube = null;
  destTile.quantumCube = cubeOwnerId;
  
  // Update the cube owner's remaining count (no change - just moved)
  
  this.state.updatedAt = new Date();
  return { success: true, data: this.getState() };
}

// ===========================================================================
// SABOTAGE
// ===========================================================================

sabotageDiscard(playerId: string, cardId: string): Result<GameState> {
  const player = getPlayer(this.state, playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  const cardIndex = player.activeCommandCards.findIndex(c => c.id === cardId);
  if (cardIndex === -1) {
    return { success: false, error: 'Card not found in player hand' };
  }
  const [discardedCard] = player.activeCommandCards.splice(cardIndex, 1);
  this.state.cards.commandDiscard.push(discardedCard);
  
  this.state.updatedAt = new Date();
  return { success: true, data: this.getState() };
}

// ===========================================================================
// FLEXIBLE
// ===========================================================================

flexibleAdjust(playerId: string, shipId: string, direction: 'up' | 'down'): Result<GameState> {
  const player = getPlayer(this.state, playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (!this.hasCommandCard(player, 'flexible')) {
    return { success: false, error: 'Player does not have Flexible card' };
  }

  if (player.hasUsedFlexibleThisTurn) {
    return { success: false, error: 'Already used Flexible this turn' };
  }

  const ship = this.state.ships.find(s => s.id === shipId && s.ownerId === playerId);
  if (!ship) {
    return { success: false, error: 'Ship not found' };
  }

  if (direction === 'up') {
    ship.pipValue = ship.pipValue >= 6 ? 1 : ship.pipValue + 1;
  } else {
    ship.pipValue = ship.pipValue <= 1 ? 6 : ship.pipValue - 1;
  }

  player.hasUsedFlexibleThisTurn = true;
  this.state.updatedAt = new Date();
  return { success: true, data: this.getState() };
}

}

// =============================================================================
// EXPORTS
// =============================================================================

export { getAvailableActions } from './validation/actions.js';
export { createGame, MAP_CONFIGS, type CreateGameOptions } from './utils/state.js';
export * from './utils/board.js';
export * from './utils/dice.js';
