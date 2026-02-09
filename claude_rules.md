# Claude Rules

## Non-Negotiable

1. NEVER use primitive types when domain types exist (ShipType, Position, PlayerId)
2. NEVER use `as any` - fix the actual type
3. NEVER suggest new helpers without first asking if an equivalent exists
4. ALWAYS verify existing type definitions before modifying or creating
5. ALWAYS list required imports explicitly
6. ALWAYS order state mutations correctly (deduct before remove)

## Before Any Code Suggestion

Ask yourself:
- Have I seen the current implementation of what I'm replacing?
- Have I verified the types I'm using match the codebase?
- Am I taking a shortcut?

If the answer to the last question is yes, stop and do it correctly.

## When Context Feels Stale

If the session is long and you're uncertain about codebase state, say:
"I need to verify [specific thing] before proceeding. Can you share [file/section]?"

Do not guess. Do not assume.