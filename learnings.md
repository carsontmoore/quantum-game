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

---

## 13. Session: Combat Refactor

**Date:** Feb 2026
**Context:** Larger refactor to create single combat entry point

### What Went Wrong

- Claude suggested `number` instead of `ShipType` out of "laziness" (Claude's word)
- Claude suggested a new type that conflicted with an existing enum
- Claude used `as any` to bypass type errors
- Claude did not verify existing implementations before suggesting replacements
- Claude confused method names across files (finalizeCombat vs resolveFinalize)
- These errors compounded as session length increased

### Root Cause

Context drift in long sessions. Claude prioritized completion speed over correctness as the refactor grew in scope.

### Prevention

1. Single CLAUDE_RULES.md file at project root with non-negotiable principles
2. At session start, Claude reads this file
3. For complex refactors, break into smaller commits with verification between each
4. If Claude uses phrases like "out of laziness" or "for simplicity", stop and demand the correct implementation
5. Trust but verify - ask Claude to show its verification before implementing suggestions



---

## 14. Similar Variable Names Cause Confusion

**Date:** February 2026  
**Context:** Debugging deploy mode persistence

### The Problem
User confirmed `isFreeDeployMode` was being reset to `false`, but the bug persisted. The actual issue was `isDeployMode` (a different variable) not being reset.

### The Rule
When debugging state issues:
1. List ALL related state variables explicitly
2. Verify each one individually
3. Don't assume similar names mean the same thing

### Example
```typescript
// These are TWO DIFFERENT variables:
isDeployMode: boolean;      // Whether deploy UI is active
isFreeDeployMode: boolean;  // Whether deploy is free (from Gambit cards)

// User said "isFreeDeployMode is false" 
// Claude assumed this meant deploy mode was exited
// Actually isDeployMode was still true
```

---

## 15. Initialization Values Matter

**Date:** February 2026  
**Context:** Deploy button always triggering deploy action

### The Problem
Condition `selectedScrapyardIndex !== null` was always true because the variable was initialized to `0`, not `null`.

### The Rule
Check initialization values when debugging conditional logic. A falsy check (`!== null`, `!== undefined`) behaves differently for `0` vs `null`.

### Example
```typescript
// Store initial state
selectedScrapyardIndex: 0,  // Initialized to 0, not null!

// In click handler
if (isDeployMode && selectedScrapyardIndex !== null) {
  // This ALWAYS runs because 0 !== null is true
}
```

---

## 16. isLoading as an Action Gate

**Date:** February 2026  
**Context:** ActionBar disabled after combat

### The Problem
`performAction` sets `isLoading: true` at the start. The attack case calls `initiateAttack` and returns early - never reaching the code that sets `isLoading: false`.

### The Rule
When a method sets a blocking flag (`isLoading`, `isProcessing`, etc.), trace ALL exit paths to ensure the flag is reset. Early returns and delegated methods are common culprits.

### Example
```typescript
performAction: async (action) => {
  set({ isLoading: true });  // Set at start
  
  switch (action.type) {
    case 'attack':
      get().initiateAttack(...);
      return true;  // Early return - isLoading never reset!
    // ...
  }
  
  set({ isLoading: false });  // Only reached for non-attack actions
}

// Fix: Reset isLoading inside initiateAttack
initiateAttack: (shipId, targetPosition) => {
  // ... logic
  set({ gameState: result.data, isLoading: false });
}
```

---

## 17. Attack Launch Position (Implicit Movement)

**Date:** February 2026  
**Context:** "Stay in place" returned ship to turn origin instead of attack position

### The Problem
In physical Quantum, you move to an adjacent square then attack. Digital version allows clicking directly on enemy, but the ship still needs to end up at an adjacent position after combat.

### The Solution
Calculate the movement path, extract the penultimate position as "launch position":
```typescript
const path = getMovePath(attackerShip, targetPosition, state, allowDiagonal);

// Path: [pos1, pos2, targetPos] → launch position is pos2
// Path: [targetPos] → already adjacent, launch position is current position
let attackerLaunchPosition: Position;
if (path && path.length >= 2) {
  attackerLaunchPosition = path[path.length - 2];
} else {
  attackerLaunchPosition = attackerShip.position!;
}
```

### Key Insight
- `attackerOrigin` = where ship started its turn
- `attackerLaunchPosition` = adjacent square from which attack is launched
- "Stay in place" and failed attacks use `attackerLaunchPosition`, never `attackerOrigin`

---

## 18. Validation and Execution Must Match

**Date:** February 2026  
**Context:** Construct deducted 1 action instead of 2

### The Problem
`validateConstruct` correctly required 2 actions, but the engine's `construct` method only deducted 1.

### The Rule
When an action has a cost, verify BOTH:
1. Validation checks the player has enough
2. Execution deducts the correct amount

### Example
```typescript
// Validation (actions.ts)
if (player.actionsRemaining < 2) {
  return { valid: false, reason: 'Need 2 actions to construct' };
}

// Execution (engine/index.ts) - MUST MATCH
player.actionsRemaining -= 2;  // Not -= 1!
```

---

## 19. Card Effects Are Scattered By Phase

**Date:** February 2026  
**Context:** Understanding where to implement new card effects

### The Pattern
Card effects trigger at different phases, so implementation is scattered:

| Phase | Location | Example Cards |
|-------|----------|---------------|
| Turn start | `engine.startTurn()` | Brilliant, Curious |
| Movement | `findReachablePositions()` | Agile, Energetic |
| Deploy validation | `validateDeploy()` | Stealthy |
| Deploy execution | `deploy()` | Eager |
| Construct | `validateConstruct()`, `construct()` | Intelligent, Ingenious |
| Combat rolls | `executeRolls()` | Ferocious, Rational, Strategic |
| Combat re-roll | `executeReroll()` | Cruel, Relentless, Scrappy |
| Combat resolution | `resolveFinalize()` | Stubborn, Dangerous |

### The Rule
When implementing a new card:
1. Identify which phase it affects
2. Find the corresponding method
3. Check if validation, execution, or both need modification

---

## 20. Destructuring Assignment Syntax

**Date:** February 2026  
**Context:** Understanding bracket syntax in variable declarations

### The Syntax
```typescript
const { attackerLaunchPosition } = this.state.pendingCombat;

// Is equivalent to:
const attackerLaunchPosition = this.state.pendingCombat.attackerLaunchPosition;
```

### Multiple Properties
```typescript
const { 
  attackerShipId, 
  defenderShipId, 
  targetPosition 
} = this.state.pendingCombat;

// Extracts three variables at once
```

### Why Use It
- Shorter syntax for extracting multiple properties
- Common pattern in React/TypeScript codebases
- Makes code more readable when accessing many properties from one object

---

## 22. Incomplete Object Literals Cause Cascading Failures

**Date:** February 2026
**Context:** Debug card helper crashed entire game

### The Problem
Suggested creating card objects without verifying the AdvanceCard type. Objects were missing `categories`, `description`, `count` fields. Card.tsx crashed on `card.categories.map()`.

### The Failure Chain
1. Debug method pushed incomplete card to state
2. CommandSheet rendered cards
3. Card.tsx called `.map()` on undefined `categories`
4. Every new game crashed immediately

### The Rule
NEVER create object literals without first seeing:
1. The type definition
2. An example of a valid existing object

### Prevention
Before suggesting: `someArray.push({ field1, field2 })`
Ask: "Can you share the type definition for objects in this array?"

---

## 23. Incomplete Test Object Literals

**Date:** February 2026
**Context:** Debug card helper crashed entire game

### The Problem
Created test card objects without verifying the AdvanceCard type:
```typescript
// Missing: categories, description, count
{ id: 'test', name: 'Test', type: CardType.COMMAND, effect: 'Test' }
```

Card.tsx crashed on `card.categories.map()`.

### The Rule
NEVER create object literals without first seeing:
1. The type definition
2. An example of a valid existing object

---

## 24. State Preservation in Multi-Step Operations

**Date:** February 2026
**Context:** executeReroll losing modifier arrays

### The Problem
`executeReroll` updated `pendingCombat` state but didn't explicitly include `attackerModifiers` and `defenderModifiers`. The spread operator preserved them in some cases but not reliably.

### The Rule
When updating nested state objects, explicitly include ALL fields that downstream code depends on:
```typescript
// WRONG - relies on spread to preserve
this.state.pendingCombat = {
  ...this.state.pendingCombat,
  attackerRoll,
  defenderRoll,
};

// RIGHT - explicitly preserve critical fields
let attackerModifiers = [...(this.state.pendingCombat.attackerModifiers || [])];
this.state.pendingCombat = {
  ...this.state.pendingCombat,
  attackerRoll,
  defenderRoll,
  attackerModifiers,
};
```

---

## 25. Defensive Array Checks

**Date:** February 2026
**Context:** `modifiers.some is not a function` crash

### The Problem
```typescript
const safeModifiers = modifiers || [];
safeModifiers.some(...); // Crash if modifiers is truthy but not an array
```

### The Rule
Use `Array.isArray()` for defensive array handling:
```typescript
const safeModifiers = Array.isArray(modifiers) ? modifiers : [];
```

---

## 26. Simplest Solution for Debug/Test Code

**Date:** February 2026
**Context:** Failed runtime debug approach vs hardcoded initial state

### The Problem
Tried "clever" runtime manipulation to add test cards. Failed multiple times with cascading errors.

### The Rule
For temporary test code:
- Hardcode at initialization > runtime manipulation
- Fewer moving parts = fewer failure points
- "Cleverness" in throwaway code wastes time



------------

## Future Topics to Add
- [ ] Zustand store patterns
- [ ] TypeScript generics
- [ ] React useEffect dependencies
- [ ] Monorepo package resolution