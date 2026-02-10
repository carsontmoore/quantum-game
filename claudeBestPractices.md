# Claude Best Practices

A running list of interaction patterns to improve efficiency and reduce errors in collaborative development sessions.

---

## 1. Verify Existing Code Before Suggesting New Functions

Never suggest creating a new helper function, method, or utility without first confirming whether an equivalent already exists in the codebase. Ask to see the relevant utils file or request a grep search before proposing additions.

**Example:** Suggested creating `getCornerPositions` when `getDiagonalPositions` already existed with identical logic.

---

## 2. Review Rendered Components Before Implementing Click Handlers

When implementing interactive features on the game board or UI, always ask to see how elements are rendered and which elements have onClick handlers before writing click handling logic.

**Example:** Wrote `handleCellClick` logic for Relocation destination selection without knowing planet divs had no onClick handler attached.

---

## 3. Verify Property Names Against Type Definitions

Before referencing any state property in new code, confirm the actual property name in the type definition. Don't assume naming conventions.

**Example:** Used `this.state.cardState` when the actual property was `this.state.cards`.

---

## 4. Follow the User's Initial Diagnosis

When the user suggests a likely root cause, investigate that path first before exploring alternatives. The user has direct context from testing that Claude lacks.

**Example:** User suspected premature `exitDeployMode` in `handleCellClick` early on. Claude investigated other causes first, wasting multiple messages before confirming the user's original suspicion.

---

## 5. Include ALL Dependent State in set() Calls

When preserving state across multi-step flows in Zustand, list every property the flow depends on and include all of them in every `set()` call. Trace the entry condition of the next step to identify required properties.

**Example:** Missed `isFreeDeployMode: true` in the Reorganization deploy continuation, breaking the second deploy.

---

## 6. Check Post-Action Logic Before Writing Action Cases

When adding cases to `performAction` or similar switch statements, review what runs after the switch (post-switch logic) and determine if it will conflict. Use early return to bypass when necessary.

**Example:** Post-switch logic set `highlightedPositions: []` which overwrote positions calculated for Reorganization's continued deploy.

---

## 7. Don't Suggest Console Logs When Confident in a Fix

If the diagnosis is clear and the fix is specific, provide the fix directly. Adding console logs when they aren't needed wastes the user's time.

**Example:** Identified missing `isFreeDeployMode` but still asked for console logs instead of stating the fix directly.

---

## 8. Trace Full State Flow Before Diagnosing

When debugging, trace the complete flow from user action through state changes before suggesting fixes. Identify every place state is read, written, or reset.

---

## 9. Use Consistent Variable Names Across Suggestions

When referencing variables across multiple implementation steps, use the exact names that exist in the codebase. Don't introduce aliases like `newState` when the code uses `result.data`.

**Example:** Referenced `newState` in endTurn suggestion but it was never defined - needed `const newState = result.data` first.

---

## 10. Scope Suggestions to What Has Been Implemented

Don't reference methods, state properties, or components that were planned but may not have been implemented. Confirm existence before building on them.

**Example:** Referenced `executeReorganization` without confirming it had been added to the gameStore.

---

## 11. No Shortcuts Under Any Circumstances

Never accept "simpler", "faster", or "for now" as justification for incorrect types, missing verifications, or `as any` casts. These are red flags that Claude is cutting corners.

---

## 12. Long Session Degradation

Claude's reliability degrades in very long sessions. For major refactors:
- Commit working state before starting
- Break into discrete steps with verification
- Start fresh session if context feels uncertain

---

## 13. Verify Before Trust

Before implementing Claude's suggestions for refactors that touch multiple files:
- Ask Claude to list all files being modified
- Ask Claude to confirm it has verified existing types/implementations
- Ask Claude to show the checklist it followed

---

## 14. Red Flag Phrases

Stop immediately if Claude says:
- "out of laziness"
- "for simplicity"
- "as any"
- "we can fix this later"
- "should work"

These indicate Claude is guessing rather than verifying.

---

---

## 15. When User Challenges a Suggestion

When the user questions or pushes back on a suggestion:

1. **Re-read their statement carefully** - Look for specific variable names, not what you assumed they said
2. **Distinguish similar names** - `isDeployMode` vs `isFreeDeployMode` are different
3. **Ask clarifying questions** rather than defending the suggestion
4. **Acknowledge when caught making assumptions** - Don't double down

**Example:**
```
User: "isFreeDeployMode is being reset to false"
Claude assumed: Deploy mode is properly exiting
Reality: isDeployMode (different variable) was still true

Correct response: "You confirmed isFreeDeployMode is false. Did you 
also verify isDeployMode? They're separate variables."
```

---

## 16. Don't Hallucinate Placeholder Content

Never reference cards, features, or code that may have been placeholders or fabricated content. When suggesting code that references specific cards or features:

1. Ask if the card/feature still exists
2. Verify the exact property names and values
3. Don't assume naming conventions

**Example:**
```
❌ WRONG: "Check for Industrious card which reduces construct cost"
   (Industrious was a placeholder that was removed)

✅ CORRECT: "What cards currently modify construct cost? I want to 
   verify before suggesting the implementation."
```

---

## 17. Code Fix Patterns - Quick Reference

### isLoading Reset Pattern
```typescript
// In methods that branch away from main performAction flow:
if (result.success) {
  set({ gameState: result.data, isLoading: false });
} else {
  set({ isLoading: false, error: result.error });
}
```

### Mode Flag Cleanup Pattern
```typescript
// After action that should exit a mode:
result = engine.deploy(...);
if (result.success) {
  get().exitDeployMode();  // Explicit cleanup
}
```

### Button Disabled Pattern
```typescript
// Consider: resource availability + action count + card modifiers
const hasCardThatMakesFree = currentPlayer.activeCommandCards.some(
  c => c.id.toString().split('-')[0].toLowerCase() === 'cardname'
);

disabled={
  resourceEmpty || 
  (!hasCardThatMakesFree && actionsRemaining < cost)
}
```

---

## 18. Explain Unfamiliar Syntax

When using syntax that may be unfamiliar (destructuring, spread operators, etc.), briefly explain it rather than assuming understanding.

**Example:**
```typescript
const { attackerLaunchPosition } = this.state.pendingCombat;
// This destructuring is equivalent to:
// const attackerLaunchPosition = this.state.pendingCombat.attackerLaunchPosition;
```

---

## 19. Prioritize Fixes by Gameplay Impact

When multiple bugs are identified, suggest priority order:

1. **Critical** - Blocks core gameplay (can't move, can't attack, wrong game state)
2. **Major** - Incorrect behavior that affects strategy (wrong action costs, wrong positions)
3. **Minor** - UI/UX issues (button enabled when it shouldn't be, display glitches)
4. **Enhancement** - Not bugs, but improvements (player choice for ambiguous cases)

State the priority explicitly so user can make informed decisions about fix order.