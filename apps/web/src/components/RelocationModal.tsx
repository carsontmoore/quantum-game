import { useGameStore } from '../stores/gameStore';

export function RelocationModal() {
  const { 
    gameState, 
    showRelocationModal, 
    relocationPhase,
  } = useGameStore();

  if (!showRelocationModal || !gameState || relocationPhase !== 'selectCube') return null;

  const playerId = gameState.currentPlayerId;
  
  // Find all opponent cubes
  const opponentCubes = gameState.tiles
    .filter(t => t.quantumCube && t.quantumCube !== playerId)
    .map(t => ({ tileId: t.id, playerId: t.quantumCube!, planetNumber: t.planetNumber }));

  const handleSelectCube = (tileId: string, cubePlayerId: string) => {
    useGameStore.getState().selectRelocationCube(tileId, cubePlayerId);
  };

  const handleCancel = () => {
    useGameStore.getState().cancelRelocation();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-lg w-full mx-4">
        <h2 className="text-xl font-bold text-white mb-2">Relocation</h2>
        <p className="text-slate-400 text-sm mb-4">
          Select an opponent's cube to relocate.
        </p>

        {opponentCubes.length === 0 ? (
          <div>
            <p className="text-slate-500 mb-4">No opponent cubes to relocate.</p>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 mb-6">
              {opponentCubes.map(cube => {
                const owner = gameState.players.find(p => p.id === cube.playerId);
                return (
                  <button
                    key={cube.tileId}
                    onClick={() => handleSelectCube(cube.tileId, cube.playerId)}
                    className="flex flex-col items-center p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <span className="text-2xl">🔮</span>
                    <span className="text-sm text-slate-300">Planet {cube.planetNumber}</span>
                    <span className="text-xs text-slate-400">{owner?.factionId}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}