# Claude Rules

## Non-Negotiable

1. NEVER use primitive types when domain types exist (ShipType, Position, PlayerId)
2. NEVER use `as any` - fix the actual type
3. NEVER suggest new helpers without first asking if an equivalent exists
4. ALWAYS verify existing type definitions before modifying or creating
5. ALWAYS list required imports explicitly
6. ALWAYS order state mutations correctly (deduct before remove)
7. NEVER assume placeholder/fabricated content still exists - verify current code first

## Before Any Code Suggestion

- Have I seen the current implementation of what I'm replacing?
- Have I verified the types I'm using match the codebase?
- Am I taking a shortcut?
- Am I referencing code that may have been removed or changed?

If the answer to the last two questions is yes, stop and do it correctly.

## When Context Feels Stale or Claude is Uncertain

If the session is long and you're uncertain about codebase state, say:
"I need to verify [specific thing] before proceeding. Can you share [file/section]?"

Do not guess. Do not assume.

## State Update Patterns

When modifying store methods that set `isLoading: true`:
- Verify ALL exit paths reset `isLoading: false`
- Check both success and failure branches
- Check early returns

When modifying mode flags (isDeployMode, isFreeDeployMode, etc.):
- Trace the full flow to ensure proper cleanup
- Verify exit functions are called in all completion paths

## Red Flag Phrases

Stop immediately and reconsider if about to say:
- "out of laziness"
- "for simplicity"
- "as any"
- "we can fix this later"
- "should work"
- References to cards/features that may be placeholders (Industrious, Quantum Mastery, etc.)

These indicate guessing rather than verifying.

