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

### Manual Testing Checklist

See ROADMAP.md for current testing tasks.