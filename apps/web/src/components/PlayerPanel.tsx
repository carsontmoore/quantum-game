/**
 * Player Panel Component
 * Shows current player info, resources, and active cards
 */

import { useGameStore, selectCurrentPlayer } from '../stores/gameStore';
import { FACTIONS, ShipType, SHIP_ABILITIES } from '@quantum/types';
import clsx from 'clsx';

const SHIP_NAMES: Record<ShipType, string> = {
  [ShipType.BATTLESTATION]: 'Battlestation',
  [ShipType.FLAGSHIP]: 'Flagship',
  [ShipType.DESTROYER]: 'Destroyer',
  [ShipType.FRIGATE]: 'Frigate',
  [ShipType.INTERCEPTOR]: 'Interceptor',
  [ShipType.SCOUT]: 'Scout',
};

export function PlayerPanel() {
  const gameState = useGameStore(state => state.gameState);
  const currentPlayer = useGameStore(selectCurrentPlayer);
  const { availableActions, performAction, selectShip, selectedShipId } = useGameStore();

  if (!gameState || !currentPlayer) return null;

  const faction = FACTIONS.find(f => f.id === currentPlayer.factionId);
  const playerShips = gameState.ships.filter(s => s.ownerId === currentPlayer.id);
  const deployedShips = playerShips.filter(s => s.position !== null);

  return (
    <div className="space-y-4">
      {/* Current Player Header */}
      <div
        className="rounded-xl p-4 border-2"
        style={{
          backgroundColor: `${faction?.color}15`,
          borderColor: faction?.color,
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full border-2"
            style={{
              backgroundColor: faction?.color,
              borderColor: faction?.secondaryColor,
            }}
          />
          <div>
            <div className="font-semibold text-slate-200">{faction?.name}</div>
            <div className="text-sm text-slate-400">
              {currentPlayer.type === 'ai' ? '🤖 AI' : '👤 Human'}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-800/50 rounded-lg p-2">
            <div className="text-2xl font-bold text-cyan-400">
              {currentPlayer.actionsRemaining}
            </div>
            <div className="text-xs text-slate-400">Actions</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2">
            <div className="text-2xl font-bold text-purple-400">
              {currentPlayer.quantumCubesRemaining}
            </div>
            <div className="text-xs text-slate-400">Cubes</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2">
            <div className="text-2xl font-bold text-amber-400">
              {currentPlayer.dominanceCounter}
            </div>
            <div className="text-xs text-slate-400">Dominance</div>
          </div>
        </div>
      </div>

      {/* Research Counter */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Research</span>
          <span className="text-sm text-slate-400">
            {currentPlayer.researchCounter}/6
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div
              key={n}
              className={clsx(
                'flex-1 h-3 rounded-full transition-colors',
                n <= currentPlayer.researchCounter
                  ? 'bg-green-500'
                  : 'bg-slate-700'
              )}
            />
          ))}
        </div>
        {availableActions?.canResearch && (
          <button
            onClick={() => performAction({ type: 'research' })}
            className="w-full mt-3 action-btn secondary text-sm"
          >
            +1 Research
          </button>
        )}
      </div>

      {/* Ships */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-300 mb-3">
          Ships ({deployedShips.length} deployed)
        </h3>
        <div className="space-y-2">
          {deployedShips.map(ship => {
            const isSelected = selectedShipId === ship.id;
            const canMove = !ship.hasMovedThisTurn;
            const canUseAbility = availableActions?.canUseAbility[ship.id];

            return (
              <div
                key={ship.id}
                className={clsx(
                  'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all',
                  isSelected
                    ? 'bg-blue-600/30 ring-2 ring-blue-500'
                    : 'bg-slate-700/50 hover:bg-slate-700'
                )}
                onClick={() => selectShip(isSelected ? null : ship.id)}
              >
                <div
                  className="w-8 h-8 rounded flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: faction?.color }}
                >
                  {ship.pipValue}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200">
                    {SHIP_NAMES[ship.pipValue]}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {SHIP_ABILITIES[ship.pipValue].name}
                  </div>
                </div>
                <div className="flex gap-1">
                  {canMove && (
                    <span className="w-2 h-2 rounded-full bg-green-500" title="Can move" />
                  )}
                  {canUseAbility && (
                    <span className="w-2 h-2 rounded-full bg-purple-500" title="Can use ability" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrapyard */}
        {currentPlayer.scrapyard.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="text-sm text-slate-400 mb-2">
              Scrapyard ({currentPlayer.scrapyard.length})
            </div>
            <div className="flex gap-2 flex-wrap">
              {currentPlayer.scrapyard.map((value, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-400"
                >
                  {value}
                </div>
              ))}
            </div>
            {availableActions && availableActions.canDeploy.length > 0 && (
              <div className="text-xs text-green-400 mt-2">
                Can deploy to {availableActions.canDeploy.length} positions
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Command Cards */}
      {currentPlayer.activeCommandCards.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm font-medium text-slate-300 mb-3">
            Active Commands ({currentPlayer.activeCommandCards.length}/3)
          </h3>
          <div className="space-y-2">
            {currentPlayer.activeCommandCards.map(card => (
              <div key={card.id} className="advance-card command text-xs">
                <div className="font-medium text-blue-200">{card.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Players Summary */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-300 mb-3">All Players</h3>
        <div className="space-y-2">
          {gameState.players.map(player => {
            const pFaction = FACTIONS.find(f => f.id === player.factionId);
            const isCurrent = player.id === currentPlayer.id;

            return (
              <div
                key={player.id}
                className={clsx(
                  'flex items-center gap-2 p-2 rounded-lg',
                  isCurrent ? 'bg-slate-700/50' : 'opacity-60'
                )}
              >
                <div
                  className="w-6 h-6 rounded-full border"
                  style={{
                    backgroundColor: pFaction?.color,
                    borderColor: pFaction?.secondaryColor,
                  }}
                />
                <div className="flex-1 text-sm text-slate-300">
                  {pFaction?.name}
                </div>
                <div className="text-sm text-purple-400">
                  {player.quantumCubesRemaining}🔮
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
