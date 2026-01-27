import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import clsx from 'clsx';

export function ReorganizationModal() {
  const { 
    gameState, 
    showReorganizationModal, 
    reorganizationPhase,
    engine 
  } = useGameStore();
  
  const [selectedShipIds, setSelectedShipIds] = useState<string[]>([]);
  const [selectedScrapyardIndices, setSelectedScrapyardIndices] = useState<number[]>([]);

  if (!showReorganizationModal || !gameState || !engine) return null;

  const playerId = gameState.currentPlayerId;
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return null;

  const deployedShips = gameState.ships.filter(s => s.ownerId === playerId && s.position !== null);

  const toggleShip = (shipId: string) => {
    setSelectedShipIds(prev => 
      prev.includes(shipId) 
        ? prev.filter(id => id !== shipId)
        : [...prev, shipId]
    );
  };

  const toggleScrapyard = (index: number) => {
    setSelectedScrapyardIndices(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleConfirmReroll = () => {
    useGameStore.getState().executeReorganization(selectedShipIds, selectedScrapyardIndices);
    setSelectedShipIds([]);
    setSelectedScrapyardIndices([]);
  };

  const handleSkipReroll = () => {
    useGameStore.getState().executeReorganization([], []);
  };

  if (reorganizationPhase === 'reroll') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-lg w-full mx-4">
          <h2 className="text-xl font-bold text-white mb-2">Reorganization</h2>
          <p className="text-slate-400 text-sm mb-4">
            Select ships to re-roll. They will be moved to your scrapyard with new values.
          </p>

          {/* Deployed Ships */}
          {deployedShips.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Deployed Ships</h3>
              <div className="flex flex-wrap gap-2">
                {deployedShips.map(ship => (
                  <button
                    key={ship.id}
                    onClick={() => toggleShip(ship.id)}
                    className={clsx(
                      'w-12 h-12 rounded-lg font-bold text-lg transition-all',
                      selectedShipIds.includes(ship.id)
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    )}
                  >
                    {ship.pipValue}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scrapyard Ships */}
          {player.scrapyard.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Scrapyard Ships</h3>
              <div className="flex flex-wrap gap-2">
                {player.scrapyard.map((value, index) => (
                  <button
                    key={index}
                    onClick={() => toggleScrapyard(index)}
                    className={clsx(
                      'w-12 h-12 rounded-lg font-bold text-lg transition-all',
                      selectedScrapyardIndices.includes(index)
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleSkipReroll}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
            >
              Skip Re-roll
            </button>
            <button
              onClick={handleConfirmReroll}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
            >
              Re-roll Selected ({selectedShipIds.length + selectedScrapyardIndices.length})
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Deploy phase is handled by existing deploy mode
  return null;
}