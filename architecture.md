# Quantum Game - Architecture

## Package Structure

```
packages/
├── types/           # Shared TypeScript types (GameState, actions, cards, etc.)
├── game-engine/     # Pure game logic, no UI dependencies
└── ai/              # AI opponent, depends on game-engine

apps/
├── web/             # React frontend with Zustand store
└── api/             # Hono REST API (planned)
```

### Dependency Flow

```
types → game-engine → ai → web
                  ↘      ↗
                    api
```

Packages only import from packages to their left. Never reverse this (e.g., ai should never import from web).

---

## State Ownership

### GameState (packages/types)

The authoritative game state. Lives in the engine. Includes:

- Board state: `tiles`, `ships`
- Player state: `players[]` with resources, cards, scrapyard
- Turn tracking: `currentPlayerId`, `turnNumber`, `currentPhase`
- Combat state: `combatPhase`, `pendingCombat`
- Card state: `cards` (decks, markets, discards)
- Action log: `actionLog[]`

### Store State (apps/web/stores/gameStore.ts)

UI orchestration layer. Wraps the engine and adds:

- `engine`: GameEngine instance
- `selectedShipId`, `highlightedPositions`: UI selection state
- `isDeployMode`, `selectedScrapyardIndex`: Deploy flow state
- `lastCombatResult`: For displaying combat outcome modal
- `showCardSelection`, `pendingCardSelections`: Card selection flow
- `pendingGambitEffect`: Active gambit requiring user action
- Modal flags: `showReorganizationModal`, `showRelocationModal`, `showSabotageModal`

**Key principle:** Game logic lives in engine. Store calls engine methods and syncs `gameState`.

---

## Combat System

### Architecture: Single Entry Point Pattern

Combat is a phased state machine managed entirely by the engine.

```
Human initiates attack
        ↓
store.initiateAttack(shipId, targetPosition)
        ↓
engine.initiateAttack() → sets up pendingCombat, calls advanceCombat()
        ↓
engine.advanceCombat() → loops through phases until human input needed
        ↓
Returns { needsInput: { phase, awaitingPlayerId, options } }
        ↓
UI shows appropriate modal (Dangerous choice, re-roll options, move choice)
        ↓
Human makes choice
        ↓
store.submitCombatInput(input)
        ↓
engine.advanceCombat(input) → processes input, continues advancing
        ↓
Returns { completed: true, combatResult } when done
        ↓
store.setCombatResult() → displays final result modal
```

### Combat Phases

1. **pre-combat**: Defender has Dangerous card, can choose mutual destruction
2. **rolls**: Dice rolled, modifiers applied (Rational, Ferocious, Strategic)
3. **re-roll**: Players with Cruel/Relentless/Scrappy can re-roll
4. **resolution**: Winner determined, attacker chooses to move or stay

### Combat State (on GameState)

```typescript
combatPhase: 'pre-combat' | 'rolls' | 're-roll' | 'resolution' | null;
pendingCombat: {
  attackerShipId, defenderShipId,
  attackerPlayerId, defenderPlayerId,
  attackerOrigin, targetPosition,
  attackerRoll, defenderRoll,
  attackerTotal, defenderTotal,
  attackerModifiers[], defenderModifiers[],
  rerollsUsed: { cruel, relentless, scrappy },
  attackerCanCruel, attackerCanRelentless, attackerCanScrappy,
  defenderCanCruel, defenderCanRelentless,
} | null;
```
## Attack Launch Position

### Problem
In physical Quantum, a player moves their ship to an adjacent square before initiating combat. The digital version allows clicking directly on an enemy ship anywhere within movement range, creating ambiguity about where the attacker "ends up" after combat.

### Solution
Calculate the movement path and extract the penultimate position as `attackerLaunchPosition`.

### Implementation

**Type addition (packages/types):**
```typescript
interface PendingCombat {
  attackerOrigin: Position;        // Where ship started its turn
  attackerLaunchPosition: Position; // Adjacent square from which attack is launched
  targetPosition: Position;         // Enemy ship location
  // ... other fields
}
```

**Path calculation (initiateAttack):**
```typescript
const path = getMovePath(attackerShip, targetPosition, this.state, allowDiagonal);

let attackerLaunchPosition: Position;
if (path && path.length >= 2) {
  attackerLaunchPosition = path[path.length - 2];
} else if (path && path.length === 1) {
  attackerLaunchPosition = attackerShip.position!;
} else {
  attackerLaunchPosition = attackerShip.position!;
}
```

**Usage in resolveFinalize:**
- Attacker wins + moves to target: `position = targetPosition`
- Attacker wins + stays: `position = attackerLaunchPosition`
- Attacker loses: `position = attackerLaunchPosition`

### Known Limitation
When multiple valid launch positions exist (high pip value ships), the path algorithm picks deterministically. Player cannot choose. Future enhancement: two-step attack flow.

---

## Action Cost Enforcement

### Pattern
Action costs must be enforced in TWO places:
1. **Validation** (`actions.ts`) - Prevents invalid actions
2. **Execution** (`engine/index.ts`) - Deducts the cost

### Construct Example
```typescript
// Validation (actions.ts)
if (player.actionsRemaining < 2) {
  return { valid: false, reason: 'Need 2 actions to construct' };
}

// Execution (engine/index.ts)
player.actionsRemaining -= 2;
```

### Card Modifier Pattern
When cards modify action costs:
```typescript
const hasCardThatReducesCost = this.hasCommandCard(player, 'cardname');
const actionCost = hasCardThatReducesCost ? 1 : 2;

// Use actionCost in both validation and execution
```

---

## UI Button Disabled State

### Pattern
Buttons must check:
1. Resource availability (scrapyard, cubes, etc.)
2. Action count
3. Card effects that modify requirements

### Example (Deploy button)
```typescript
const hasEager = currentPlayer.activeCommandCards.some(
  c => c.id.toString().split('-')[0].toLowerCase() === 'eager'
);

disabled={
  currentPlayer?.scrapyard.length === 0 || 
  (!hasEager && currentPlayer.actionsRemaining < 1)
}
```

This ensures Eager's "free deploy" effect is respected in the UI.

### AI Combat Handling

AI decisions are made inline during `advanceCombat()` loop:
- AI never activates Dangerous (MVP behavior)
- AI uses re-rolls when losing combat
- AI always moves to target position when winning

Legacy `attack()` method wraps the phased system for AI compatibility.

---

## Command Card Implementation

### Card Groups

| Group | Type | Cards | Status |
|-------|------|-------|--------|
| 1 | Start-of-turn passive | Brilliant, Curious | ✅ Complete |
| 2 | Constant modifiers | Agile, Energetic, Stealthy, Eager, Precocious, Intelligent, Ingenious, Flexible | ✅ Complete |
| 3 | Combat modifiers | Ferocious, Strategic, Rational, Stubborn, Dangerous, Cruel, Relentless, Scrappy | ✅ Complete |
| 4 | Conditional action bonuses | Arrogant, Warlike, Conformist, Tactical | ⏳ Pending |
| 5 | Dominance/research modifiers | Righteous, Ravenous, Plundering, Tyrannical, Cerebral | ⏳ Pending |
| 6 | Special abilities | Resourceful, Cunning, Clever, Nomadic | ⏳ Pending |

### Card Check Pattern

```typescript
// In engine methods
private hasCommandCard(player: Player, cardName: string): boolean {
  return player.activeCommandCards.some(
    c => c.id.toString().split('-')[0].toLowerCase() === cardName.toLowerCase()
  );
}

// Usage
if (this.hasCommandCard(player, 'ferocious')) {
  attackerRoll = Math.max(1, attackerRoll - 1);
}
```

### Card Effect Locations

- **Start-of-turn effects**: `engine.startTurn()`
- **Movement modifiers**: `findReachablePositions()` in movement.ts
- **Deploy modifiers**: `validateDeploy()` in actions.ts
- **Construct modifiers**: `validateConstruct()` in actions.ts
- **Combat modifiers**: `executeRolls()`, `executeReroll()`, `resolveFinalize()` in engine

---

## Gambit Cards

All 6 implemented:

| Card | Effect | Implementation |
|------|--------|----------------|
| Expansion | +1 ship to scrapyard, free deploy | `executeGambitEffect()` + deploy flow |
| Aggression | +2 dominance | `executeGambitEffect()` |
| Momentum | +2 actions, reset ship flags | `executeGambitEffect()` |
| Relocation | Move opponent's cube | Modal flow → `relocateCube()` |
| Reorganization | Re-roll any ships | Modal flow → `reorganizeShips()` |
| Sabotage | Each opponent discards 1 command | Modal flow → `sabotageDiscard()` |

---

## AI Architecture

### Current Implementation (Rule-Based)

Located in `packages/ai/src/index.ts`.

1. `decideAction()`: Evaluates available actions, returns highest priority
2. `executeTurn()`: Loops calling `decideAction()` until actions exhausted
3. Priority: Construct > Attack (if favorable) > Research > Move toward planets

### AI Combat Integration

AI calls `engine.attack()` which is a legacy wrapper:
1. Calls `initiateAttack()`
2. Loops `advanceCombat()` making AI decisions inline
3. Returns completed `CombatResult`

This keeps AI code simple while using the full combat system.

### Future: MCTS (Phase 3)

Planned Monte Carlo Tree Search for Hard difficulty with:
- Simulated playouts
- Opponent modeling
- Strategic memory across turns

---

## Key Type Definitions

### CombatInput (player choices during combat)

```typescript
type CombatInput =
  | { type: 'dangerous'; activate: boolean }
  | { type: 'reroll'; rerollType: 'cruel' | 'relentless' | 'scrappy'; playerId: string }
  | { type: 'skipRerolls' }
  | { type: 'finalize'; moveToTarget: boolean };
```

### CombatAdvanceResult (engine response)

```typescript
interface CombatAdvanceResult {
  success: boolean;
  error?: string;
  data?: GameState;
  combatResult?: CombatResult;
  needsInput?: CombatInputRequest;
  completed: boolean;
}
```

### CombatInputRequest (tells UI what to show)

```typescript
interface CombatInputRequest {
  phase: CombatPhase;
  awaitingPlayerId: string;
  options: {
    canActivateDangerous?: boolean;
    canSkipDangerous?: boolean;
    availableRerolls?: Array<{ type: 'cruel' | 'relentless' | 'scrappy'; playerId: string }>;
    canSkipRerolls?: boolean;
    canMoveToTarget?: boolean;
    canStayInPlace?: boolean;
  };
}
```

---

## Important Patterns

### State Mutation Order

Always deduct resources before removing entities:

```typescript
// Correct
attackerPlayer.actionsRemaining -= 1;
this.state.ships.splice(attackerIndex, 1);

// Wrong - ship reference may be stale
this.state.ships.splice(attackerIndex, 1);
attackerShip.hasMovedThisTurn = true;  // Ship already removed!
```

### Domain Types Over Primitives

Use specific types, not primitives:

```typescript
// Correct
defenderNewPipValue: ShipType | null;

// Wrong
defenderNewPipValue: number | null;
```

### Engine Method Return Pattern

```typescript
// Simple actions
Result<GameState>  // { success: true, data } | { success: false, error }

// Combat
CombatAdvanceResult  // Includes needsInput, completed, combatResult
```

---

## Attack Launch Position

### Problem
In physical Quantum, a player moves their ship to an adjacent square before initiating combat. The digital version allows clicking directly on an enemy ship anywhere within movement range, creating ambiguity about where the attacker "ends up" after combat.

### Solution
Calculate the movement path and extract the penultimate position as `attackerLaunchPosition`.

### Implementation

**Type addition (packages/types):**
```typescript
interface PendingCombat {
  attackerOrigin: Position;         // Where ship started its turn
  attackerLaunchPosition: Position; // Adjacent square from which attack is launched
  targetPosition: Position;         // Enemy ship location
  // ... other fields
}
```

**Path calculation (initiateAttack):**
```typescript
const path = getMovePath(attackerShip, targetPosition, this.state, allowDiagonal);

let attackerLaunchPosition: Position;
if (path && path.length >= 2) {
  attackerLaunchPosition = path[path.length - 2];
} else if (path && path.length === 1) {
  attackerLaunchPosition = attackerShip.position!;
} else {
  attackerLaunchPosition = attackerShip.position!;
}
```

**Usage in resolveFinalize:**
- Attacker wins + moves to target: `position = targetPosition`
- Attacker wins + stays: `position = attackerLaunchPosition`
- Attacker loses: `position = attackerLaunchPosition`

### Known Limitation
When multiple valid launch positions exist (high pip value ships), the path algorithm picks deterministically. Player cannot choose. Future enhancement: two-step attack flow.

---

## Combat Roll Display

### Problem
Combat modifiers like Ferocious change the dice roll before the total is calculated. Users need to see both the original roll and how it was modified.

### Solution
Track original roll separately from final roll:
```typescript
// In PendingCombat
attackerOriginalRoll: number;  // What was actually rolled (or 3 if Rational)
attackerRoll: number;          // After Ferocious applied

// In executeRolls()
const attackerOriginalRoll = attackerRoll;  // Store before modification
if (this.hasCommandCard(attackerPlayer, 'ferocious')) {
  attackerRoll = Math.max(1, attackerRoll - 1);
}
```

### Display Format
```typescript
const formatCalculation = (pipValue: ShipType, originalRoll: number, finalRoll: number) => {
  if (originalRoll !== finalRoll) {
    return `Ship ${pipValue} + Roll ${originalRoll} − ${originalRoll - finalRoll} (Ferocious)`;
  }
  return `Ship ${pipValue} + Roll ${finalRoll}`;
};
```

Examples:
- No modifier: `Ship 4 + Roll 3` = 7
- With Ferocious: `Ship 4 + Roll 3 − 1 (Ferocious)` = 6

---

## Re-roll Strategic Logic

Re-roll cards only help when losing:
- **Scrappy/Relentless** (re-roll own die): Only useful when losing - hope for lower roll
- **Cruel** (force opponent re-roll): Only useful when losing - hope they roll higher

When winning, any re-roll can only hurt you. Modal hides re-roll options when player is winning.
```typescript
const attackerWinning = attackerTotal <= defenderTotal;
const iAmLosing = isAttacker ? !attackerWinning : attackerWinning;

if (iAmLosing) {
  // Show re-roll options
}
```

---

## Action Cost Enforcement

### Pattern
Action costs must be enforced in TWO places:
1. **Validation** (`actions.ts`) - Prevents invalid actions
2. **Execution** (`engine/index.ts`) - Deducts the cost

### Example (Construct)
```typescript
// Validation (actions.ts)
if (player.actionsRemaining < 2) {
  return { valid: false, reason: 'Need 2 actions to construct' };
}

// Execution (engine/index.ts)
player.actionsRemaining -= 2;
```

Both must match. Bug was found where validation required 2 but execution only deducted 1.

---

## UI Button Disabled State

### Pattern
Buttons must check:
1. Resource availability (scrapyard, cubes, etc.)
2. Action count
3. Card effects that modify requirements

### Example (Deploy button)
```typescript
const hasEager = currentPlayer.activeCommandCards.some(
  c => c.id.toString().split('-')[0].toLowerCase() === 'eager'
);

disabled={
  currentPlayer?.scrapyard.length === 0 || 
  (!hasEager && currentPlayer.actionsRemaining < 1)
}
```

This ensures Eager's "free deploy" effect is respected in the UI.

---

## Combat State Cleanup

After combat initiates or any combat phase completes, clear selection state:
```typescript
set({
  gameState: result.data,
  availableActions: engine.getAvailableActions(),
  isLoading: false,
  selectedShipId: null,
  highlightedPositions: [],
});
```

This prevents stale movement highlights from persisting after combat. Since `availableActions` is recalculated, cards granting additional movement (Momentum, Energetic) still work - player just needs to reselect their ship.

---

## Testing Strategy (Planned)

### Unit Tests (Priority)

- Engine combat methods: `initiateAttack`, `advanceCombat`, `resolveFinalize`
- Card modifier application
- Stubborn edge cases (attacker destroyed on loss)
- Dangerous mutual destruction

### Integration Tests

- Full combat flow: human vs AI, AI vs human, hot-seat
- Card combinations
- Gambit card flows

## Strategic Card Implementation

### Official Rule
"-2 to your ship's weapons or defenses combat roll if adjacent to another one of your ships (or, if attacking, if one of your ships is adjacent to the defender)"

### Implementation Logic

**For attacker with Strategic:**
```typescript
const hasAdjacentAllyAtLaunch = this.state.ships.some(s =>
  s.id !== attackerShipId &&
  s.ownerId === attackerPlayer.id &&
  s.position && attackLaunch &&
  getAdjacentPositions(attackLaunch).some(
    adj => adj.x === s.position!.x && adj.y === s.position!.y
  )
);

const hasAllyAdjacentToDefender = this.state.ships.some(s =>
  s.id !== attackerShipId &&
  s.ownerId === attackerPlayer.id &&
  s.position && targetPosition &&
  getAdjacentPositions(targetPosition).some(
    adj => adj.x === s.position!.x && adj.y === s.position!.y
  )
);

if (hasAdjacentAllyAtLaunch || hasAllyAdjacentToDefender) {
  attackerTotal -= 2;
}
```

**For defender with Strategic:**
- Only checks if defender's position has adjacent friendly ship
- Does NOT get the "flanking" bonus attackers receive

**Key positions:**
- `attackerOrigin` - where ship started turn (NOT used for Strategic)
- `attackerLaunchPosition` - adjacent square where attack initiated (used for Strategic)
- `targetPosition` - defender's position (used for attacker's flanking check)

### Adjacency Definition
Orthogonal only (cardinal directions). Diagonal positions do not count.

---

## Combat Modifier Display

### formatCalculation Helper
```typescript
const formatCalculation = (
  pipValue: ShipType,
  finalRoll: number,
  modifiers: string[] = []
) => {
  const safeModifiers = Array.isArray(modifiers) ? modifiers : [];
  const hasRational = safeModifiers.some(m => m.includes('Rational'));
  const hasFerocious = safeModifiers.some(m => m.includes('Ferocious'));
  const hasStrategic = safeModifiers.some(m => m.includes('Strategic'));
  
  let rollDisplay = hasRational ? '3 (Rational)' : `${finalRoll}`;
  let base = `Ship ${pipValue} + Roll ${rollDisplay}`;
  
  if (hasFerocious) base += ` − 1 (Ferocious)`;
  if (hasStrategic) base += ` − 2 (Strategic)`;
  
  return base;
};
```

### Why Array.isArray Check
The `modifiers || []` fallback doesn't catch all cases. If modifiers is corrupted (not null but not an array), `some()` throws. `Array.isArray()` is defensive.

---

## Re-roll Phase Visibility Logic

### When to Show Re-roll Options
1. Player must be LOSING current combat
2. If player has Rational, hide own-die re-rolls (Relentless/Scrappy) - re-rolling still gives 3
3. Cruel (force opponent re-roll) always shown when losing
```typescript
const myHasRational = isAttacker 
  ? attackerModifiers?.some(m => m.includes('Rational'))
  : defenderModifiers?.some(m => m.includes('Rational'));

if (iAmLosing) {
  if (attackerCanCruel && !rerollsUsed.cruel) myRerolls.push(...);
  if (!myHasRational) {
    if (attackerCanRelentless && !rerollsUsed.relentless) myRerolls.push(...);
    if (attackerCanScrappy && !rerollsUsed.scrappy) myRerolls.push(...);
  }
}
```

---

## executeReroll Modifier Preservation

### Problem
After re-roll, `attackerModifiers` and `defenderModifiers` were undefined, causing `formatCalculation` to crash.

### Solution
Explicitly copy and preserve modifiers in state update:
```typescript
let attackerModifiers = [...(this.state.pendingCombat.attackerModifiers || [])];
let defenderModifiers = [...(this.state.pendingCombat.defenderModifiers || [])];

this.state.pendingCombat = {
  ...this.state.pendingCombat,
  attackerModifiers,
  defenderModifiers,
  // ... other fields
};
```