# Quantum Game - Development Learnings

A running list of nuanced issues encountered during development that are worth studying.

---

## 1. Type Imports vs Value Imports (TypeScript)

**Date:** January 2026  
**Error:** `ReferenceError: CardType is not defined`

### The Problem
TypeScript has two ways to import:
- `import type { X }` - compile-time only, stripped from output
- `import { X }` - runtime value, included in output

### The Rule
- **Interfaces** and **type aliases** → use `import type` (they don't exist at runtime)
- **Enums**, **classes**, and **constants** → use regular `import` (they exist at runtime)

### Example
```typescript
// ❌ WRONG - enum won't exist at runtime
import type { CardType, Player } from '@quantum/types';

if (card.type === CardType.COMMAND) { } // ReferenceError!

// ✅ CORRECT - separate type and value imports
import type { Player } from '@quantum/types';
import { CardType } from '@quantum/types';

if (card.type === CardType.COMMAND) { } // Works!

// ✅ ALSO CORRECT - single import for everything
import { CardType, Player } from '@quantum/types';
```

### How to Identify
- If you're using something in a **type position only** (after `:` or in `<>`), it can be a type import
- If you're using something as a **value** (comparisons, assignments, function calls), it must be a value import

---

## 2. React Keys Must Be Unique

**Date:** January 2026  
**Error:** `Encountered two children with the same key`

### The Problem
When rendering lists in React, each item needs a unique `key` prop. If multiple items share the same key, React can't track them properly.

### The Rule
- Keys must be unique among siblings
- When creating multiple instances of the same object, generate unique IDs

### Example
```typescript
// ❌ WRONG - all Momentum cards have id "momentum"
const deck = cards.flatMap(card => 
  Array(card.count).fill({ ...card })
);

// ✅ CORRECT - each instance gets unique id
const deck = cards.flatMap(card => 
  Array.from({ length: card.count }, (_, i) => ({
    ...card,
    id: `${card.id}-${i}`
  }))
);
```

---

## 3. Action Log Slicing for AI Turn Detection

**Date:** January 2026  
**Context:** Detecting AI combat actions to show combat result modal

### The Problem
AI uses the engine directly, bypassing the store's `performAction`. We needed to detect what actions the AI took.

### The Solution
Capture action log length before AI turn, then slice to find new actions:

```typescript
const actionLogLengthBefore = engine.getState().actionLog.length;
await ai.executeTurn(engine);
const newState = engine.getState();
const newActions = newState.actionLog.slice(actionLogLengthBefore);

const attackAction = newActions.find(action => action.type === ActionType.ATTACK);
if (attackAction?.combatResult) {
  // Show combat modal
}
```

---

## 4. Enum Imports for Runtime Use

**Date:** January 2026  
**Error:** `ActionType is not defined`

### The Problem
Similar to #1, but specifically for using enums in comparisons and switch statements.

### The Rule
If you're comparing against an enum value, you must have a value import:

```typescript
// ❌ WRONG
import type { ActionType } from '@quantum/types';
if (action.type === ActionType.ATTACK) { } // Error!

// ✅ CORRECT
import { ActionType } from '@quantum/types';
if (action.type === ActionType.ATTACK) { } // Works!
```

---

## 5. Two-Step UI Flows (Deploy Mode Pattern)

**Date:** January 2026  
**Context:** Implementing ship deployment from scrapyard

### The Pattern
For actions requiring two clicks (select source, then target):

1. Add mode state: `isDeployMode`, `selectedScrapyardIndex`
2. First click: Enter mode, highlight valid targets
3. Second click: Execute action, exit mode
4. Always provide escape: clicking elsewhere or pressing Escape exits mode

```typescript
// Store state
isDeployMode: boolean;
selectedScrapyardIndex: number | null;

// Methods
enterDeployMode: (index: number) => void;
exitDeployMode: () => void;

// In click handler, check mode FIRST
const handleCellClick = (position) => {
  if (isDeployMode) {
    // Handle deploy target selection
    return;
  }
  // Normal click handling
};
```

---

## 6. Combat Result Return Types

**Date:** January 2026  
**Context:** Getting combat results from engine attack method

### The Problem
The engine's `attack` method returned `Result<GameState>` but we needed the combat result details.

### The Solution
Change return type to include combat result:

```typescript
// Before
attack(): Result<GameState>

// After
attack(): { success: true; data: GameState; combatResult: CombatResult } 
        | { success: false; error: string }
```

---

## 7. State Property Naming Consistency

**Date:** January 2026  
**Error:** `Cannot read properties of undefined (reading 'commandDiscard')`

### The Problem
When adding new engine methods, assumed the property name was `cardState` but the actual `GameState` type defined it as `cards`.

### The Rule
Always verify actual property names in type definitions before referencing in new code. Don't assume naming conventions.

### Example
```typescript
// ❌ WRONG - assumed property name
this.state.cardState.commandDiscard.push(card);

// ✅ CORRECT - verified against GameState type
this.state.cards.commandDiscard.push(card);
```

---

## 8. Click Handlers on Rendered Elements

**Date:** January 2026  
**Context:** Implementing Relocation card destination selection

### The Problem
Clicking highlighted planets did nothing. The `handleCellClick` function never fired because planet divs had no `onClick` handler - only orbital slots and highlighted positions did.

### The Rule
When implementing click-based selection, verify which DOM elements actually have `onClick` handlers attached. Don't assume all visible elements are clickable.

### Example
```typescript
// ❌ WRONG - planet div has no onClick
<div className="planet">
  {tile.planetNumber}
</div>

// ✅ CORRECT - add onClick for interactive states
<div 
  className="planet"
  onClick={() => {
    if (isTileHighlighted(tile.id) && relocationPhase === 'selectDestination') {
      executeRelocation(tile.id);
    }
  }}
>
  {tile.planetNumber}
</div>
```

---

## 9. Free Deploy Mode State Preservation

**Date:** January 2026  
**Context:** Reorganization card multi-ship deploy

### The Problem
After deploying the first ship during Reorganization, the second deploy failed. The `isFreeDeployMode` flag wasn't being preserved in the `set()` call.

### The Rule
When a card effect grants multiple sequential actions, ALL relevant state properties must be explicitly preserved in each `set()` call. Zustand merges state, but if you don't include a property, it keeps the old value - which may have been reset elsewhere.

### Example
```typescript
// ❌ WRONG - missing isFreeDeployMode
set({
  gameState: result.data,
  highlightedPositions: validDeployPositions,
  selectedScrapyardIndex: 0,
  isDeployMode: true,
});

// ✅ CORRECT - all deploy-related state preserved
set({
  gameState: result.data,
  highlightedPositions: validDeployPositions,
  selectedScrapyardIndex: 0,
  isDeployMode: true,
  isFreeDeployMode: true,  // Must include this!
});
```

---

## 10. Early Return Pattern for Multi-Step Flows

**Date:** January 2026  
**Context:** Reorganization deploy continuing after first ship

### The Problem
After deploying first ship, `highlightedPositions` was reset to `[]`. The post-switch logic in `performAction` runs for all successful actions and includes `highlightedPositions: []`.

### The Rule
When an action can continue (more deploys available) vs complete (no more deploys), use early `return` to skip post-action logic that would reset state.

### Example
```typescript
case 'deploy':
  if (isFreeDeployMode && moreShipsToDepoy) {
    // Calculate next positions, update state
    set({
      gameState: result.data,
      highlightedPositions: validDeployPositions,
      // ... other state
    });
    return true;  // Skip post-switch logic!
  }
  // Fall through to normal handling
  break;

// Post-switch logic sets highlightedPositions: []
// Early return prevents this from running
```

---

## 11. Engine Owns State Mutations

**Date:** January 2026  
**Context:** Resetting turn flags after card selection

### The Problem
Mutating `result.data` from an engine call didn't persist. When `engine.getState()` was called later, it returned the engine's internal state which didn't have our mutations.

### The Rule
All game state changes should go through engine methods. The store should never directly mutate `gameState` properties. If you need to change state, add an engine method.

### Example
```typescript
// ❌ WRONG - mutating result data directly
const result = engine.selectAdvanceCard(playerId, cardId);
result.data.players[0].cubesPlacedThisTurn = 0;  // Won't persist!

// ✅ CORRECT - engine method handles mutation
// In engine:
selectAdvanceCard(playerId, cardId) {
  // ... card logic
  player.cubesPlacedThisTurn = 0;  // Engine mutates its own state
  return { success: true, data: this.getState() };
}
```

---

## 12. Turn-Start Effects Pattern

**Date:** January 2026  
**Context:** Implementing Brilliant and Curious command cards

### The Problem
Command cards with passive turn-start effects (Brilliant: +2 research, Curious: +1 free move) needed a hook to trigger when a player's turn begins.

### The Solution
Add a `startTurn` engine method called after `endTurn` advances to the next player. This centralizes passive effect application.

### Example
```typescript
// In engine
startTurn(playerId: string): Result<GameState> {
  const player = getPlayer(this.state, playerId);
  
  if (this.hasCommandCard(player, 'brilliant')) {
    player.researchCounter += 2;
  }
  
  if (this.hasCommandCard(player, 'curious')) {
    player.bonusMoves = 1;
  }
  
  return { success: true, data: this.getState() };
}

// In store endTurn
if (result.success) {
  const newState = result.data;
  engine.startTurn(newState.currentPlayerId);
  const stateAfterTurnStart = engine.getState();
  // ... use stateAfterTurnStart
}
```


## Future Topics to Add
- [ ] Zustand store patterns
- [ ] TypeScript generics
- [ ] React useEffect dependencies
- [ ] Monorepo package resolution