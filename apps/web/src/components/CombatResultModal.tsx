import { useGameStore } from '../stores/gameStore';

export function CombatResultModal() {
  const { 
    combatPhase, 
    pendingCombat, 
    lastCombatResult, 
    clearCombatResult, 
    gameState,
    activateDangerous,
    skipDangerous,
    useCombatReroll,
    skipRerolls,
    finalizeCombat,
  } = useGameStore();

  // Show final result (existing behavior)
  if (lastCombatResult && !pendingCombat) {
    const { winner, attackerRoll, defenderRoll, attackerTotal, defenderTotal, loserNewShipValue, loserPlayerId, dangerousActivated } = lastCombatResult;
    const loserPlayer = gameState?.players.find(p => p.id === loserPlayerId);
    const isCurrentPlayerLoser = loserPlayerId === gameState?.currentPlayerId;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
          <h2 className="text-xl font-bold text-center mb-4">
            ⚔️ Combat Resolved
          </h2>

          {dangerousActivated ? (
            <div className="text-center mb-4">
              <span className="text-lg text-red-400">
                💥 Dangerous activated! Both ships destroyed.
              </span>
            </div>
          ) : (
            <>
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
            </>
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

  // No active combat
  if (!pendingCombat || !combatPhase || !gameState) return null;

  const attackerShip = gameState.ships.find(s => s.id === pendingCombat.attackerShipId);
  const defenderShip = gameState.ships.find(s => s.id === pendingCombat.defenderShipId);
  const attackerPlayer = gameState.players.find(p => p.id === attackerShip?.ownerId);
  const defenderPlayer = gameState.players.find(p => p.id === defenderShip?.ownerId);
  const currentPlayerId = gameState.currentPlayerId;
  const isAttacker = currentPlayerId === attackerPlayer?.id;

  // Pre-combat: Dangerous choice
  if (combatPhase === 'pre-combat') {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
          <h2 className="text-xl font-bold text-center mb-4">
            ⚔️ Incoming Attack!
          </h2>

          <div className="text-center mb-4">
            <p className="text-slate-300 mb-2">
              {attackerPlayer?.factionId}'s ship ({attackerShip?.pipValue}) is attacking your ship ({defenderShip?.pipValue})
            </p>
            <p className="text-amber-400 font-medium">
              You have the Dangerous card!
            </p>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-slate-300 text-center">
              Activate to destroy both ships with no dominance change.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={activateDangerous}
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
            >
              💥 Activate Dangerous
            </button>
            <button
              onClick={skipDangerous}
              className="flex-1 py-3 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors"
            >
              Fight Normally
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Re-roll phase
  if (combatPhase === 're-roll') {
    const { 
      attackerRoll, defenderRoll, attackerTotal, defenderTotal,
      attackerModifiers, defenderModifiers, rerollsUsed,
      attackerCanCruel, attackerCanRelentless, attackerCanScrappy,
      defenderCanCruel, defenderCanRelentless
    } = pendingCombat;

    // Determine current winner preview
    const currentWinner = attackerTotal <= defenderTotal ? 'attacker' : 'defender';

    // Available re-rolls for current player
    const myRerolls: { type: 'cruel' | 'relentless' | 'scrappy'; label: string }[] = [];
    
    if (isAttacker) {
      if (attackerCanCruel && !rerollsUsed.cruel) {
        myRerolls.push({ type: 'cruel', label: 'Cruel (force opponent re-roll)' });
      }
      if (attackerCanRelentless && !rerollsUsed.relentless) {
        myRerolls.push({ type: 'relentless', label: 'Relentless (re-roll your die)' });
      }
      if (attackerCanScrappy && !rerollsUsed.scrappy) {
        myRerolls.push({ type: 'scrappy', label: 'Scrappy (re-roll your die)' });
      }
    } else {
      if (defenderCanCruel && !rerollsUsed.cruel) {
        myRerolls.push({ type: 'cruel', label: 'Cruel (force opponent re-roll)' });
      }
      if (defenderCanRelentless && !rerollsUsed.relentless) {
        myRerolls.push({ type: 'relentless', label: 'Relentless (re-roll your die)' });
      }
    }

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
          <h2 className="text-xl font-bold text-center mb-4">
            ⚔️ Combat Rolls
          </h2>

          <div className="flex justify-center gap-8 mb-4">
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-1">Attacker</div>
              <div className="text-sm text-slate-500 mb-1">
                (roll {attackerRoll} + ship {attackerShip?.pipValue})
              </div>
              <div className={`text-3xl font-bold ${currentWinner === 'attacker' ? 'text-green-400' : 'text-red-400'}`}>
                {attackerTotal}
              </div>
              {attackerModifiers.length > 0 && (
                <div className="text-xs text-amber-400 mt-1">
                  {attackerModifiers.join(', ')}
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-1">Defender</div>
              <div className="text-sm text-slate-500 mb-1">
                (roll {defenderRoll} + ship {defenderShip?.pipValue})
              </div>
              <div className={`text-3xl font-bold ${currentWinner === 'defender' ? 'text-green-400' : 'text-red-400'}`}>
                {defenderTotal}
              </div>
              {defenderModifiers.length > 0 && (
                <div className="text-xs text-amber-400 mt-1">
                  {defenderModifiers.join(', ')}
                </div>
              )}
            </div>
          </div>

          <div className="text-center mb-4">
            <span className="text-sm text-slate-400">
              Current result: {currentWinner === 'attacker' ? '🎯 Attacker winning' : '🛡️ Defender winning'}
            </span>
          </div>

          {myRerolls.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-sm text-slate-300 text-center">Use a re-roll?</p>
              {myRerolls.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => useCombatReroll(type, currentPlayerId)}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={skipRerolls}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
          >
            {myRerolls.length > 0 ? 'Skip Re-rolls → Resolve' : 'Continue → Resolve'}
          </button>
        </div>
      </div>
    );
  }

  // Resolution phase
  if (combatPhase === 'resolution') {
    const { attackerRoll, defenderRoll, attackerTotal, defenderTotal } = pendingCombat;
    const winner = attackerTotal <= defenderTotal ? 'attacker' : 'defender';
    const attackerWins = winner === 'attacker';

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
          <h2 className="text-xl font-bold text-center mb-4">
            ⚔️ Combat Resolution
          </h2>

          <div className="flex justify-center gap-8 mb-4">
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-1">Attacker</div>
              <div className={`text-3xl font-bold ${attackerWins ? 'text-green-400' : 'text-red-400'}`}>
                {attackerTotal}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-1">Defender</div>
              <div className={`text-3xl font-bold ${!attackerWins ? 'text-green-400' : 'text-red-400'}`}>
                {defenderTotal}
              </div>
            </div>
          </div>

          <div className="text-center mb-4">
            <span className="text-lg">
              {attackerWins ? '🎯 Attacker wins!' : '🛡️ Defender holds!'}
            </span>
          </div>

          {attackerWins && isAttacker ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-300 text-center">Move to defender's position?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => finalizeCombat(true)}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
                >
                  Yes, move
                </button>
                <button
                  onClick={() => finalizeCombat(false)}
                  className="flex-1 py-3 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors"
                >
                  Stay in place
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => finalizeCombat(attackerWins)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}