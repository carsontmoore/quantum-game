import { useGameStore } from '../stores/gameStore';
import type { CombatInput } from '@quantum/types';
import type { ShipType } from '@quantum/types';

export function CombatResultModal() {
  const {
    gameState,
    lastCombatResult,
    clearCombatResult,
    submitCombatInput,
  } = useGameStore();

  // Read combat state from gameState
  const combatPhase = gameState?.combatPhase ?? null;
  const pendingCombat = gameState?.pendingCombat ?? null;

  // Helper to format calculation display
  const formatCalculation = (
    pipValue: number,
    finalRoll: number,
    modifiers: string[] = []
  ) => {
    const safeModifiers = Array.isArray(modifiers) ? modifiers : [];
    const hasRational = safeModifiers.some(m => m.includes('Rational'));
    const hasStrategic = safeModifiers.some(m => m.includes('Strategic'));
    const hasFerocious = safeModifiers.some(m => m.includes('Ferocious'));

    let rollDisplay = hasRational ? '3 (Rational)' : `${finalRoll} (Roll)`;
    let base = `${pipValue} (Ship) + ${rollDisplay} (Roll)`;

    if (hasFerocious) {
      base += ' - 1 (Ferocious)';
    }

    if (hasStrategic) {
      base += ' - 2 (Strategic)'
    } 

    return base;
  }

  // Show final result
  if (lastCombatResult && !pendingCombat) {
      const winnerText = lastCombatResult.dangerousActivated 
        ? '💥 Mutual Destruction!' 
        : lastCombatResult.winner === 'attacker' 
          ? '🎯 Attacker wins!' 
          : '🛡️ Defender wins!';
      
      return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-xl font-bold text-center mb-4">⚔️ Combat Result</h2>
            
            {!lastCombatResult.dangerousActivated && (
              <div className="flex justify-center gap-8 mb-4">
                <div className="text-center">
                  <div className="text-sm text-slate-400 mb-1">Attacker</div>
                  <div className={`text-3xl font-bold ${lastCombatResult.winner === 'attacker' ? 'text-green-400' : 'text-red-400'}`}>
                    {lastCombatResult.attackerTotal}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {formatCalculation(
                      lastCombatResult.attackerPipValue,
                      lastCombatResult.attackerOriginalRoll,
                      lastCombatResult.attackerRoll,          
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-slate-400 mb-1">Defender</div>
                  <div className={`text-3xl font-bold ${lastCombatResult.winner === 'defender' ? 'text-green-400' : 'text-red-400'}`}>
                    {lastCombatResult.defenderTotal}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {formatCalculation(
                      lastCombatResult.defenderPipValue,
                      lastCombatResult.defenderOriginalRoll,
                      lastCombatResult.defenderRoll,                    
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="text-center mb-4">
              <div className="text-lg">{winnerText}</div>
              {lastCombatResult.loserNewShipValue && (
                <div className="text-slate-300 text-sm mt-2">
                  Destroyed ship returns to scrapyard as a {lastCombatResult.loserNewShipValue}
                </div>
              )}
            </div>

            <button
              onClick={clearCombatResult}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg"
            >
              Got it
            </button>
          </div>
        </div>
      );
  }

  if (!pendingCombat || !combatPhase || !gameState) return null;

  const attackerShip = gameState.ships.find(s => s.id === pendingCombat.attackerShipId);
  const defenderShip = gameState.ships.find(s => s.id === pendingCombat.defenderShipId);
  const attackerPlayer = gameState.players.find(p => p.id === pendingCombat.attackerPlayerId);
  const defenderPlayer = gameState.players.find(p => p.id === pendingCombat.defenderPlayerId);
  const currentPlayerId = gameState.currentPlayerId;
  const isAttacker = currentPlayerId === attackerPlayer?.id;

  // Pre-combat phase
  if (combatPhase === 'pre-combat') {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
          <h2 className="text-xl font-bold text-center mb-4">⚔️ Incoming Attack!</h2>
          <p className="text-slate-300 text-center mb-4">
            {attackerPlayer?.factionId}'s ship is attacking. You have Dangerous!
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => submitCombatInput({ type: 'dangerous', activate: true })}
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg"
            >
              💥 Activate Dangerous
            </button>
            <button
              onClick={() => submitCombatInput({ type: 'dangerous', activate: false })}
              className="flex-1 py-3 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg"
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
      attackerRoll, defenderRoll, attackerTotal, defenderTotal, rerollsUsed,
      attackerCanCruel, attackerCanRelentless, attackerCanScrappy,
      defenderCanCruel, defenderCanRelentless,
      attackerModifiers, defenderModifiers,
      attackerOriginalRoll, defenderOriginalRoll
    } = pendingCombat;

    const currentWinner = attackerTotal <= defenderTotal ? 'attacker' : 'defender';

    // Only show re-roll options when losing
    const attackerWinning = attackerTotal <= defenderTotal;
    const iAmLosing = isAttacker ? !attackerWinning : attackerWinning;

    const myRerolls: Array<{ type: 'cruel' | 'relentless' | 'scrappy'; label: string }> = [];

    if (iAmLosing) {
      if (isAttacker) {
        if (attackerCanCruel && !rerollsUsed.cruel) myRerolls.push({ type: 'cruel', label: 'Cruel (force opponent re-roll)' });
        if (attackerCanRelentless && !rerollsUsed.relentless) myRerolls.push({ type: 'relentless', label: 'Relentless (re-roll your die)' });
        if (attackerCanScrappy && !rerollsUsed.scrappy) myRerolls.push({ type: 'scrappy', label: 'Scrappy (re-roll your die)' });
      } else {
        if (defenderCanCruel && !rerollsUsed.cruel) myRerolls.push({ type: 'cruel', label: 'Cruel (force opponent re-roll)' });
        if (defenderCanRelentless && !rerollsUsed.relentless) myRerolls.push({ type: 'relentless', label: 'Relentless (re-roll your die)' });
      }
    }

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
          <h2 className="text-xl font-bold text-center mb-4">⚔️ Combat Rolls</h2>

          <div className="flex justify-center gap-8 mb-4">
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-1">Attacker</div>
              <div className={`text-3xl font-bold ${currentWinner === 'attacker' ? 'text-green-400' : 'text-red-400'}`}>
                {attackerTotal}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {formatCalculation(
                  attackerShip?.pipValue as ShipType,
                  attackerRoll,
                  attackerModifiers
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-1">Defender</div>
              <div className={`text-3xl font-bold ${currentWinner === 'defender' ? 'text-green-400' : 'text-red-400'}`}>
                {defenderTotal}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {formatCalculation(
                  defenderShip?.pipValue as ShipType,
                  defenderRoll,
                  defenderModifiers
                )}
              </div>
            </div>
          </div>

          {myRerolls.length > 0 && (
            <div className="space-y-2 mb-4">
              {myRerolls.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => submitCombatInput({ type: 'reroll', rerollType: type, playerId: currentPlayerId })}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg"
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => submitCombatInput({ type: 'skipRerolls' })}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg"
          >
            {myRerolls.length > 0 ? 'Skip Re-rolls' : 'Continue'}
          </button>
        </div>
      </div>
    );
  }
  // if (combatPhase === 're-roll') {
  //   const { attackerRoll, defenderRoll, attackerTotal, defenderTotal, rerollsUsed,
  //           attackerCanCruel, attackerCanRelentless, attackerCanScrappy,
  //           defenderCanCruel, defenderCanRelentless, attackerModifiers, defenderModifiers,
  //           attackerOriginalRoll, defenderOriginalRoll,
  //          } = pendingCombat;

  //   const currentWinner = attackerTotal <= defenderTotal ? 'attacker' : 'defender';

  //   const myRerolls: Array<{ type: 'cruel' | 'relentless' | 'scrappy'; label: string }> = [];

  //   // Only show re-roll options when losing - re-rolling when winning can only hurt you
  //   const attackerWinning = attackerTotal <= defenderTotal;
  //   const iAmLosing = isAttacker ? !attackerWinning : attackerWinning;
  //   const myRerolls: Array<{ type: 'cruel' | 'relentless' | 'scrappy'; label: string }> = [];

  //   if (iAmLosing) {
  //     if (isAttacker) {
  //       if (attackerCanCruel && !rerollsUsed.cruel) myRerolls.push({ type: 'cruel', label: 'Cruel (force opponent re-roll)' });
  //       if (attackerCanRelentless && !rerollsUsed.relentless) myRerolls.push({ type: 'relentless', label: 'Relentless (re-roll your die)' });
  //       if (attackerCanScrappy && !rerollsUsed.scrappy) myRerolls.push({ type: 'scrappy', label: 'Scrappy (re-roll your die)' });
  //     } else {
  //       if (defenderCanCruel && !rerollsUsed.cruel) myRerolls.push({ type: 'cruel', label: 'Cruel (force opponent re-roll)' });
  //       if (defenderCanRelentless && !rerollsUsed.relentless) myRerolls.push({ type: 'relentless', label: 'Relentless (re-roll your die)' });
  //     }
  //   }

  //   return (
  //     <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
  //       <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
  //         <h2 className="text-xl font-bold text-center mb-4">⚔️ Combat Rolls</h2>

  //         {/* <div className="flex justify-center gap-8 mb-4">
  //           <div className="text-center">
  //             <div className="text-sm text-slate-400 mb-1">Attacker</div>
  //             <div className={`text-3xl font-bold ${currentWinner === 'attacker' ? 'text-green-400' : 'text-red-400'}`}>
  //               {attackerTotal}
  //             </div>
  //           </div>
  //           <div className="text-center">
  //             <div className="text-sm text-slate-400 mb-1">Defender</div>
  //             <div className={`text-3xl font-bold ${currentWinner === 'defender' ? 'text-green-400' : 'text-red-400'}`}>
  //               {defenderTotal}
  //             </div>
  //           </div>
  //         </div> */}
  //         <div className="flex justify-center gap-8 mb-4">
  //           <div className="text-center">
  //             <div className="text-sm text-slate-400 mb-1">Attacker</div>
  //             <div className={`text-3xl font-bold ${currentWinner === 'attacker' ? 'text-green-400' : 'text-red-400'}`}>
  //               {attackerTotal}
  //             </div>
  //             <div className="text-xs text-slate-500 mt-1">
  //               {attackerShip?.pipValue} + {attackerRoll}
  //               {attackerModifiers.length > 0 && (
  //                 <span className="block text-amber-400">
  //                   {attackerModifiers.join(', ')}
  //                 </span>
  //               )}
  //             </div>
  //           </div>
  //           <div className="text-center">
  //             <div className="text-sm text-slate-400 mb-1">Defender</div>
  //             <div className={`text-3xl font-bold ${currentWinner === 'defender' ? 'text-green-400' : 'text-red-400'}`}>
  //               {defenderTotal}
  //             </div>
  //             <div className="text-xs text-slate-500 mt-1">
  //               {defenderShip?.pipValue} + {defenderRoll}
  //               {defenderModifiers.length > 0 && (
  //                 <span className="block text-amber-400">
  //                   {defenderModifiers.join(', ')}
  //                 </span>
  //               )}
  //             </div>
  //           </div>
  //         </div>

  //         {myRerolls.length > 0 && (
  //           <div className="space-y-2 mb-4">
  //             {myRerolls.map(({ type, label }) => (
  //               <button
  //                 key={type}
  //                 onClick={() => submitCombatInput({ type: 'reroll', rerollType: type, playerId: currentPlayerId })}
  //                 className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg"
  //               >
  //                 {label}
  //               </button>
  //             ))}
  //           </div>
  //         )}

  //         <button
  //           onClick={() => submitCombatInput({ type: 'skipRerolls' })}
  //           className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg"
  //         >
  //           {myRerolls.length > 0 ? 'Skip Re-rolls' : 'Continue'}
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  // Resolution phase
  if (combatPhase === 'resolution') {
    const { 
      attackerRoll, 
      defenderRoll, 
      attackerTotal, 
      defenderTotal,
      attackerOriginalRoll,
      defenderOriginalRoll,
      attackerModifiers,
      defenderModifiers,
    } = pendingCombat;
    
    const attackerWins = attackerTotal <= defenderTotal;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
          <h2 className="text-xl font-bold text-center mb-4">⚔️ Combat Resolution</h2>

          {/* Combat breakdown */}
          <div className="flex justify-center gap-8 mb-4">
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-1">Attacker</div>
              <div className={`text-3xl font-bold ${attackerWins ? 'text-green-400' : 'text-red-400'}`}>
                {attackerTotal}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {formatCalculation(
                  attackerShip?.pipValue as ShipType,
                  attackerRoll,
                  attackerModifiers
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-1">Defender</div>
              <div className={`text-3xl font-bold ${!attackerWins ? 'text-green-400' : 'text-red-400'}`}>
                {defenderTotal}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {formatCalculation(
                  defenderShip?.pipValue as ShipType,
                  defenderRoll,
                  defenderModifiers
                )}
              </div>
            </div>
          </div>

          <div className="text-center mb-4">
            <span className="text-lg">
              {attackerWins ? '🎯 Attacker wins!' : '🛡️ Defender holds!'}
            </span>
          </div>

          {attackerWins && isAttacker ? (
            <div className="flex gap-3">
              <button
                onClick={() => submitCombatInput({ type: 'finalize', moveToTarget: true })}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg"
              >
                Move to target
              </button>
              <button
                onClick={() => submitCombatInput({ type: 'finalize', moveToTarget: false })}
                className="flex-1 py-3 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg"
              >
                Stay in place
              </button>
            </div>
          ) : (
            <button
              onClick={() => submitCombatInput({ type: 'finalize', moveToTarget: attackerWins })}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    );
  }
  // if (combatPhase === 'resolution') {
  //   const { 
  //     attackerRoll,
  //     defenderRoll,
  //     attackerTotal,
  //     defenderTotal,
  //     attackerModifiers,
  //     defenderModifiers,
  //   } = pendingCombat;
  //   const attackerWins = attackerTotal <= defenderTotal;

  //   return (
  //     <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
  //       <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
  //         <h2 className="text-xl font-bold text-center mb-4">⚔️ Combat Resolution</h2>

  //         {/* Combat breakdown */}
  //         <div className="flex justify-center gap-8 mb-4">
  //           <div className="text-center">
  //             <div className="text-sm text-slate-400 mb-1">Attacker</div>
  //             <div className={`text-3xl font-bold ${attackerWins ? 'text-green-400' : 'text-red-400'}`}>
  //               {attackerTotal}
  //             </div>
  //             <div className="text-xs text-slate-500 mt-1">
  //               {attackerShip?.pipValue} + {attackerRoll}
  //               {attackerModifiers.length > 0 && (
  //                 <span className="block text-amber-400">
  //                   {attackerModifiers.join(', ')}
  //                 </span>
  //               )}
  //             </div>
  //           </div>
  //           <div className="text-center">
  //             <div className="text-sm text-slate-400 mb-1">Defender</div>
  //             <div className={`text-3xl font-bold ${!attackerWins ? 'text-green-400' : 'text-red-400'}`}>
  //               {defenderTotal}
  //             </div>
  //             <div className="text-xs text-slate-500 mt-1">
  //               {defenderShip?.pipValue} + {defenderRoll}
  //               {defenderModifiers.length > 0 && (
  //                 <span className="block text-amber-400">
  //                   {defenderModifiers.join(', ')}
  //                 </span>
  //               )}
  //             </div>
  //           </div>
  //         </div>

  //         <div className="text-center mb-4">
  //           <span className="text-lg">
  //             {attackerWins ? '🎯 Attacker wins!' : '🛡️ Defender holds!'}
  //           </span>
  //         </div>

  //         {attackerWins && isAttacker ? (
  //           <div className="flex gap-3">
  //             <button
  //               onClick={() => submitCombatInput({ type: 'finalize', moveToTarget: true })}
  //               className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg"
  //             >
  //               Move to target
  //             </button>
  //             <button
  //               onClick={() => submitCombatInput({ type: 'finalize', moveToTarget: false })}
  //               className="flex-1 py-3 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg"
  //             >
  //               Stay in place
  //             </button>
  //           </div>
  //         ) : (
  //           <button
  //             onClick={() => submitCombatInput({ type: 'finalize', moveToTarget: attackerWins })}
  //             className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg"
  //           >
  //             Continue
  //           </button>
  //         )}
  //       </div>
  //     </div>
  //   );
  // }

  return null;
}