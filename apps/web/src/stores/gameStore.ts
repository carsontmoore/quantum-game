/**
 * Game Store
 * 
 * Zustand store for managing game state on the client
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ActionType , CardType} from '@quantum/types';
import type { 
  GameState, 
  AvailableActions, 
  Position, 
  Ship,
  Player,
  AIDifficulty,
  AdvanceCard,
  CombatInput,
  CombatResult,
} from '@quantum/types';
import { 
  GameEngine, 
  createGame, 
  MAP_CONFIGS,
  getOrbitalPositions,
  type CreateGameOptions,
  getAvailableActions,
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
  
  // Attack / Combat state refactor to now include multiple phases
  lastCombatResult: {
    winner: 'attacker' | 'defender' | 'none';
    attackerRoll: number;
    attackerTotal: number;
    defenderTotal: number;
    defenderRoll: number;
    loserNewShipValue: number | null;  // The re-rolled value for scrapyard
    loserPlayerId: string | null;
    dangerousActivated?: boolean;
  } | null;
  
  // Removed combatPhase because it's now in GameState

  // combatPhase: 'pre-combat' | 'rolls' | 're-roll' | 'resolution' | null;
  //   pendingCombat: {
  //     attackerShipId: string;
  //     defenderShipId: string;
  //     attackerOrigin: Position;
  //     targetPosition: Position;
  //     defenderHasDangerous: boolean;
  //     attackerRoll: number;
  //     defenderRoll: number;
  //     attackerTotal: number;
  //     defenderTotal: number;
  //     attackerModifiers: string[];
  //     defenderModifiers: string[];
  //     rerollsUsed: { cruel: boolean; relentless: boolean; scrappy: boolean };
  //     attackerCanCruel: boolean;
  //     attackerCanRelentless: boolean;
  //     attackerCanScrappy: boolean;
  //     defenderCanCruel: boolean;
  //     defenderCanRelentless: boolean;
  //   } | null;

  // Updates for new combat refactor
  submitCombatInput: (input: CombatInput) => void;
  setCombatResult: (combatResult: CombatResult) => void;
  cancelCombat: () => void;

  pendingGambitEffect: {
    type: string; // 'EXPANSION' | 'REORGANIZATION' | 'RELOCATION' | 'SABOTAGE'
    data?: any;
  } | null;
  isFreeDeployMode: boolean;
  showReorganizationModal: boolean;
  reorganizationPhase: 'reroll' | 'deploy' | null;
  showRelocationModal : boolean;
  relocationPhase: 'selectCube' | 'selectDestination' | null;
  selectedRelocationCube: { tileId: string; playerId: string } | null;
  highlightedTiles: string[];
  showSabotageModal: boolean;
  sabotageDiscards: Record<string, string>; // playerId -> cardId already discarded

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
  // Action to clear Gambit effect
  clearPendingGambitEffect: () => void;
  // Action to show reorganization modal
  executeReorganization: (shipIds: string[], scrapyardIndices: number[]) => void;
  finishReorganizationDeploy: () => void;
  setSelectedScrapyardIndex: (index: number) => void;
  // Action to show relocation modal
  selectRelocationCube: (tileId: string, cubePlayerId: string) => void;
  executeRelocation: (destTileId: string) => void;
  cancelRelocation: () => void;
  // Action to show sabotage modal
  executeSabotageDiscard: (playerId: string, cardId: string) => void;
  // Action for Flexible
  flexibleAdjust: (shipId: string, direction: 'up' | 'down') => void;
  // Attack method signatures
  initiateAttack: (shipId: string, targetPosition: Position) => void;
  
  // Removed activateDangerous, skipDangerous, useCombatReroll, skipRerolls, finalizeCombat because they're replaced by submitCombatInput
  // activateDangerous: () => void;
  // skipDangerous: () => void;

  // executeCombatRolls now in GameState - removed
  // executeCombatRolls: (attackerShipId: string, defenderShipId: string, attackerOrigin: Position, targetPosition: Position) => void;

  // useCombatReroll: (type: 'cruel' | 'relentless' | 'scrappy', initiatedBy: string) => void;
  // skipRerolls: () => void;
  // finalizeCombat: (moveToTarget: boolean) => void;

  // AI
  processAITurn: () => Promise<void>;

  // Both processAICombat and processAICombatRerolls are now in GameState - removed
  // processAICombat: () => void;
  // processAICombatRerolls: () => void;
  
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
    pendingGambitEffect: null,
    isFreeDeployMode: false,
    showReorganizationModal: false,
    reorganizationPhase: null,
    showRelocationModal: false,
    relocationPhase: null,
    selectedRelocationCube: null,
    highlightedTiles: [],
    showSabotageModal: false,
    sabotageDiscards: {},

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
            const { isFreeDeployMode, pendingGambitEffect } = get();
            console.log('Deploy case:', { isFreeDeployMode, pendingGambitEffect, shipIndex: action.shipIndex });
  
            if (isFreeDeployMode && (pendingGambitEffect?.type === 'EXPANSION' || pendingGambitEffect?.type === 'REORGANIZATION')) {
              console.log('Entering free deploy branch');
              result = engine.freeDeploy(playerId, action.shipIndex, action.targetPosition);
              if (result.success) {
                engine.resetTurnFlags(playerId);
                // get().clearPendingGambitEffect();
                // get().exitDeployMode();
                const updatedPlayer = result.data.players.find(p => p.id === playerId);
                console.log('After freeDeploy, scrapyard length:', updatedPlayer?.scrapyard.length);

                if (pendingGambitEffect?.type === 'REORGANIZATION' && updatedPlayer && updatedPlayer.scrapyard.length > 0) {
                  console.log('Entering reorganization continue branch');
                  // More ships to deploy - recalculate valid positions and stay in deploy mode
                  const validDeployPositions: Position[] = [];
                  for (const tile of result.data.tiles) {
                    if (tile.quantumCube === playerId) {
                      const orbitals = getOrbitalPositions(tile);
                      for (const pos of orbitals) {
                        const occupied = result.data.ships.some(
                          s => s.position?.x === pos.x && s.position?.y === pos.y
                        );
                        if (!occupied) {
                          validDeployPositions.push(pos);
                        }
                      }
                    }
                  }
                  console.log('Valid deploy positions:', validDeployPositions);
                  console.log('About to set state for continued deploy');
                  set({
                    gameState: result.data,
                    availableActions: engine.getAvailableActions(),
                    highlightedPositions: validDeployPositions,
                    selectedScrapyardIndex: 0,
                    isDeployMode: true,
                    isFreeDeployMode: true,
                    isLoading: false,
                  });
                  return true; // Return early to skip post-switch logic
                } else {
                  // Expansion complete or Reorganization deploys complete
                  get().clearPendingGambitEffect();
                  get().exitDeployMode();
                  if (pendingGambitEffect?.type === 'REORGANIZATION') {
                    set({ reorganizationPhase: null });
                  }
                  // Let post-switch logic handle state update
                }
              }
            } else {
              result = engine.deploy(playerId, action.shipIndex, action.targetPosition);
              if (result.success) {
                get().exitDeployMode();
              }
            }
            break;

          case 'move':
            result = engine.move(playerId, action.shipId, action.targetPosition);
            break;

          case 'attack':
            // Get defender's owner before the attack resolves
            // Original attack logic below
            // const targetShip = gameState.ships.find(
            //   s => s.position?.x === action.targetPosition.x && s.position?.y === action.targetPosition.y
            // );
            // const defenderId = targetShip?.ownerId ?? null;
            // result = engine.attack(playerId, action.shipId, action.targetPosition, action.moveToTarget ?? true);
            //   if (result.success && result.combatResult) {
            //     const combat = result.combatResult;
            //     const loserPlayerId = combat.winner === 'attacker' ? defenderId : playerId;
    
            //     set({
            //       lastCombatResult: {
            //       winner: combat.winner,
            //       attackerRoll: combat.attackerRoll,
            //       defenderRoll: combat.defenderRoll,
            //       attackerTotal: combat.attackerTotal,
            //       defenderTotal: combat.defenderTotal,
            //       loserNewShipValue: combat.defenderNewPipValue ?? null,
            //       loserPlayerId: loserPlayerId,
            //       },
            //     });
            // }  

            // Attack case logic refactor 
            get().initiateAttack(action.shipId, action.targetPosition);
            return true;
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

  // Handle Gambit Effects
  const baseCardId = card.id.toString().split('-')[0].toUpperCase();

  if (card.type === CardType.GAMBIT) {
    switch (baseCardId) {
      case 'EXPANSION' :
        // Calculate valid orbital positions directly 
        const validDeployPositions: Position[] = [];
        for (const tile of updatedState.tiles) {
          if (tile.quantumCube === playerId) {
            const orbitals = getOrbitalPositions(tile);
            for (const pos of orbitals) {
              const occupied = updatedState.ships.some(
                s => s.position?.x === pos.x && s.position?.y === pos.y
              );
              if (!occupied) {
                validDeployPositions.push(pos);
              }
            }
          }
        }
        console.log('Expansion valid deploy positions:', validDeployPositions);
        
        set({
          gameState: updatedState,
          pendingCardSelections: pendingCardSelections - 1,
          showCardSelection: false,
          pendingGambitEffect: {
            type: 'EXPANSION',
            data: { scrapyardIndex: updatedPlayer!.scrapyard.length - 1 }
          }
        });

          get().enterDeployMode(updatedPlayer!.scrapyard.length - 1, validDeployPositions);
          return; // Don't end turn yet
      
      case 'REORGANIZATION' :
        set({
          gameState: updatedState,
          pendingCardSelections: pendingCardSelections - 1,
          showCardSelection: false,
          showReorganizationModal: true,
          reorganizationPhase: 'reroll',
        });
        return;

      case 'RELOCATION' :
        set({
          gameState: updatedState,
          pendingCardSelections: pendingCardSelections - 1,
          showCardSelection: false,
          showRelocationModal: true,
          relocationPhase: 'selectCube',
        });
        return;

      case 'SABOTAGE' :
        const currentId = gameState.currentPlayerId;
        const opponentPlayers = updatedState.players.filter(p => p.id !== currentId);
  
        // AI opponents auto-discard
        for (const opponent of opponentPlayers) {
          if (opponent.type === 'ai' && opponent.activeCommandCards.length > 0) {
            const cardToDiscard = opponent.activeCommandCards[0];
            engine.sabotageDiscard(opponent.id, cardToDiscard.id);
          }
        }

        // Check if any human opponents need to discard
        const humansNeedingDiscard = updatedState.players.filter(p => 
          p.id !== currentId && 
          p.type === 'human' && 
          p.activeCommandCards.length > 0
        );

        if (humansNeedingDiscard.length === 0) {
          set({
            gameState: engine.getState(),
            pendingCardSelections: pendingCardSelections - 1,
            showCardSelection: false,
          });
          get().endTurn();
        } else {
          set({
            gameState: engine.getState(),
            pendingCardSelections: pendingCardSelections - 1,
            showCardSelection: false,
            showSabotageModal: true,
            sabotageDiscards: {},
          });
        }
        return;
    }
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
    // Simplified Combat logic after unifying refactor that uses GameState
    initiateAttack: (shipId, targetPosition) => {
      const { engine, gameState } = get();
      if (!engine || !gameState) return;

      const playerId = gameState.currentPlayerId;
      const result = engine.initiateAttack(playerId, shipId, targetPosition);

      if (result.success) {
        set({
          gameState: result.data,
          availableActions: engine.getAvailableActions(),
          isLoading: false,
        });

        if (result.completed && result.combatResult) {
          get().setCombatResult(result.combatResult);
        }
      } else {
        set({ isLoading: false }); // Reset on failure too
      }
    },

    submitCombatInput: (input: CombatInput) => {
      const { engine } = get();
      if (!engine) return;

      const result = engine.advanceCombat(input);

      if (result.success) {
        set({
          gameState: result.data,
          availableActions: engine.getAvailableActions(),
          isLoading: false,
        });

        if (result.completed && result.combatResult) {
          get().setCombatResult(result.combatResult);
        }
      }
    },

    setCombatResult: (combatResult: CombatResult) => {
      set({
        lastCombatResult: {
          winner: combatResult.dangerousActivated ? 'none' : combatResult.winner,
          attackerRoll: combatResult.attackerRoll,
          defenderRoll: combatResult.defenderRoll,
          attackerTotal: combatResult.attackerTotal,
          defenderTotal: combatResult.defenderTotal,
          loserNewShipValue: combatResult.defenderNewPipValue ?? combatResult.attackerNewPipValue ?? null,
          loserPlayerId: combatResult.winner === 'attacker'
            ? combatResult.defenderPlayerId
            : combatResult.attackerPlayerId,
          dangerousActivated: combatResult.dangerousActivated,
        },
      });
    },

    cancelCombat: () => {
      const { engine } = get();
      if (!engine) return;

      const result = engine.cancelCombat();

      if (result.success) {
        set({
          gameState: result.data,
          availableActions: engine.getAvailableActions(),
        });
      }
    },

    // Handle Attack logic
//     initiateAttack: (shipId, targetPosition) => {
//       const { engine, gameState } = get();
//       if (!engine || !gameState) return;

//       const playerId = gameState.currentPlayerId;
//       const result = engine.initiateAttack(playerId, shipId, targetPosition);
//       if (!result.success) return;

//       const { attackerShipId, defenderShipId, defenderHasDangerous } = result.data;
//       const attackerShip = gameState.ships.find(s => s.id === attackerShipId)!;
//       const defenderShip = gameState.ships.find(s => s.id === defenderShipId)!;
//       const defenderPlayer = gameState.players.find(p => p.id === defenderShip.ownerId);

//       if (defenderHasDangerous) {
//         // Check if defender is AI
//         if (defenderPlayer?.type === 'ai') {
//           // AI decides immediately - skip Dangerous for MVP
//           get().executeCombatRolls(attackerShipId, defenderShipId, attackerShip.position!, targetPosition);
//         } else {
//           // Human defender - show pre-combat modal
//           set({
//             combatPhase: 'pre-combat',
//             pendingCombat: {
//               attackerShipId,
//               defenderShipId,
//               attackerOrigin: attackerShip.position!,
//               targetPosition,
//               defenderHasDangerous: true,
//               attackerRoll: 0,
//               defenderRoll: 0,
//               attackerTotal: 0,
//               defenderTotal: 0,
//               attackerModifiers: [],
//               defenderModifiers: [],
//               rerollsUsed: { cruel: false, relentless: false, scrappy: false },
//               attackerCanCruel: false,
//               attackerCanRelentless: false,
//               attackerCanScrappy: false,
//               defenderCanCruel: false,
//               defenderCanRelentless: false,
//             },
//           });
//         }
//       } else {
//         // No Dangerous - go straight to rolls
//         get().executeCombatRolls(attackerShipId, defenderShipId, attackerShip.position!, targetPosition);
//       }
//     },

// activateDangerous: () => {
//   const { engine, pendingCombat } = get();
//   if (!engine || !pendingCombat) return;

//   const result = engine.resolveDangerous(
//     engine.getState().currentPlayerId,
//     pendingCombat.attackerShipId,
//     pendingCombat.defenderShipId
//   );

//   if (result.success) {
//     set({
//       gameState: result.data,
//       availableActions: engine.getAvailableActions(),
//       combatPhase: null,
//       pendingCombat: null,
//       lastCombatResult: {
//         winner: 'none',
//         attackerRoll: 0,
//         defenderRoll: 0,
//         attackerTotal: 0,
//         defenderTotal: 0,
//         loserNewShipValue: null,
//         loserPlayerId: null,
//         dangerousActivated: true,
//       },
//     });
//   }
// },

// skipDangerous: () => {
//   const { pendingCombat } = get();
//   if (!pendingCombat) return;
//   get().executeCombatRolls(
//     pendingCombat.attackerShipId, 
//     pendingCombat.defenderShipId, 
//     pendingCombat.attackerOrigin, 
//     pendingCombat.targetPosition
//   );
// },

// executeCombatRolls: (attackerShipId, defenderShipId, attackerOrigin, targetPosition) => {
//   const { engine, gameState } = get();
//   if (!engine || !gameState) return;

//   const rolls = engine.rollCombat(attackerShipId, defenderShipId);
  
//   const attackerShip = gameState.ships.find(s => s.id === attackerShipId)!;
//   const defenderShip = gameState.ships.find(s => s.id === defenderShipId)!;
//   const attackerPlayer = gameState.players.find(p => p.id === attackerShip.ownerId)!;
//   const defenderPlayer = gameState.players.find(p => p.id === defenderShip.ownerId)!;
//   const isAttackerTurn = gameState.currentPlayerId === attackerPlayer.id;

//   // Determine re-roll availability
//   const attackerCanCruel = attackerPlayer.activeCommandCards.some(
//     c => c.id.toString().split('-')[0].toLowerCase() === 'cruel'
//   );
//   const attackerCanRelentless = attackerPlayer.activeCommandCards.some(
//     c => c.id.toString().split('-')[0].toLowerCase() === 'relentless'
//   );
//   const attackerCanScrappy = isAttackerTurn && attackerPlayer.activeCommandCards.some(
//     c => c.id.toString().split('-')[0].toLowerCase() === 'scrappy'
//   );
//   const defenderCanCruel = defenderPlayer.activeCommandCards.some(
//     c => c.id.toString().split('-')[0].toLowerCase() === 'cruel'
//   );
//   const defenderCanRelentless = defenderPlayer.activeCommandCards.some(
//     c => c.id.toString().split('-')[0].toLowerCase() === 'relentless'
//   );

//   const hasHumanRerollOptions = 
//     (attackerPlayer.type === 'human' && (attackerCanCruel || attackerCanRelentless || attackerCanScrappy)) ||
//     (defenderPlayer.type === 'human' && (defenderCanCruel || defenderCanRelentless));
  

//   set({
//     combatPhase: hasHumanRerollOptions ? 're-roll' : 'resolution',
//     pendingCombat: {
//       attackerShipId,
//       defenderShipId,
//       attackerOrigin,
//       targetPosition,
//       defenderHasDangerous: false,
//       attackerRoll: rolls.attackerRoll,
//       defenderRoll: rolls.defenderRoll,
//       attackerTotal: rolls.attackerTotal,
//       defenderTotal: rolls.defenderTotal,
//       attackerModifiers: rolls.attackerModifiers,
//       defenderModifiers: rolls.defenderModifiers,
//       rerollsUsed: { cruel: false, relentless: false, scrappy: false },
//       attackerCanCruel,
//       attackerCanRelentless,
//       attackerCanScrappy,
//       defenderCanCruel,
//       defenderCanRelentless,
//     },
//   });
//   // If no human has re-roll options, process AI re-rolls then go to resolution
//   if (!hasHumanRerollOptions) {
//     get().processAICombatRerolls();
//   }
// },

// useCombatReroll: (type: 'cruel' | 'relentless' | 'scrappy', initiatedBy: string) => {
//   const { engine, pendingCombat } = get();
//   if (!engine || !pendingCombat) return;

//   const result = engine.rerollCombat(
//     pendingCombat.attackerShipId,
//     pendingCombat.defenderShipId,
//     pendingCombat.attackerRoll,
//     pendingCombat.defenderRoll,
//     type,
//     initiatedBy
//   );

//   set({
//     pendingCombat: {
//       ...pendingCombat,
//       attackerRoll: result.attackerRoll,
//       defenderRoll: result.defenderRoll,
//       attackerTotal: result.attackerTotal,
//       defenderTotal: result.defenderTotal,
//       rerollsUsed: { ...pendingCombat.rerollsUsed, [type]: true },
//     },
//   });
// },

// skipRerolls: () => {
//   set({ combatPhase: 'resolution' });
// },

// finalizeCombat: (moveToTarget: boolean) => {
//   const { engine, pendingCombat } = get();
//   if (!engine || !pendingCombat) return;

//   const result = engine.finalizeCombat(
//     pendingCombat.attackerShipId,
//     pendingCombat.defenderShipId,
//     pendingCombat.attackerRoll,
//     pendingCombat.defenderRoll,
//     pendingCombat.attackerTotal,
//     pendingCombat.defenderTotal,
//     moveToTarget
//   );

//   if (result.success) {
//     set({
//       gameState: result.data,
//       availableActions: engine.getAvailableActions(),
//       combatPhase: null,
//       pendingCombat: null,
//       lastCombatResult: {
//         winner: result.combatResult.winner,
//         attackerRoll: result.combatResult.attackerRoll,
//         defenderRoll: result.combatResult.defenderRoll,
//         attackerTotal: result.combatResult.attackerTotal,
//         defenderTotal: result.combatResult.defenderTotal,
//         loserNewShipValue: result.combatResult.defenderNewPipValue ?? result.combatResult.attackerNewPipValue ?? null,
//         loserPlayerId: result.combatResult.winner === 'attacker' 
//           ? pendingCombat.defenderShipId 
//           : pendingCombat.attackerShipId,
//       },
//     });
//   }
// },

    // Enter Deploy mode
    enterDeployMode: (scrapyardIndex = 0, freeDeployPositions?: Position[]) => {
      const { availableActions } = get();

      // If free deploy positions provided, use those (for Expansion)
      if (freeDeployPositions && freeDeployPositions.length > 0) {
        set({
          isDeployMode: true,
          isFreeDeployMode: true,
          selectedScrapyardIndex: scrapyardIndex,
          selectedShipId: null,
          highlightedPositions: freeDeployPositions,
        });
        return;
      }

      // Normal deploy - check avaiableActions
      if (!availableActions || availableActions.canDeploy.length === 0) return;
  
      set({
        isDeployMode: true,
        isFreeDeployMode: false,
        selectedScrapyardIndex: scrapyardIndex,
        selectedShipId: null,
        highlightedPositions: availableActions.canDeploy,
      });
    },
    // Exit Deploy mode
    exitDeployMode: () => {
      set({
        isDeployMode: false,
        isFreeDeployMode: false,
        selectedScrapyardIndex: 0,
        highlightedPositions: [],
      });
    },
    // Clear Gambit Effect
    clearPendingGambitEffect: () => {
      set({
        pendingGambitEffect: null,
      });
    },
    // Set Selected Scrapyard Ship
    setSelectedScrapyardIndex: (index) => {
      set({
        selectedScrapyardIndex: index,
      });
    },
    // Execute Reorganization
    executeReorganization: (shipIds, scrapyardIndices) => {
      const { engine, gameState } = get();
      if (!engine || !gameState) return;

      const playerId = gameState.currentPlayerId;
      const result = engine.reorganizeShips(playerId, shipIds, scrapyardIndices);

      if (result.success) {
        const updatedState = result.data;
        const player = updatedState.players.find(p => p.id === playerId);

        // If player has ships in scrapyard, enter free deploy phase
        if (player && player.scrapyard.length > 0) {
          // Calculate valid deploy positions
          const validDeployPositions: Position[] = [];
          for (const tile of updatedState.tiles) {
            if (tile.quantumCube === playerId) {
              const orbitals = getOrbitalPositions(tile);
              for (const pos of orbitals) {
                const occupied = updatedState.ships.some(
                  s => s.position?.x === pos.x && s.position?.y === pos.y
                );
                if (!occupied) {
                  validDeployPositions.push(pos);
                }
              }
            }
          }

          set({
            gameState: updatedState,
            showReorganizationModal: false,
            reorganizationPhase: 'deploy',
            pendingGambitEffect: { type: 'REORGANIZATION', data: {} },
            isDeployMode: true,
            isFreeDeployMode: true,
            selectedScrapyardIndex: 0,
            highlightedPositions: validDeployPositions,
          });
        } else {
          // No ships to deploy, end reorganization
          set({
            gameState: updatedState,
            showReorganizationModal: false,
            reorganizationPhase: null,
          });
          get().endTurn();
        }
      }
    },

    finishReorganizationDeploy: () => {
      get().clearPendingGambitEffect();
      get().exitDeployMode();
      set({ reorganizationPhase: null });
      get().endTurn();
    },

    // Select Relocation and execute
    selectRelocationCube: (tileId, cubePlayerId) => {
      const { gameState } = get();
      if (!gameState) return;

      // Calculate valid destination planets (any without this opponent's cube)
      const validDestinations = gameState.tiles
        .filter(t => t.id !== tileId && t.quantumCube !== cubePlayerId)
        .map(t => t.id);

      set({
        showRelocationModal: false,
        relocationPhase: 'selectDestination',
        selectedRelocationCube: { tileId, playerId: cubePlayerId },
        highlightedTiles: validDestinations,
      });
    },

    executeRelocation: (destTileId) => {
      const { engine, selectedRelocationCube, gameState } = get();
      if (!engine || !selectedRelocationCube || !gameState) return;

      const playerId = gameState.currentPlayerId;
      
      const result = engine.relocateCube(playerId, selectedRelocationCube.tileId, destTileId);
  
      if (result.success) {
        set({
          gameState: result.data,
          relocationPhase: null,
          selectedRelocationCube: null,
          highlightedTiles: [],
        });
        get().endTurn();
      }
    },

    cancelRelocation: () => {
      set({
        showRelocationModal: false,
        relocationPhase: null,
        selectedRelocationCube: null,
        highlightedTiles: [],
      });
      get().endTurn();
    },

    // Sabotage
    executeSabotageDiscard: (playerId, cardId) => {
      const { engine, gameState, sabotageDiscards } = get();
      if (!engine || !gameState) return;

      const result = engine.sabotageDiscard(playerId, cardId);
      
      if (!result.success) return;

      const newDiscards = { ...sabotageDiscards, [playerId]: cardId };
      const currentPlayerId = gameState.currentPlayerId;
      
      // Find human opponents who still need to discard
      const pendingHumans = gameState.players.filter(p => 
        p.id !== currentPlayerId && 
        p.type === 'human' &&
        p.activeCommandCards.length > 0 &&
        !newDiscards[p.id]
      );

      if (pendingHumans.length === 0) {
        // All done
        set({
          gameState: result.data,
          showSabotageModal: false,
          sabotageDiscards: {},
        });
        get().endTurn();
      } else {
        set({
          gameState: result.data,
          sabotageDiscards: newDiscards,
        });
      }
    },

    // Flexible
    flexibleAdjust: (shipId, direction) => {
      const { engine, gameState } = get();
      if (!engine || !gameState) return;

      const playerId = gameState.currentPlayerId;
      const result = engine.flexibleAdjust(playerId, shipId, direction);

      if (result.success) {
        set({ 
          gameState: result.data,
          availableActions: engine.getAvailableActions(),
        });
      }
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
    const newState = result.data;
    engine.startTurn(newState.currentPlayerId);
    const stateAfterTurnStart = engine.getState();
    set({
      gameState: stateAfterTurnStart,
      availableActions: engine.getAvailableActions(),
      selectedShipId: null,
      highlightedPositions: [],
    });
    
    // Check if next player is AI
    const nextPlayer = stateAfterTurnStart.players.find(p => p.id === stateAfterTurnStart.currentPlayerId);
    if (nextPlayer?.type === 'ai' && stateAfterTurnStart.status === 'in_progress') {
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
      
      // Execute AI turn
      await ai.executeTurn(engine);
      
      const newState = engine.getState();

      // Check for combat in new actions
      const newActions = newState.actionLog.slice(actionLogLengthBefore);
      const attackAction = newActions.find(a => a.type === ActionType.ATTACK);

      if (attackAction && attackAction.combatResult) {
        const combat = attackAction.combatResult;
          console.log('AI Combat Result:', {
            winner: combat.winner,
            attackerTotal: combat.attackerTotal,
            defenderTotal: combat.defenderTotal,
            attackerPlayerId: combat.attackerPlayerId,
            defenderPlayerId: combat.defenderPlayerId,
          });
        const loserPlayerId = combat.winner === 'attacker'
          ? attackAction.targetPlayerId
          : attackAction.playerId;
        
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
      
      // Check if still AI's turn
      const nextPlayer = newState.players.find(p => p.id === newState.currentPlayerId);
      if (nextPlayer?.type === 'ai' && newState.status === 'in_progress') {
        setTimeout(() => get().processAITurn(), 500);
      }
    },

    // Commented out processAICombat and processAICombatRerolls - TO BE REMOVED ONCE COMBAT REFACTOR IS TESTED - OLD METHODS FROM LEGACY COMBAT IMPLEMENTATION - AI COMBAT IS NOW HANDLED IN ENGINE advanceCombat METHOD
    
    // Handle AI Combat
    // processAICombat: () => {
    //   const { combatPhase, pendingCombat, gameState } = get();
    //   if (!combatPhase || !pendingCombat || !gameState) return;

    //   const defenderShip = gameState.ships.find(s => s.id === pendingCombat.defenderShipId);
    //   const defenderPlayer = gameState.players.find(p => p.id === defenderShip?.ownerId);
    //   const isAIDefender = defenderPlayer?.type === 'ai';

    //   const attackerShip = gameState.ships.find(s => s.id === pendingCombat.attackerShipId);
    //   const attackerPlayer = gameState.players.find(p => p.id === attackerShip?.ownerId);
    //   const isAIAttacker = attackerPlayer?.type === 'ai';

    //   if (combatPhase === 'pre-combat') {
    //     if (isAIDefender) {
    //       get().skipDangerous();
    //     }
    //     return;
    //   }

    //   if (combatPhase === 're-roll') {
    //     const { 
    //       attackerTotal, defenderTotal, rerollsUsed,
    //       attackerCanCruel, attackerCanRelentless, attackerCanScrappy,
    //       defenderCanCruel, defenderCanRelentless
    //     } = pendingCombat;

    //     const attackerWinning = attackerTotal <= defenderTotal;

    //     if (isAIAttacker && !attackerWinning) {
    //       if (attackerCanCruel && !rerollsUsed.cruel) {
    //         get().useCombatReroll('cruel', attackerPlayer!.id);
    //         return;
    //       }
    //       if (attackerCanRelentless && !rerollsUsed.relentless) {
    //         get().useCombatReroll('relentless', attackerPlayer!.id);
    //         return;
    //       }
    //       if (attackerCanScrappy && !rerollsUsed.scrappy) {
    //         get().useCombatReroll('scrappy', attackerPlayer!.id);
    //         return;
    //       }
    //     }

    //     if (isAIDefender && attackerWinning) {
    //       if (defenderCanCruel && !rerollsUsed.cruel) {
    //         get().useCombatReroll('cruel', defenderPlayer!.id);
    //         return;
    //       }
    //       if (defenderCanRelentless && !rerollsUsed.relentless) {
    //         get().useCombatReroll('relentless', defenderPlayer!.id);
    //         return;
    //       }
    //     }

    //     get().skipRerolls();
    //     return;
    //   }

    //   if (combatPhase === 'resolution') {
    //     if (isAIAttacker) {
    //       const attackerWins = pendingCombat.attackerTotal <= pendingCombat.defenderTotal;
    //       get().finalizeCombat(attackerWins);
    //     } else {
    //       get().finalizeCombat(true);
    //     }
    //     return;
    //   }
    // },

    // Handle AI Combat Rerolls
    // processAICombatRerolls: () => {
    //   const { pendingCombat, gameState } = get();
    //   if (!pendingCombat || !gameState) return;

    //   const attackerShip = gameState.ships.find(s => s.id === pendingCombat.attackerShipId);
    //   const defenderShip = gameState.ships.find(s => s.id === pendingCombat.defenderShipId);
    //   const attackerPlayer = gameState.players.find(p => p.id === attackerShip?.ownerId);
    //   const defenderPlayer = gameState.players.find(p => p.id === defenderShip?.ownerId);

    //   let { attackerTotal, defenderTotal, rerollsUsed, attackerCanCruel, attackerCanRelentless, attackerCanScrappy, defenderCanCruel, defenderCanRelentless } = pendingCombat;
      
    //   const attackerWinning = attackerTotal <= defenderTotal;

    //   // AI attacker re-rolls if losing
    //   if (attackerPlayer?.type === 'ai' && !attackerWinning) {
    //     if (attackerCanCruel && !rerollsUsed.cruel) {
    //       get().useCombatReroll('cruel', attackerPlayer.id);
    //       rerollsUsed = { ...rerollsUsed, cruel: true };
    //     } else if (attackerCanRelentless && !rerollsUsed.relentless) {
    //       get().useCombatReroll('relentless', attackerPlayer.id);
    //       rerollsUsed = { ...rerollsUsed, relentless: true };
    //     } else if (attackerCanScrappy && !rerollsUsed.scrappy) {
    //       get().useCombatReroll('scrappy', attackerPlayer.id);
    //       rerollsUsed = { ...rerollsUsed, scrappy: true };
    //     }
    //   }

    //   // Refresh state after potential re-roll
    //   const updatedCombat = get().pendingCombat;
    //   if (!updatedCombat) return;
      
    //   const newAttackerWinning = updatedCombat.attackerTotal <= updatedCombat.defenderTotal;

    //   // AI defender re-rolls if losing
    //   if (defenderPlayer?.type === 'ai' && newAttackerWinning) {
    //     if (defenderCanCruel && !updatedCombat.rerollsUsed.cruel) {
    //       get().useCombatReroll('cruel', defenderPlayer.id);
    //     } else if (defenderCanRelentless && !updatedCombat.rerollsUsed.relentless) {
    //       get().useCombatReroll('relentless', defenderPlayer.id);
    //     }
    //   }
    // },


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
