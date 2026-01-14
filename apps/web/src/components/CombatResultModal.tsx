import { useGameStore } from '../stores/gameStore';

export function CombatResultModal() {
  const { lastCombatResult, clearCombatResult, gameState } = useGameStore();

  if (!lastCombatResult || !gameState) return null;

  const { winner, attackerRoll, defenderRoll, attackerTotal, defenderTotal, loserNewShipValue, loserPlayerId } = lastCombatResult;
  const loserPlayer = gameState.players.find(p => p.id === loserPlayerId);
  const isCurrentPlayerLoser = loserPlayerId === gameState.currentPlayerId;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-xl font-bold text-center mb-4">
          ⚔️ Combat Resolved
        </h2>

        {/* <div className="flex justify-center gap-8 mb-4">
          <div className="text-center">
            <div className="text-sm text-slate-400 mb-1">Attacker</div>
            <div className={`text-3xl font-bold ${winner === 'attacker' ? 'text-green-400' : 'text-red-400'}`}>
              {attackerRoll}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-400 mb-1">Defender</div>
            <div className={`text-3xl font-bold ${winner === 'defender' ? 'text-green-400' : 'text-red-400'}`}>
              {defenderRoll}
            </div>
          </div>
        </div> */}

        <div className="flex justify-center gap-8 mb-4">
          <div className="text-center">
            <div className="text-sm text-slate-400 mb-1">Attacker</div>
            <div className="text-sm text-slate-500 mb-1">
              (roll {attackerRoll} + ship)
            </div>
            <div className={`text-3xl font-bold ${winner === 'attacker' ? 'text-green-400' : 'text-red-400'}`}>
              {attackerTotal}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-400 mb-1">Defender</div>
            <div className="text-sm text-slate-500 mb-1">
              (roll {defenderRoll} + ship)
            </div>
            <div className={`text-3xl font-bold ${winner === 'defender' ? 'text-green-400' : 'text-red-400'}`}>
              {defenderTotal}
            </div>
          </div>
        </div>

        <div className="text-center mb-4">
          <span className="text-lg">
            {winner === 'attacker' ? '🎯 Attacker wins!' : '🛡️ Defender holds!'}
          </span>
        </div>

        {loserNewShipValue && (
          <div className="bg-slate-700/50 rounded-lg p-4 mb-4 text-center">
            <div className="text-sm text-slate-400 mb-1">
              {isCurrentPlayerLoser ? 'Your' : `${loserPlayer?.name || 'Opponent'}'s`} ship sent to scrapyard
            </div>
            <div className="text-2xl font-bold text-blue-400">
              Re-rolled: [{loserNewShipValue}]
            </div>
          </div>
        )}

        <button
          onClick={clearCombatResult}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}