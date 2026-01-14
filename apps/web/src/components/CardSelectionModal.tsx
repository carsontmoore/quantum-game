import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { AdvanceCard, CardType } from '@quantum/types';
import { Card } from './Card';
import { CardDetailModal } from './CardDetailModal';
import clsx from 'clsx';

interface CardSelectionModalProps {
  isOpen: boolean;
  onSelect: (card: AdvanceCard) => void;
  onClose: () => void;
}

export function CardSelectionModal({ isOpen, onSelect, onClose }: CardSelectionModalProps) {
  const gameState = useGameStore(state => state.gameState);
  const [selectedType, setSelectedType] = useState<CardType>(CardType.COMMAND);
  const [previewCard, setPreviewCard] = useState<AdvanceCard | null>(null);
  const [selectedCard, setSelectedCard] = useState<AdvanceCard | null>(null);

  if (!isOpen || !gameState) return null;

  const commandMarket = gameState.cards.commandMarket || [];
  const gambitMarket = gameState.cards.gambitMarket || [];
  const displayedCards = selectedType === CardType.COMMAND ? commandMarket : gambitMarket;

  const handleCardClick = (card: AdvanceCard) => {
    if (selectedCard?.id === card.id) {
      // Deselect if clicking the same card
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  };

  const handleConfirm = () => {
    if (selectedCard) {
      onSelect(selectedCard);
      setSelectedCard(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              🎴 Select an Advance Card
            </h2>
            <p className="text-slate-400 text-sm">
              You placed a quantum cube! Choose a card from the market.
            </p>
          </div>

          {/* Card Type Tabs */}
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => setSelectedType(CardType.COMMAND)}
              className={clsx(
                'px-6 py-2 rounded-lg font-medium transition-colors',
                selectedType === CardType.COMMAND
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              )}
            >
              Command ({commandMarket.length})
            </button>
            <button
              onClick={() => setSelectedType(CardType.GAMBIT)}
              className={clsx(
                'px-6 py-2 rounded-lg font-medium transition-colors',
                selectedType === CardType.GAMBIT
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              )}
            >
              Gambit ({gambitMarket.length})
            </button>
          </div>

          {/* Card Market Display */}
          <div className="flex justify-center gap-4 mb-6 min-h-[220px]">
            {displayedCards.length === 0 ? (
              <div className="flex items-center justify-center text-slate-500">
                No {selectedType} cards available
              </div>
            ) : (
              displayedCards.map((card, index) => (
                <div key={card.id || index} className="relative">
                  <Card
                    card={card}
                    size="medium"
                    selected={selectedCard?.id === card.id}
                    onClick={() => handleCardClick(card)}
                  />
                  {/* Preview button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewCard(card);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-slate-900/80 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    title="View details"
                  >
                    ?
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Card Type Description */}
          <div className="text-center mb-6 px-4">
            {selectedType === CardType.COMMAND ? (
              <p className="text-slate-400 text-xs">
                <span className="text-slate-300 font-medium">Command cards</span> provide permanent abilities that remain active until replaced. You may hold up to 3 command cards.
              </p>
            ) : (
              <p className="text-slate-400 text-xs">
                <span className="text-purple-300 font-medium">Gambit cards</span> provide powerful one-time effects. Play them immediately or save for later.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedCard}
              className={clsx(
                'px-6 py-3 font-medium rounded-lg transition-colors',
                selectedCard
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              )}
            >
              Take Card
            </button>
          </div>
        </div>
      </div>

      {/* Card Preview Modal */}
      <CardDetailModal
        card={previewCard}
        onClose={() => setPreviewCard(null)}
      />
    </>
  );
}