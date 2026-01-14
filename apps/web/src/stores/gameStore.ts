/**
 * Game Store
 * 
 * Zustand store for managing game state on the client
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ActionType } from '@quantum/types';
import type { 
  GameState, 
  AvailableActions, 
  Position, 
  Ship,
  Player,
  AIDifficulty,
  AdvanceCard
} from '@quantum/types';
import { 
  GameEngine, 
  createGame, 
  MAP_CONFIGS,
  type CreateGameOptions,
} from '@quantum/game-engine';
import { createAI } from '@quantum/ai';

// =============================================================================
// TYPES
// =============================================================================

interface GameStore {
  // State
  gameState: GameState | null;
  availableActions: AvailableActions | null;
  selectedShipId: string | null;
  highlightedPositions: Position[];
  isLoading: boolean;
  error: string | null;
  // State Additions for deploy mode
  isDeployMode: boolean;
  selectedScrapyardIndex: number;
  // State for combat result modal
  lastCombatResult: {
    winner: 'attacker' | 'defender';
    attackerRoll: number;
    attackerTotal: number;
    defenderTotal: number;
    defenderRoll: number;
    loserNewShipValue: number | null;  // The re-rolled value for scrapyard
    loserPlayerId: string | null;
  } | null;
  
  // Engine (for local games)
  engine: GameEngine | null;
  
  // UI State
  showSetupModal: boolean;
  showCardSelection: boolean;
  pendingCardSelections: number;
  
  // Actions
  createLocalGame: (options: CreateGameOptions) => void;
  loadGame: (state: GameState) => void;
  
  // Game Actions
  selectShip: (shipId: string | null) => void;
  performAction: (action: GameActionInput) => Promise<boolean>;
  endTurn: () => Promise<boolean>;
  // Actions for deploy mode
  enterDeployMode: (scrapyardIndex?: number) => void;
  exitDeployMode: () => void;
  // Action to clear combat result modal
  clearCombatResult: () => void;
  // Card selection actions
  openCardSelection: (count?: number) => void;
  closeCardSelection: () => void;
  selectCard: (card: AdvanceCard) => void;
  
  // AI
  processAITurn: () => Promise<void>;
  
  // UI
  setShowSetupModal: (show: boolean) => void;
  clearError: () => void;
  reset: () => void;

}


type GameActionInput = 
  | { type: 'reconfigure'; shipId: string }
  | { type: 'deploy'; shipIndex: number; targetPosition: Position }
  | { type: 'move'; shipId: string; targetPosition: Position }
  | { type: 'attack'; shipId: string; targetPosition: Position; moveToTarget?: boolean }
  | { type: 'construct'; tileId: string }
  | { type: 'research' }
  | { type: 'selectCard'; cardId: string; discardCommandId?: string };

// =============================================================================
// STORE
// =============================================================================

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    gameState: null,
    availableActions: null,
    selectedShipId: null,
    highlightedPositions: [],
    isLoading: false,
    error: null,
    engine: null,
    showSetupModal: true,
    showCardSelection: false,
    pendingCardSelections: 0,
    isDeployMode: false,
    selectedScrapyardIndex: 0,
    lastCombatResult: null,
    
    // Create a new local game
    createLocalGame: (options) => {
      try {
        const state = createGame(options);
        const engine = new GameEngine(state);
        
        set({
          gameState: state,
          engine,
          availableActions: engine.getAvailableActions(),
          showSetupModal: false,
          error: null,
        });
        // Check if first player is AI and trigger their turn
        const firstPlayer = state.players.find(p => p.id === state.currentPlayerId);
        if (firstPlayer?.type === 'ai') {
          setTimeout(() => get().processAITurn(), 500);
        } 
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    
    // Load an existing game
    loadGame: (state) => {
      const engine = new GameEngine(state);
      set({
        gameState: state,
        engine,
        availableActions: engine.getAvailableActions(),
        showSetupModal: false,
      });
    },
    
    // Select a ship
    selectShip: (shipId) => {
      const { availableActions, gameState } = get();
      
      if (!shipId || !availableActions || !gameState) {
        set({ selectedShipId: null, highlightedPositions: [] });
        return;
      }
      
      // Calculate highlighted positions for this ship
      const movePositions = availableActions.canMove[shipId] || [];
      const attackTargets = availableActions.canAttack[shipId] || [];
      
      // Get positions of attack targets
      const attackPositions: Position[] = attackTargets
        .map(targetId => gameState.ships.find(s => s.id === targetId)?.position)
        .filter((p): p is Position => p !== null && p !== undefined);
      
      set({
        selectedShipId: shipId,
        highlightedPositions: [...movePositions, ...attackPositions],
      });
    },
    
    // Perform a game action
    performAction: async (action) => {
      const { engine, gameState } = get();
      if (!engine || !gameState) return false;
      
      set({ isLoading: true, error: null });
      
      const playerId = gameState.currentPlayerId;
      let result;
      
      try {
        switch (action.type) {
          case 'reconfigure':
            result = engine.reconfigure(playerId, action.shipId);
            break;
          case 'deploy':
            result = engine.deploy(playerId, action.shipIndex, action.targetPosition);
            break;
          case 'move':
            result = engine.move(playerId, action.shipId, action.targetPosition);
            break;
          case 'attack':
            // Get defender's owner before the attack resolves
            const targetShip = gameState.ships.find(
              s => s.position?.x === action.targetPosition.x && s.position?.y === action.targetPosition.y
            );
            const defenderId = targetShip?.ownerId ?? null;
            result = engine.attack(playerId, action.shipId, action.targetPosition, action.moveToTarget ?? true);
              if (result.success && result.combatResult) {
                const combat = result.combatResult;
                const loserPlayerId = combat.winner === 'attacker' ? defenderId : playerId;
    
                set({
                  lastCombatResult: {
                  winner: combat.winner,
                  attackerRoll: combat.attackerRoll,
                  defenderRoll: combat.defenderRoll,
                  attackerTotal: combat.attackerTotal,
                  defenderTotal: combat.defenderTotal,
                  loserNewShipValue: combat.defenderNewPipValue ?? null,
                  loserPlayerId: loserPlayerId,
                  },
                });
            }  
            break;
          case 'construct':
            result = engine.construct(playerId, action.tileId);
            break;
          case 'research':
            result = engine.research(playerId);
            break;
          case 'selectCard':
            result = engine.selectAdvanceCard(playerId, action.cardId, action.discardCommandId);
            break;
          default:
            result = { success: false, error: 'Unknown action' };
        }
        
        if (result.success) {
          const newState = engine.getState();
          set({
            gameState: newState,
            availableActions: engine.getAvailableActions(),
            selectedShipId: null,
            highlightedPositions: [],
            isLoading: false,
          });
          return true;
        } else {
          set({ error: result.error, isLoading: false });
          return false;
        }
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        return false;
      }
    },
    // Clear Combat Result
    clearCombatResult: () => set({ lastCombatResult: null }),

    // Card Selection
    openCardSelection: (count = 1) => {
      set({ 
        showCardSelection: true, 
        pendingCardSelections: count 
      });
    },

    closeCardSelection: () => {
      set({ 
        showCardSelection: false, 
        pendingCardSelections: 0 
      });
    },

selectCard: (card: AdvanceCard) => {
  const { engine, gameState, pendingCardSelections } = get();
  if (!engine || !gameState) return;

  const playerId = gameState.currentPlayerId;
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return;

  // Use engine to handle card selection (includes Gambit effects)
  const result = engine.selectAdvanceCard(playerId, card.id);
  
  if (!result.success) {
    set({ error: result.error });
    return;
  }

  // Reset the cubes/breakthrough flags since we're consuming them
  const updatedState = result.data;
  const updatedPlayer = updatedState.players.find(p => p.id === playerId);
  if (updatedPlayer) {
    updatedPlayer.cubesPlacedThisTurn = 0;
    updatedPlayer.achievedBreakthroughThisTurn = false;
  }

  const newPendingCount = pendingCardSelections - 1;

  if (newPendingCount > 0) {
    // More cards to select
    set({
      gameState: updatedState,
      pendingCardSelections: newPendingCount,
    });
  } else {
    // All cards selected
    set({
      gameState: updatedState,
      pendingCardSelections: 0,
      showCardSelection: false,
      availableActions: engine.getAvailableActions(),
    });
    
    // Check if player has actions remaining (e.g., from Momentum)
    if (updatedPlayer && updatedPlayer.actionsRemaining > 0) {
      // Player continues their turn - already set availableActions above
    } else {
      // No actions left, end the turn
      get().endTurn();
    }
  }
},

    // Enter Deploy mode
    enterDeployMode: (scrapyardIndex = 0) => {
      const { availableActions } = get();
      if (!availableActions || availableActions.canDeploy.length === 0) return;
  
      set({
        isDeployMode: true,
        selectedScrapyardIndex: scrapyardIndex,
        selectedShipId: null,
        highlightedPositions: availableActions.canDeploy,
      });
    },
    // Exit Deploy mode
    exitDeployMode: () => {
      set({
        isDeployMode: false,
        selectedScrapyardIndex: 0,
        highlightedPositions: [],
      });
    },

    // End turn
endTurn: async () => {
  const { engine, gameState } = get();
  if (!engine || !gameState) return false;
  
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
  if (!currentPlayer) return false;
  
  // Check if player earned any cards this turn
  const cardsEarned = currentPlayer.cubesPlacedThisTurn + (currentPlayer.achievedBreakthroughThisTurn ? 1 : 0);
  
  if (cardsEarned > 0) {
    // Enter card selection phase before ending turn
    set({ 
      showCardSelection: true, 
      pendingCardSelections: cardsEarned,
    });
    return true; // Don't end turn yet - will be called again after card selection
  }
  
  // No cards to select, proceed with ending turn
  const result = engine.endTurn(gameState.currentPlayerId);
  
  if (result.success) {
    const newState = engine.getState();
    set({
      gameState: newState,
      availableActions: engine.getAvailableActions(),
      selectedShipId: null,
      highlightedPositions: [],
    });
    
    // Check if next player is AI
    const nextPlayer = newState.players.find(p => p.id === newState.currentPlayerId);
    if (nextPlayer?.type === 'ai' && newState.status === 'in_progress') {
      // Small delay before AI turn
      setTimeout(() => get().processAITurn(), 500);
    }
    
    return true;
  }
  
  return false;
},
    // Process AI turn
    processAITurn: async () => {
      console.log('processAITurn invoked');
      const { engine, gameState } = get();
      if (!engine || !gameState) return;
    
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
      if (!currentPlayer || currentPlayer.type !== 'ai') return;
      
      set({ isLoading: true });
      
      const actionLogLengthBefore = engine.getState().actionLog.length;
      const ai = createAI(currentPlayer.aiDifficulty || 'medium' as AIDifficulty);
      
      // Execute AI turn with delays for visual feedback
      await ai.executeTurn(engine);
      
      const newState = engine.getState();

      // Check only new actions for combat
      const newActions = newState.actionLog.slice(actionLogLengthBefore);
      const attackAction = newActions.find(a => a.type === ActionType.ATTACK);

      console.log('All actions after AI turn:', newState.actionLog);
      const lastAction = newState.actionLog[newState.actionLog.length - 1];
      console.log('Last action after AI turn:', lastAction);
      if (attackAction && attackAction.combatResult) {
        const combat = attackAction.combatResult;
        const loserPlayerId = combat.winner === 'attacker'
        ? attackAction.targetPlayerId
        : attackAction.playerId;
      // if (lastAction?.type === ActionType.ATTACK && lastAction.combatResult) {
      //   const combat = lastAction.combatResult;
      //   const loserPlayerId = combat.winner === 'attacker' 
      //   ? lastAction.targetPlayerId 
      //   : lastAction.playerId;
        set({
          lastCombatResult: {
            winner: combat.winner,
            attackerRoll: combat.attackerRoll,
            defenderRoll: combat.defenderRoll,
            attackerTotal: combat.attackerTotal,
            defenderTotal: combat.defenderTotal,  
            loserNewShipValue: combat.defenderNewPipValue ?? null,
            loserPlayerId: loserPlayerId,
          },
        });
      }
      set({
        gameState: newState,
        availableActions: engine.getAvailableActions(),
        isLoading: false,
      });
      
      // Check if still AI's turn (shouldn't happen normally)
      const nextPlayer = newState.players.find(p => p.id === newState.currentPlayerId);
      if (nextPlayer?.type === 'ai' && newState.status === 'in_progress') {
        setTimeout(() => get().processAITurn(), 500);
      }
    },
    
    // UI actions
    setShowSetupModal: (show) => set({ showSetupModal: show }),
    clearError: () => set({ error: null }),
    reset: () => set({
      gameState: null,
      availableActions: null,
      selectedShipId: null,
      highlightedPositions: [],
      isLoading: false,
      error: null,
      engine: null,
      showSetupModal: true,
    }),
  }))
);

// =============================================================================
// SELECTORS
// =============================================================================

export const selectCurrentPlayer = (state: GameStore): Player | null => {
  if (!state.gameState) return null;
  return state.gameState.players.find(p => p.id === state.gameState!.currentPlayerId) || null;
};

export const selectPlayerShips = (state: GameStore, playerId: string): Ship[] => {
  if (!state.gameState) return [];
  return state.gameState.ships.filter(s => s.ownerId === playerId);
};

export const selectIsMyTurn = (state: GameStore, playerId: string): boolean => {
  return state.gameState?.currentPlayerId === playerId;
};
