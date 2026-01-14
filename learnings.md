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

## Future Topics to Add
- [ ] Zustand store patterns
- [ ] TypeScript generics
- [ ] React useEffect dependencies
- [ ] Monorepo package resolution