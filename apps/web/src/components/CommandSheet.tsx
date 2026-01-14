import { useState } from 'react';
import { useGameStore, selectCurrentPlayer } from '../stores/gameStore';
import { AdvanceCard, CardType } from '@quantum/types';
import { Card } from './Card';
import { CardDetailModal } from './CardDetailModal';
import clsx from 'clsx';

interface CommandSheetProps {
  playerId?: string;
  collapsed?: boolean;
}

export function CommandSheet({ playerId, collapsed = false }: CommandSheetProps) {
  const gameState = useGameStore(state => state.gameState);
  const currentPlayer = useGameStore(selectCurrentPlayer);
  const [selectedCard, setSelectedCard] = useState<AdvanceCard | null>(null);
  const [isExpanded, setIsExpanded] = useState(!collapsed);

  if (!gameState) return null;

  // Use provided playerId or default to current player
  const player = playerId 
    ? gameState.players.find(p => p.id === playerId)
    : currentPlayer;

  if (!player) return null;

  const commandCards = player.activeCommandCards || [];
  const isCurrentPlayer = player.id === gameState.currentPlayerId;

  return (
    <>
      <div className={clsx(
        'bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden transition-all duration-300',
        isExpanded ? 'p-4' : 'p-2'
      )}>
        {/* Header */}
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
              Command Sheet
            </h3>
            {commandCards.length > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {commandCards.length}
              </span>
            )}
          </div>
          <button className="text-slate-400 hover:text-white transition-colors">
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>

        {/* Cards Display */}
        {isExpanded && (
          <div className="mt-4">
            {commandCards.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <p className="text-sm">No command cards acquired</p>
                <p className="text-xs mt-1">Place quantum cubes to gain cards</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center">
                {commandCards.map((card, index) => (
                  <Card
                    key={card.id || index}
                    card={card}
                    size="small"
                    onClick={() => setSelectedCard(card)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Player Stats Summary */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-400">
                  {player.researchCounter}
                </div>
                <div className="text-xs text-slate-500">Research</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-400">
                  {player.dominanceCounter}
                </div>
                <div className="text-xs text-slate-500">Dominance</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-400">
                  {player.quantumCubesRemaining}
                </div>
                <div className="text-xs text-slate-500">Cubes Left</div>
              </div>
            </div>
          </div>
        )}

        {/* Scrapyard Summary */}
        {isExpanded && player.scrapyard.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="text-xs text-slate-500 mb-2">Scrapyard</div>
            <div className="flex gap-2">
              {player.scrapyard.map((value, index) => (
                <div
                  key={index}
                  className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center font-bold text-slate-300"
                >
                  {value}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal 
        card={selectedCard} 
        onClose={() => setSelectedCard(null)} 
      />
    </>
  );
}