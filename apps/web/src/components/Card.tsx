import { AdvanceCard, CardType, CardCategory } from '@quantum/types';
import clsx from 'clsx';

interface CardProps {
  card: AdvanceCard;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
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

const SIZE_CLASSES = {
  small: 'w-24 h-36',
  medium: 'w-36 h-52',
  large: 'w-48 h-72',
};

export function Card({ card, size = 'medium', onClick, selected, disabled }: CardProps) {
  const isCommand = card.type === CardType.COMMAND;
  
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={clsx(
        'relative rounded-lg overflow-hidden border-2 transition-all duration-200',
        SIZE_CLASSES[size],
        isCommand 
          ? 'bg-gradient-to-b from-slate-700 to-slate-900 border-slate-400' 
          : 'bg-gradient-to-b from-purple-900 to-slate-900 border-purple-500',
        onClick && !disabled && 'cursor-pointer hover:scale-105 hover:shadow-lg',
        selected && 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Card Type Banner */}
      <div
        className={clsx(
          'text-center text-xs font-bold py-1 uppercase tracking-wide',
          isCommand ? 'bg-slate-600 text-slate-200' : 'bg-purple-700 text-purple-100'
        )}
      >
        {isCommand ? 'Command' : 'Gambit'}
      </div>

      {/* Card Name */}
      <div className="px-2 py-1 text-center">
        <h3 className={clsx(
          'font-bold truncate',
          size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base'
        )}>
          {card.name}
        </h3>
      </div>

      {/* Card Image Placeholder */}
      <div 
        className={clsx(
          'mx-2 rounded bg-slate-800 flex items-center justify-center',
          size === 'small' ? 'h-12' : size === 'medium' ? 'h-20' : 'h-32'
        )}
      >
        <div className="text-2xl opacity-50">
          {isCommand ? '⚔️' : '✨'}
        </div>
      </div>

      {/* Category Tags */}
      <div className={clsx(
        'flex flex-wrap gap-1 justify-center px-1 py-1',
        size === 'small' && 'hidden'
      )}>
        {card.categories.map(category => (
          <span
            key={category}
            className={clsx(
              'px-1 rounded text-white capitalize',
              CATEGORY_COLORS[category],
              size === 'medium' ? 'text-[8px]' : 'text-xs'
            )}
          >
            {category}
          </span>
        ))}
      </div>

      {/* Description */}
      <div className={clsx(
        'px-2 text-center text-slate-300',
        size === 'small' ? 'text-[8px] line-clamp-2' : size === 'medium' ? 'text-xs line-clamp-3' : 'text-sm line-clamp-4'
      )}>
        {card.description}
      </div>

      {/* Gambit count indicator (for deck building) */}
      {!isCommand && card.count > 1 && (
        <div className="absolute bottom-1 right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {card.count}
        </div>
      )}
    </div>
  );
}