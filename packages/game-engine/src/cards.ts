import {
  AdvanceCard,
  CardType,
  CardCategory,
  CommandCardId,
  GambitCardId,
} from '@quantum/types';

// =============================================================================
// COMMAND CARDS (31 total, 1 copy each)
// =============================================================================

export const COMMAND_CARDS: AdvanceCard[] = [
  // Tier 1 - Always strong
  {
    id: CommandCardId.DANGEROUS,
    name: 'Dangerous',
    type: CardType.COMMAND,
    categories: [CardCategory.COMBAT, CardCategory.DOMINANCE],
    description: 'Mutual destruction option',
    effect: 'If attacked, you may choose to destroy both your ship and the attacker with no change to dominance for either player.',
    imagePath: '/images/cards/dangerous.png',
    count: 1,
  },
  {
    id: CommandCardId.BRILLIANT,
    name: 'Brilliant',
    type: CardType.COMMAND,
    categories: [CardCategory.RESEARCH],
    description: 'Automatic research',
    effect: 'Gain +2 research at the start of each of your turns automatically.',
    imagePath: '/images/cards/brilliant.png',
    count: 1,
  },
  {
    id: CommandCardId.FLEXIBLE,
    name: 'Flexible',
    type: CardType.COMMAND,
    categories: [CardCategory.CONFIGURATION],
    description: 'Adjust ship value',
    effect: 'Once per turn, you may adjust one of your ships by ±1 (free action).',
    imagePath: '/images/cards/flexible.png',
    count: 1,
  },
  {
    id: CommandCardId.EAGER,
    name: 'Eager',
    type: CardType.COMMAND,
    categories: [CardCategory.ACTION],
    description: 'Free deployment',
    effect: 'Deploying ships from your scrapyard does not cost an action.',
    imagePath: '/images/cards/eager.png',
    count: 1,
  },
  {
    id: CommandCardId.RESOURCEFUL,
    name: 'Resourceful',
    type: CardType.COMMAND,
    categories: [CardCategory.ACTION],
    description: 'Sacrifice for actions',
    effect: 'You may sacrifice one of your ships (return to scrapyard) to gain 1 action.',
    imagePath: '/images/cards/resourceful.png',
    count: 1,
  },
  {
    id: CommandCardId.STEALTHY,
    name: 'Stealthy',
    type: CardType.COMMAND,
    categories: [CardCategory.MOVEMENT],
    description: 'Deploy anywhere',
    effect: 'You may deploy ships to any empty orbital position on the map, except adjacent to another ship.',
    imagePath: '/images/cards/stealthy.png',
    count: 1,
  },
  {
    id: CommandCardId.CLEVER,
    name: 'Clever',
    type: CardType.COMMAND,
    categories: [CardCategory.CONFIGURATION],
    description: 'Control die rolls',
    effect: 'When any of your ships would be rolled (reconfigure or destroyed), you choose the result instead of rolling.',
    imagePath: '/images/cards/clever.png',
    count: 1,
  },
  {
    id: CommandCardId.STUBBORN,
    name: 'Stubborn',
    type: CardType.COMMAND,
    categories: [CardCategory.COMBAT],
    description: 'Defensive advantage',
    effect: 'When defending, you win ties. If the attacker loses, their ship is destroyed.',
    imagePath: '/images/cards/stubborn.png',
    count: 1,
  },

  // Tier 2 - Situationally strong
  {
    id: CommandCardId.CURIOUS,
    name: 'Curious',
    type: CardType.COMMAND,
    categories: [CardCategory.ACTION],
    description: 'Bonus peaceful move',
    effect: 'Once per turn, you may move one ship up to 2 spaces. This move cannot be used to attack.',
    imagePath: '/images/cards/curious.png',
    count: 1,
  },
  {
    id: CommandCardId.RIGHTEOUS,
    name: 'Righteous',
    type: CardType.COMMAND,
    categories: [CardCategory.DOMINANCE],
    description: 'Irreducible dominance',
    effect: 'Your dominance counter cannot be reduced.',
    imagePath: '/images/cards/righteous.png',
    count: 1,
  },
  {
    id: CommandCardId.INTELLIGENT,
    name: 'Intelligent',
    type: CardType.COMMAND,
    categories: [CardCategory.CONSTRUCT],
    description: 'Flexible construction',
    effect: 'When constructing, you may treat planets as ±1 their actual number.',
    imagePath: '/images/cards/intelligent.png',
    count: 1,
  },
  {
    id: CommandCardId.FEROCIOUS,
    name: 'Ferocious',
    type: CardType.COMMAND,
    categories: [CardCategory.COMBAT],
    description: 'Combat bonus',
    effect: 'Subtract 1 from all your combat totals (lower is better).',
    imagePath: '/images/cards/ferocious.png',
    count: 1,
  },
  {
    id: CommandCardId.CUNNING,
    name: 'Cunning',
    type: CardType.COMMAND,
    categories: [CardCategory.ABILITY, CardCategory.COMBAT],
    description: 'Extra ship ability',
    effect: 'You may use one additional ship ability per turn.',
    imagePath: '/images/cards/cunning.png',
    count: 1,
  },
  {
    id: CommandCardId.CRUEL,
    name: 'Cruel',
    type: CardType.COMMAND,
    categories: [CardCategory.COMBAT],
    description: 'Force opponent reroll',
    effect: 'In combat, you may force your opponent to re-roll their die.',
    imagePath: '/images/cards/cruel.png',
    count: 1,
  },
  {
    id: CommandCardId.RELENTLESS,
    name: 'Relentless',
    type: CardType.COMMAND,
    categories: [CardCategory.COMBAT],
    description: 'Reroll your die',
    effect: 'In combat, you may re-roll your own die.',
    imagePath: '/images/cards/relentless.png',
    count: 1,
  },
  {
    id: CommandCardId.TACTICAL,
    name: 'Tactical',
    type: CardType.COMMAND,
    categories: [CardCategory.MOVEMENT, CardCategory.ACTION],
    description: 'Bonus short move',
    effect: 'Once per turn, you may move one ship up to 2 spaces (free action). This can be used to attack.',
    imagePath: '/images/cards/tactical.png',
    count: 1,
  },
  {
    id: CommandCardId.AGILE,
    name: 'Agile',
    type: CardType.COMMAND,
    categories: [CardCategory.MOVEMENT],
    description: 'Movement bonus',
    effect: 'All your ships gain +1 to their movement range.',
    imagePath: '/images/cards/agile.png',
    count: 1,
  },
  {
    id: CommandCardId.PRECOCIOUS,
    name: 'Precocious',
    type: CardType.COMMAND,
    categories: [CardCategory.RESEARCH],
    description: 'Accelerated research',
    effect: 'You gain an Advance card when your research reaches 4 instead of 6.',
    imagePath: '/images/cards/precocious.png',
    count: 1,
  },
  {
    id: CommandCardId.STRATEGIC,
    name: 'Strategic',
    type: CardType.COMMAND,
    categories: [CardCategory.COMBAT],
    description: 'Combat support',
    effect: 'In combat, subtract 1 from your total for each of your ships adjacent to the combat.',
    imagePath: '/images/cards/strategic.png',
    count: 1,
  },
  {
    id: CommandCardId.ENERGETIC,
    name: 'Energetic',
    type: CardType.COMMAND,
    categories: [CardCategory.MOVEMENT],
    description: 'Move multiple times',
    effect: 'Your ships may move more than once per turn (each move still costs an action).',
    imagePath: '/images/cards/energetic.png',
    count: 1,
  },

  // Tier 3 - Situational
  {
    id: CommandCardId.ARROGANT,
    name: 'Arrogant',
    type: CardType.COMMAND,
    categories: [CardCategory.ACTION],
    description: 'Extra action for fleet size',
    effect: 'If you have the most ships on the board, gain +1 action per turn.',
    imagePath: '/images/cards/arrogant.png',
    count: 1,
  },
  {
    id: CommandCardId.WARLIKE,
    name: 'Warlike',
    type: CardType.COMMAND,
    categories: [CardCategory.ACTION],
    description: 'Extra action for destruction',
    effect: 'When you destroy an enemy ship, gain +1 action.',
    imagePath: '/images/cards/warlike.png',
    count: 1,
  },
  {
    id: CommandCardId.CONFORMIST,
    name: 'Conformist',
    type: CardType.COMMAND,
    categories: [CardCategory.ACTION],
    description: 'Extra action for matching',
    effect: 'If you have two or more ships with the same value, gain +1 action per turn.',
    imagePath: '/images/cards/conformist.png',
    count: 1,
  },
  {
    id: CommandCardId.RAVENOUS,
    name: 'Ravenous',
    type: CardType.COMMAND,
    categories: [CardCategory.DOMINANCE],
    description: 'Dominance amplification',
    effect: 'Gain +2 dominance when you destroy a ship, but lose -2 dominance when your ship is destroyed.',
    imagePath: '/images/cards/ravenous.png',
    count: 1,
  },
  {
    id: CommandCardId.SCRAPPY,
    name: 'Scrappy',
    type: CardType.COMMAND,
    categories: [CardCategory.COMBAT],
    description: 'Reroll your dice',
    effect: 'On your turn, you may re-roll any of your die rolls (combat, reconfigure, etc.).',
    imagePath: '/images/cards/scrappy.png',
    count: 1,
  },
  {
    id: CommandCardId.INGENIOUS,
    name: 'Ingenious',
    type: CardType.COMMAND,
    categories: [CardCategory.CONSTRUCT],
    description: 'Construct from corners',
    effect: 'You may construct from diagonal (corner) positions adjacent to planets.',
    imagePath: '/images/cards/ingenious.png',
    count: 1,
  },
  {
    id: CommandCardId.RATIONAL,
    name: 'Rational',
    type: CardType.COMMAND,
    categories: [CardCategory.COMBAT],
    description: 'Fixed combat rolls',
    effect: 'All combat die rolls (yours and opponents against you) are treated as 3.',
    imagePath: '/images/cards/rational.png',
    count: 1,
  },
  {
    id: CommandCardId.PLUNDERING,
    name: 'Plundering',
    type: CardType.COMMAND,
    categories: [CardCategory.RESEARCH],
    description: 'Research from combat',
    effect: 'Gain +1 research each time you destroy an enemy ship.',
    imagePath: '/images/cards/plundering.png',
    count: 1,
  },
  {
    id: CommandCardId.TYRANNICAL,
    name: 'Tyrannical',
    type: CardType.COMMAND,
    categories: [CardCategory.DOMINANCE],
    description: 'Trade research for dominance',
    effect: 'Once per turn, you may spend 1 research to gain 1 dominance.',
    imagePath: '/images/cards/tyrannical.png',
    count: 1,
  },

  // Tier 4 - Weak
  {
    id: CommandCardId.NOMADIC,
    name: 'Nomadic',
    type: CardType.COMMAND,
    categories: [CardCategory.MOVEMENT],
    description: 'Transport between planets',
    effect: 'As an action, you may move a ship from one orbital position to an orbital position on an adjacent planet.',
    imagePath: '/images/cards/nomadic.png',
    count: 1,
  },
  {
    id: CommandCardId.CEREBRAL,
    name: 'Cerebral',
    type: CardType.COMMAND,
    categories: [CardCategory.RESEARCH],
    description: 'Trade dominance for research',
    effect: 'Once per turn, you may spend 1 dominance to gain 3 research.',
    imagePath: '/images/cards/cerebral.png',
    count: 1,
  },
];

// =============================================================================
// GAMBIT CARDS (22 total, varying copies)
// =============================================================================

export const GAMBIT_CARDS: AdvanceCard[] = [
  {
    id: GambitCardId.EXPANSION,
    name: 'Expansion',
    type: CardType.GAMBIT,
    categories: [CardCategory.ACTION],
    description: 'Add a ship to your fleet',
    effect: 'Immediately add 1 ship to your fleet. Roll for its value and place it in your scrapyard.',
    imagePath: '/images/cards/expansion.png',
    count: 8,
  },
  {
    id: GambitCardId.AGGRESSION,
    name: 'Aggression',
    type: CardType.GAMBIT,
    categories: [CardCategory.DOMINANCE],
    description: 'Instant dominance',
    effect: 'Immediately increase your dominance by 2.',
    imagePath: '/images/cards/aggression.png',
    count: 4,
  },
  {
    id: GambitCardId.MOMENTUM,
    name: 'Momentum',
    type: CardType.GAMBIT,
    categories: [CardCategory.ACTION],
    description: 'Bonus turn',
    effect: 'Immediately take a bonus turn with 2 actions. This does not count as ending your current turn.',
    imagePath: '/images/cards/momentum.png',
    count: 4,
  },
  {
    id: GambitCardId.RELOCATION,
    name: 'Relocation',
    type: CardType.GAMBIT,
    categories: [CardCategory.ACTION],
    description: 'Move opponent cube',
    effect: "Immediately move one opponent's quantum cube to a different planet (must be a legal placement).",
    imagePath: '/images/cards/relocation.png',
    count: 2,
  },
  {
    id: GambitCardId.REORGANIZATION,
    name: 'Reorganization',
    type: CardType.GAMBIT,
    categories: [CardCategory.CONFIGURATION],
    description: 'Reroll and deploy',
    effect: 'Immediately re-roll any or all of your ships. Then you may deploy any ships from your scrapyard for free.',
    imagePath: '/images/cards/reorganization.png',
    count: 2,
  },
  {
    id: GambitCardId.SABOTAGE,
    name: 'Sabotage',
    type: CardType.GAMBIT,
    categories: [CardCategory.ACTION],
    description: 'Force discard',
    effect: 'All opponents must immediately discard one Advance card of their choice.',
    imagePath: '/images/cards/sabotage.png',
    count: 2,
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export const ALL_CARDS: AdvanceCard[] = [...COMMAND_CARDS, ...GAMBIT_CARDS];

export function getCardById(id: CommandCardId | GambitCardId): AdvanceCard | undefined {
  return ALL_CARDS.find(card => card.id === id);
}

export function getCardsByType(type: CardType): AdvanceCard[] {
  return ALL_CARDS.filter(card => card.type === type);
}

export function getCardsByCategory(category: CardCategory): AdvanceCard[] {
  return ALL_CARDS.filter(card => card.categories.includes(category));
}

/**
 * Create a shuffled deck of cards for game setup
 */
export function createCardDeck(type: CardType): AdvanceCard[] {
  const cards = getCardsByType(type);
  const deck: AdvanceCard[] = [];
  
  for (const card of cards) {
    for (let i = 0; i < card.count; i++) {
      deck.push({ 
        ...card,
        id: `${card.id}-${i}` as any, // Create unique ID for each instance
      });
    }
  }
  
  // Shuffle using Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}