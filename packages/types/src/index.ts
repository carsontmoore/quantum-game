/**
 * Quantum Game - Core Type Definitions
 * 
 * This file defines the complete data model for the Quantum board game.
 * These types are shared across frontend, backend, and game engine.
 */

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

/** Ship types determined by die pip value (1-6) */
export enum ShipType {
  BATTLESTATION = 1,
  FLAGSHIP = 2,
  DESTROYER = 3,
  FRIGATE = 4,
  INTERCEPTOR = 5,
  SCOUT = 6,
}

/** Ship ability names mapped to ship types */
export const SHIP_ABILITIES: Record<ShipType, ShipAbility> = {
  [ShipType.BATTLESTATION]: {
    name: 'Strike',
    description: 'Attack 1 enemy in an adjacent (orthogonal) space without moving',
  },
  [ShipType.FLAGSHIP]: {
    name: 'Transport',
    description: 'Pick up 1 ship from a surrounding space, carry it as you move, drop it in any empty surrounding space',
  },
  [ShipType.DESTROYER]: {
    name: 'Warp',
    description: 'Swap places with one of your ships located anywhere on the map',
  },
  [ShipType.FRIGATE]: {
    name: 'Modify',
    description: 'Change to a 3 (Destroyer) or a 5 (Interceptor)',
  },
  [ShipType.INTERCEPTOR]: {
    name: 'Maneuver',
    description: 'Travel diagonally as you move/attack',
  },
  [ShipType.SCOUT]: {
    name: 'Free Reconfigure',
    description: 'Roll a new number for the Scout ship (does not use an action)',
  },
};

/** Movement range for each ship type (pip value = movement) */
export const SHIP_MOVEMENT: Record<ShipType, number> = {
  [ShipType.BATTLESTATION]: 1,
  [ShipType.FLAGSHIP]: 2,
  [ShipType.DESTROYER]: 3,
  [ShipType.FRIGATE]: 4,
  [ShipType.INTERCEPTOR]: 5,
  [ShipType.SCOUT]: 6,
};

/** Game phases within a turn */
export enum TurnPhase {
  ACTIONS = 'actions',
  ADVANCE_CARDS = 'advance_cards',
}

/** Types of actions a player can take */
export enum ActionType {
  RECONFIGURE = 'reconfigure',
  DEPLOY = 'deploy',
  MOVE = 'move',
  ATTACK = 'attack',
  CONSTRUCT = 'construct', // Uses 2 actions
  RESEARCH = 'research',
  USE_ABILITY = 'use_ability',
  PLAY_GAMBIT = 'play_gambit',
  SELECT_ADVANCE_CARD = 'select_advance_card',
  DISCARD_COMMAND = 'discard_command',
  END_TURN = 'end_turn',
}

/** Advance card types */
export enum CardType {
  GAMBIT = 'gambit',
  COMMAND = 'command',
}

/** Game status */
export enum GameStatus {
  LOBBY = 'lobby',           // Waiting for players
  SETUP = 'setup',           // Initial cube/ship placement
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  ABANDONED = 'abandoned',
}

/** Player type */
export enum PlayerType {
  HUMAN = 'human',
  AI = 'ai',
}

/** AI difficulty levels */
export enum AIDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

// =============================================================================
// CORE GAME TYPES
// =============================================================================

/** Ship ability definition */
export interface ShipAbility {
  name: string;
  description: string;
}

/** 
 * Position on the game board
 * The board is a grid of tiles, each tile is a 3x3 grid with a planet at center
 * 
 * Global coordinates: (x, y) where each tile occupies a 3x3 space
 * Example: Tile at (0,0) covers cells (0,0) to (2,2)
 *          Tile at (1,0) covers cells (3,0) to (5,2)
 */
export interface Position {
  x: number;  // Global x coordinate
  y: number;  // Global y coordinate
}

/** A tile on the board (3x3 grid with planet at center) */
export interface Tile {
  id: string;                    // Unique tile identifier
  position: Position;            // Top-left corner of tile in global coords
  planetNumber: number;          // Planet value (typically 7-20)
  quantumCube: string | null;    // Player ID who placed cube, or null
}

/** A ship (die) on the board */
export interface Ship {
  id: string;                    // Unique ship identifier
  ownerId: string;               // Player ID
  pipValue: ShipType;            // Die value (1-6), determines ship type
  position: Position | null;     // Null if in scrapyard
  hasMovedThisTurn: boolean;
  hasUsedAbilityThisTurn: boolean;
  isCarried: boolean;            // True if being transported by Flagship
  carriedById: string | null;    // ID of Flagship carrying this ship
}

/** Faction definition (cosmetic for MVP, extensible for future) */
export interface Faction {
  id: string;
  name: string;
  color: string;                 // Primary color hex
  secondaryColor: string;        // Secondary color hex
  // Future: unique abilities, modified ships, etc.
}

/** Predefined factions */
export const FACTIONS: Faction[] = [
  { id: 'quantum', name: 'Quantum Alliance', color: '#3B82F6', secondaryColor: '#1D4ED8' },
  { id: 'void', name: 'Void Collective', color: '#8B5CF6', secondaryColor: '#6D28D9' },
  { id: 'stellar', name: 'Stellar Dominion', color: '#EF4444', secondaryColor: '#B91C1C' },
  { id: 'nebula', name: 'Nebula Syndicate', color: '#10B981', secondaryColor: '#047857' },
];

// =============================================================================
// ADVANCE CARDS
// =============================================================================


export enum CardCategory {
  COMBAT = 'combat',
  DOMINANCE = 'dominance',
  RESEARCH = 'research',
  MOVEMENT = 'movement',
  ACTION = 'action',
  CONFIGURATION = 'configuration',
  CONSTRUCT = 'construct',
  ABILITY = 'ability',
}

export enum CommandCardId {
  DANGEROUS = 'dangerous',
  BRILLIANT = 'brilliant',
  FLEXIBLE = 'flexible',
  EAGER = 'eager',
  RESOURCEFUL = 'resourceful',
  STEALTHY = 'stealthy',
  CLEVER = 'clever',
  STUBBORN = 'stubborn',
  CURIOUS = 'curious',
  RIGHTEOUS = 'righteous',
  INTELLIGENT = 'intelligent',
  FEROCIOUS = 'ferocious',
  CUNNING = 'cunning',
  CRUEL = 'cruel',
  RELENTLESS = 'relentless',
  TACTICAL = 'tactical',
  AGILE = 'agile',
  PRECOCIOUS = 'precocious',
  STRATEGIC = 'strategic',
  ENERGETIC = 'energetic',
  ARROGANT = 'arrogant',
  WARLIKE = 'warlike',
  CONFORMIST = 'conformist',
  RAVENOUS = 'ravenous',
  SCRAPPY = 'scrappy',
  INGENIOUS = 'ingenious',
  RATIONAL = 'rational',
  PLUNDERING = 'plundering',
  TYRANNICAL = 'tyrannical',
  NOMADIC = 'nomadic',
  CEREBRAL = 'cerebral',
}

export enum GambitCardId {
  EXPANSION = 'expansion',
  AGGRESSION = 'aggression',
  MOMENTUM = 'momentum',
  RELOCATION = 'relocation',
  REORGANIZATION = 'reorganization',
  SABOTAGE = 'sabotage',
}

export interface AdvanceCard {
  id: CommandCardId | GambitCardId;
  name: string;
  type: CardType;
  categories: CardCategory[];
  description: string;
  effect: string;
  imagePath: string;
  count: number;  // 1 for Command cards, varies for Gambit
  gainedOnTurn?: number; // Turn number when card was gained (for Command cards)
}

// =============================================================================
// PLAYER STATE
// =============================================================================

export interface Player {
  id: string;
  type: PlayerType;
  userId: string | null;          // Null for AI players
  aiDifficulty: AIDifficulty | null;
  factionId: string;
  
  // Game state
  quantumCubesRemaining: number;
  researchCounter: number;         // 0-6, resets to 1 after breakthrough
  dominanceCounter: number;
  
  // Cards
  activeCommandCards: AdvanceCard[];  // Max 3
  
  // Ships in scrapyard (not on board)
  scrapyard: ShipType[];
  
  // Turn state (reset each turn)
  actionsRemaining: number;        // Starts at 3
  cubesPlacedThisTurn: number;     // For advance card rewards
  achievedBreakthroughThisTurn: boolean;
  bonusMoves: number;
  hasUsedFlexibleThisTurn: boolean;
}

// =============================================================================
// GAME STATE
// =============================================================================

/** Card decks and market state */
export interface CardState {
  gambitDeck: AdvanceCard[];        // Face-down shuffled deck
  commandDeck: AdvanceCard[];       // Face-down shuffled deck
  gambitMarket: AdvanceCard[];      // 3 face-up cards
  commandMarket: AdvanceCard[];     // 3 face-up cards
  gambitDiscard: AdvanceCard[];
  commandDiscard: AdvanceCard[];
}

// Removing CombatState and CombatEffect - we now use PendingCombat on GameState directly
/** Combat state for resolving battles */
// export interface CombatState {
//   attackerId: string;              // Player ID
//   defenderId: string;              // Player ID
//   attackerShipId: string;
//   defenderShipId: string;
//   attackerRoll: number | null;
//   defenderRoll: number | null;
//   attackerTotal: number | null;
//   defenderTotal: number | null;
//   attackerOriginPosition: Position;
//   phase: CombatPhase;
//   pendingEffects: CombatEffect[];  // Card effects to resolve
// }


// export interface CombatEffect {
//   type: string;
//   playerId: string;
//   data?: Record<string, unknown>;
// }

/** Map configuration */
export interface MapConfig {
  id: string;
  name: string;
  playerCount: number[];          // Supported player counts [2, 3, 4]
  cubesPerPlayer: number;         // 4-7 typically
  tiles: TileConfig[];
  startingPlanets: Record<string, string>;  // factionId -> tileId
}

export interface TileConfig {
  id: string;
  position: Position;
  planetNumber: number;
}

/** Complete game state - this is what gets stored/synced */
export interface GameState {
  // Metadata
  id: string;
  status: GameStatus;
  mapConfigId: string;
  createdAt: Date;
  updatedAt: Date;
  finishedAt: Date | null;
  winnerId: string | null;
  
  // Turn tracking
  turnNumber: number;
  currentPlayerId: string;
  currentPhase: TurnPhase;
  turnOrder: string[];            // Player IDs in turn order

  // Combat tracking
  combatPhase: CombatPhase;
  pendingCombat: PendingCombat | null;
  
  // Board state
  tiles: Tile[];
  ships: Ship[];
  
  // Card state
  cards: CardState;
  
  // Player states
  players: Player[];
  
  // Removing activeCombat because combatPhase and pendingCombat directly on GameState
  // Combat (null if no active combat)
  // activeCombat: CombatState | null;
  
  // Action log for replay/undo
  actionLog: GameAction[];
}

// =============================================================================
// GAME ACTIONS
// =============================================================================

/** Base action structure */
export interface BaseAction {
  type: ActionType;
  playerId: string;
  timestamp: Date;
}

export interface ReconfigureAction extends BaseAction {
  type: ActionType.RECONFIGURE;
  shipId: string;
  previousValue: ShipType;
  newValue: ShipType;
}

export interface DeployAction extends BaseAction {
  type: ActionType.DEPLOY;
  shipIndex: number;              // Index in scrapyard
  shipValue: ShipType;
  targetPosition: Position;
}

export interface MoveAction extends BaseAction {
  type: ActionType.MOVE;
  shipId: string;
  fromPosition: Position;
  toPosition: Position;
  path: Position[];               // Full movement path
}

export interface AttackAction extends BaseAction {
  type: ActionType.ATTACK;
  shipId: string;
  fromPosition: Position;
  targetPosition: Position;
  targetShipId: string;
  targetPlayerId: string;
  combatResult: CombatResult;
}

export interface CombatResult {
  attackerRoll: number;
  defenderRoll: number;
  attackerTotal: number;
  defenderTotal: number;
  winner: 'attacker' | 'defender';
  attackerFinalPosition: Position;
  attackerNewPipValue: ShipType | null;  // If destroyed, what they rolled
  defenderNewPipValue: ShipType | null;  // If destroyed, what they rolled
  attackerPlayerId: string;
  defenderPlayerId: string;
  effectsApplied: string[];
  dangerousActivated?: boolean;
}

export interface ConstructAction extends BaseAction {
  type: ActionType.CONSTRUCT;
  tileId: string;
  shipIds: string[];              // Ships used for construction
}

export interface ResearchAction extends BaseAction {
  type: ActionType.RESEARCH;
  previousValue: number;
  newValue: number;
  breakthrough: boolean;
}

export interface UseAbilityAction extends BaseAction {
  type: ActionType.USE_ABILITY;
  shipId: string;
  abilityName: string;
  abilityData: AbilityData;
}

/** Ability-specific data */
export type AbilityData = 
  | StrikeAbilityData
  | TransportAbilityData
  | WarpAbilityData
  | ModifyAbilityData
  | ManeuverAbilityData
  | FreeReconfigureAbilityData;

export interface StrikeAbilityData {
  ability: 'strike';
  targetShipId: string;
  combatResult: CombatResult;
}

export interface TransportAbilityData {
  ability: 'transport';
  carriedShipId: string;
  pickupPosition: Position;
  dropPosition: Position;
}

export interface WarpAbilityData {
  ability: 'warp';
  swapWithShipId: string;
  originalPosition: Position;
  newPosition: Position;
}

export interface ModifyAbilityData {
  ability: 'modify';
  previousValue: ShipType.FRIGATE;
  newValue: ShipType.DESTROYER | ShipType.INTERCEPTOR;
}

export interface ManeuverAbilityData {
  ability: 'maneuver';
  // Diagonal movement is handled in MoveAction
}

export interface FreeReconfigureAbilityData {
  ability: 'free_reconfigure';
  previousValue: ShipType.SCOUT;
  newValue: ShipType;
}

export interface PlayGambitAction extends BaseAction {
  type: ActionType.PLAY_GAMBIT;
  cardId: string;
  effectData?: Record<string, unknown>;
}

export interface SelectAdvanceCardAction extends BaseAction {
  type: ActionType.SELECT_ADVANCE_CARD;
  cardId: string;
  cardType: CardType;
  discardedCommandId?: string;    // If replacing a command card
}

export interface DiscardCommandAction extends BaseAction {
  type: ActionType.DISCARD_COMMAND;
  cardId: string;
}

export interface EndTurnAction extends BaseAction {
  type: ActionType.END_TURN;
  cardsEarned: number;
}

export type GameAction =
  | ReconfigureAction
  | DeployAction
  | MoveAction
  | AttackAction
  | ConstructAction
  | ResearchAction
  | UseAbilityAction
  | PlayGambitAction
  | SelectAdvanceCardAction
  | DiscardCommandAction
  | EndTurnAction;

// ===========================================================================
// COMBAT TYPES
// ===========================================================================

export type CombatPhase = 'pre-combat' | 'rolls' | 're-roll' | 'resolution' | null;

export interface PendingCombat {
  attackerShipId: string;
  defenderShipId: string;
  attackerPlayerId: string;
  defenderPlayerId: string;
  attackerOrigin: Position;
  attackerLaunchPosition: Position;
  targetPosition: Position;
  defenderHasDangerous: boolean;
  attackerRoll: number;
  defenderRoll: number;
  attackerTotal: number;
  defenderTotal: number;
  attackerModifiers: string[];
  defenderModifiers: string[];
  rerollsUsed: { cruel: boolean; relentless: boolean; scrappy: boolean };
  attackerCanCruel: boolean;
  attackerCanRelentless: boolean;
  attackerCanScrappy: boolean;
  defenderCanCruel: boolean;
  defenderCanRelentless: boolean;
}

export type CombatInput =
  | { type: 'dangerous'; activate: boolean }
  | { type: 'reroll'; rerollType: 'cruel' | 'relentless' | 'scrappy'; playerId: string }
  | { type: 'skipRerolls' }
  | { type: 'finalize'; moveToTarget: boolean };

export interface CombatInputRequest {
  phase: CombatPhase;
  awaitingPlayerId: string;
  options: {
    canActivateDangerous?: boolean;
    canSkipDangerous?: boolean;
    availableRerolls?: Array<{ type: 'cruel' | 'relentless' | 'scrappy'; playerId: string }>;
    canSkipRerolls?: boolean;
    canMoveToTarget?: boolean;
    canStayInPlace?: boolean;
  };
}

export interface CombatAdvanceResult {
  success: boolean;
  error?: string;
  data?: GameState;
  combatResult?: CombatResult;
  needsInput?: CombatInputRequest;
  completed: boolean;
}

// =============================================================================
// API / EVENTS
// =============================================================================

/** Events emitted by the game engine */
export enum GameEventType {
  GAME_STARTED = 'game_started',
  TURN_STARTED = 'turn_started',
  ACTION_PERFORMED = 'action_performed',
  COMBAT_INITIATED = 'combat_initiated',
  COMBAT_RESOLVED = 'combat_resolved',
  CUBE_PLACED = 'cube_placed',
  CARD_DRAWN = 'card_drawn',
  BREAKTHROUGH_ACHIEVED = 'breakthrough_achieved',
  TURN_ENDED = 'turn_ended',
  GAME_ENDED = 'game_ended',
  INVALID_ACTION = 'invalid_action',
}

export interface GameEvent {
  type: GameEventType;
  gameId: string;
  playerId?: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

// =============================================================================
// DATABASE MODELS (for MongoDB)
// =============================================================================

/** User document */
export interface UserDocument {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  stats: UserStats;
  preferences: UserPreferences;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesByFaction: Record<string, { played: number; won: number }>;
  gamesByMap: Record<string, { played: number; won: number }>;
  totalCubesPlaced: number;
  totalShipsDestroyed: number;
  totalDominanceGained: number;
}

export interface UserPreferences {
  defaultFaction: string | null;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

/** Game document (stored in MongoDB) */
export interface GameDocument {
  _id: string;
  status: GameStatus;
  mapConfigId: string;
  createdAt: Date;
  updatedAt: Date;
  finishedAt: Date | null;
  winnerId: string | null;
  
  // Denormalized player info for queries
  playerIds: string[];
  playerFactions: Record<string, string>;
  
  // Full game state (stored as embedded document)
  state: GameState;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** Result type for operations that can fail */
export type Result<T, E = string> = 
  | { success: true; data: T }
  | { success: false; error: E };

/** Valid action check result */
export interface ActionValidation {
  valid: boolean;
  reason?: string;
}

/** Available actions for current player */
export interface AvailableActions {
  canReconfigure: string[];       // Ship IDs that can be reconfigured
  canDeploy: Position[];          // Valid deployment positions
  canMove: Record<string, Position[]>;  // Ship ID -> valid destinations
  canAttack: Record<string, string[]>;  // Ship ID -> target ship IDs
  canConstruct: string[];         // Tile IDs where construction is possible
  canResearch: boolean;
  canUseAbility: Record<string, boolean>;  // Ship ID -> can use ability
  canEndTurn: boolean;
}
