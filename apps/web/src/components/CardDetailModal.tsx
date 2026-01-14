import { AdvanceCard, CardType, CardCategory } from '@quantum/types';
import clsx from 'clsx';

interface CardDetailModalProps {
  card: AdvanceCard | null;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<CardCategory, string> = {
  [CardCategory.COMBAT]: 'bg-red-600',
  [CardCategory.DOMINANCE]: 'bg-yellow-600',
  [CardCategory.RESEARCH]: 'bg-blue-600',
  [CardCategory.MOVEMENT]: 'bg-green-600',
  [CardCategory.ACTION]: 'bg-purple-600',
  [CardCategory.CONFIGURATION]: 'bg-orange-600',
  [CardCategory.CONSTRUCT]: 'bg-teal-600',
  [CardCategory.ABILITY]: 'bg-pink-600',
};

const CATEGORY_LABELS: Record<CardCategory, string> = {
  [CardCategory.COMBAT]: 'Combat',
  [CardCategory.DOMINANCE]: 'Dominance',
  [CardCategory.RESEARCH]: 'Research',
  [CardCategory.MOVEMENT]: 'Movement',
  [CardCategory.ACTION]: 'Action',
  [CardCategory.CONFIGURATION]: 'Configuration',
  [CardCategory.CONSTRUCT]: 'Construct',
  [CardCategory.ABILITY]: 'Ability',
};

export function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  if (!card) return null;

  const isCommand = card.type === CardType.COMMAND;

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className={clsx(
          'relative w-80 rounded-xl overflow-hidden border-4 shadow-2xl',
          isCommand 
            ? 'bg-gradient-to-b from-slate-700 to-slate-900 border-slate-400' 
            : 'bg-gradient-to-b from-purple-900 to-slate-900 border-purple-500'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card Type Banner */}
        <div
          className={clsx(
            'text-center text-sm font-bold py-2 uppercase tracking-widest',
            isCommand ? 'bg-slate-600 text-slate-200' : 'bg-purple-700 text-purple-100'
          )}
        >
          {isCommand ? 'Command Card' : 'Gambit Card'}
        </div>

        {/* Card Name */}
        <div className="px-4 py-3 text-center border-b border-slate-600">
          <h2 className="text-2xl font-bold text-white">
            {card.name}
          </h2>
        </div>

        {/* Card Image Placeholder */}
        <div className="mx-4 my-3 h-40 rounded-lg bg-slate-800 flex items-center justify-center">
          <div className="text-6xl opacity-50">
            {isCommand ? '⚔️' : '✨'}
          </div>
        </div>

        {/* Category Tags */}
        <div className="flex flex-wrap gap-2 justify-center px-4 py-2">
          {card.categories.map(category => (
            <span
              key={category}
              className={clsx(
                'px-2 py-1 rounded text-white text-xs font-medium uppercase tracking-wide',
                CATEGORY_COLORS[category]
              )}
            >
              {CATEGORY_LABELS[category]}
            </span>
          ))}
        </div>

        {/* Description */}
        <div className="px-4 py-2 text-center">
          <p className="text-slate-300 text-sm italic">
            {card.description}
          </p>
        </div>

        {/* Effect Text */}
        <div className="px-4 py-3 mx-3 mb-3 bg-slate-800/50 rounded-lg border border-slate-600">
          <p className="text-white text-sm leading-relaxed">
            {card.effect}
          </p>
        </div>

        {/* Card Type Info */}
        <div className="px-4 py-3 border-t border-slate-600 text-center">
          <p className="text-slate-400 text-xs">
            {isCommand 
              ? 'Permanent ability - remains active until replaced'
              : 'One-time effect - discard after use'
            }
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}