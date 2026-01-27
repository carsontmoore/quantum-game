/**
 * Action Bar Component
 * Quick action buttons for the current player
 */

import { useGameStore, selectCurrentPlayer } from '../stores/gameStore';
import clsx from 'clsx';

export function ActionBar() {
  const gameState = useGameStore(state => state.gameState);
  const currentPlayer = useGameStore(selectCurrentPlayer);
  const { availableActions, selectedShipId, performAction, endTurn, isLoading, isDeployMode, selectedScrapyardIndex, enterDeployMode, exitDeployMode, pendingGambitEffect, isFreeDeployMode, relocationPhase } = useGameStore();

  if (!gameState || !currentPlayer) return null;

  const selectedShip = selectedShipId
    ? gameState.ships.find(s => s.id === selectedShipId)
    : null;

  const canReconfigure = selectedShipId && availableActions?.canReconfigure.includes(selectedShipId);
  const canConstruct = availableActions && availableActions.canConstruct.length > 0;
  const isAITurn = currentPlayer.type === 'ai';

  return (
    <div className="mt-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left: Action info */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-400">
            {relocationPhase === 'selectDestination' ? ( 
              <span className="text-yellow-400 font-medium">
                Click a highlighted planet to relocate the cube
              </span>
            ) : isAITurn ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⚙️</span>
                AI is thinking...
              </span>
            ) : selectedShip ? (
              <span>
                Selected: <span className="text-slate-200 font-medium">
                  Ship {selectedShip.pipValue}
                </span>
                {selectedShip.hasMovedThisTurn && (
                  <span className="text-amber-400 ml-2">(Already moved)</span>
                )}
              </span>
            ) : (
              'Select a ship to move or attack'
            )}
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-2">
          {/* Deploy */}
          <button
            onClick={() => {
              // TODO: Implement deploy action - select ship from scrapyard, then select orbital position
              if (isDeployMode) {
                exitDeployMode();
              } else {
                enterDeployMode(0);
              }
              console.log('Deploy clicked - needs implementation');
            }}
            disabled={currentPlayer?.scrapyard.length === 0}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
              currentPlayer?.scrapyard.length === 0
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            )}
          >
            🚀 Deploy
          </button>
          {/* Done Deploying */}
          {pendingGambitEffect?.type === 'REORGANIZATION' && isFreeDeployMode && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Deploy:</span>
              {currentPlayer?.scrapyard.map((value, index) => (
                <button
                  key={index}
                  onClick={() => useGameStore.getState().setSelectedScrapyardIndex(index)}
                  className={clsx(
                    'w-10 h-10 rounded font-bold',
                    selectedScrapyardIndex === index
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  )}
                >
                  {value}
                </button>
              ))}
              <button
                onClick={() => useGameStore.getState().finishReorganizationDeploy()}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium"
              >
                Done Deploying
              </button>
            </div>
          )}

          {/* Reconfigure */}
          <button
            onClick={() => selectedShipId && performAction({ type: 'reconfigure', shipId: selectedShipId })}
            disabled={!canReconfigure || isLoading || isAITurn}
            className={clsx(
              'action-btn secondary text-sm',
              !canReconfigure && 'opacity-50'
            )}
            title="Reroll selected ship (costs 1 action)"
          >
            🎲 Reconfigure
          </button>

          {/* Construct */}
          <button
            onClick={() => {
              if (availableActions?.canConstruct[0]) {
                performAction({ type: 'construct', tileId: availableActions.canConstruct[0] });
              }
            }}
            disabled={!canConstruct || isLoading || isAITurn}
            className={clsx(
              'action-btn text-sm',
              canConstruct ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'secondary opacity-50'
            )}
            title="Place a quantum cube (costs 2 actions)"
          >
            🔮 Construct
            {canConstruct && (
              <span className="ml-1 text-xs opacity-75">
                ({availableActions?.canConstruct.length})
              </span>
            )}
          </button>

          {/* Research */}
          <button
            onClick={() => performAction({ type: 'research' })}
            disabled={!availableActions?.canResearch || isLoading || isAITurn}
            className={clsx(
              'action-btn secondary text-sm',
              !availableActions?.canResearch && 'opacity-50'
            )}
            title="Add 1 to research counter (costs 1 action)"
          >
            📚 Research
          </button>

          {/* End Turn */}
          <button
            onClick={endTurn}
            disabled={isLoading || isAITurn}
            className="action-btn primary text-sm"
          >
            End Turn →
          </button>
        </div>
      </div>

      {/* Constructable planets hint */}
      {canConstruct && !isAITurn && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="text-sm text-green-400">
            ✓ You can construct on: {availableActions?.canConstruct.map((tileId, i) => {
              const tile = gameState.tiles.find(t => t.id === tileId);
              return (
                <button
                  key={tileId}
                  onClick={() => performAction({ type: 'construct', tileId })}
                  className="inline-block mx-1 px-2 py-0.5 bg-green-600/30 rounded hover:bg-green-600/50 transition-colors"
                >
                  Planet {tile?.planetNumber}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
