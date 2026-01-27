import { useGameStore } from '../stores/gameStore';

export function SabotageModal() {
  const { 
    gameState, 
    showSabotageModal, 
    sabotageDiscards,
  } = useGameStore();

  if (!showSabotageModal || !gameState) return null;

  const currentPlayerId = gameState.currentPlayerId;
  
  const humanOpponents = gameState.players.filter(p => 
    p.id !== currentPlayerId && 
    p.type === 'human' &&
    p.activeCommandCards.length > 0
  );

  const handleDiscard = (playerId: string, cardId: string) => {
    useGameStore.getState().executeSabotageDiscard(playerId, cardId);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-2">Sabotage!</h2>
        <p className="text-slate-400 text-sm mb-6">
          Each opponent must discard one Command card.
        </p>

        {humanOpponents.map(opponent => {
          const hasDiscarded = sabotageDiscards[opponent.id];
          
          return (
            <div key={opponent.id} className="mb-6 p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-semibold text-slate-300">
                  {opponent.factionId}
                </h3>
                {hasDiscarded && (
                  <span className="text-green-400 text-sm">✓ Discarded</span>
                )}
              </div>
              
              {hasDiscarded ? (
                <p className="text-slate-500 text-sm">Card discarded.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {opponent.activeCommandCards.map(card => (
                    <button
                      key={card.id}
                      onClick={() => handleDiscard(opponent.id, card.id)}
                      className="flex flex-col items-start p-3 bg-slate-700 hover:bg-red-700/80 rounded-lg transition-colors border border-slate-600 hover:border-red-500 text-left"
                    >
                      <span className="text-sm font-medium text-slate-200">{card.name}</span>
                      <span className="text-xs text-slate-400 mt-1">
                        {card.description}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}