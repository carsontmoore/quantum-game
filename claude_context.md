# Quantum Game - Session Context

## Project Overview
Quantum is a turn-based strategy board game implementation with:
- Monorepo: packages/types, packages/game-engine, packages/ai, apps/web
- React frontend with Zustand state management
- TypeScript throughout
- Local play against AI opponent

## Before Starting
1. Read CLAUDE_RULES.md at project root
2. Read ROADMAP.md to understand project goals and current progress
3. For any implementation, ask to see existing code before suggesting changes

## Last Session Completed

### Bug Fixes Implemented
1. **Deploy mode persistence** - `exitDeployMode()` now called after successful normal deploy in `performAction`
2. **ActionBar disabled after combat** - Added `isLoading: false` to `initiateAttack` and `submitCombatInput` in gameStore
3. **"Stay in place" wrong position** - Added `attackerLaunchPosition` to `PendingCombat`, calculated from movement path in `initiateAttack`
4. **Attacker position on failed attack** - `resolveFinalize` now moves attacker to launch position regardless of outcome
5. **Construct cost** - Engine's `construct` method now deducts 2 actions (was incorrectly deducting 1)
6. **Deploy button enabled with 0 actions** - ActionBar now checks `actionsRemaining` with Eager card exception
7. **Stale Industrious reference** - Removed placeholder logic from `validateConstruct`

### Files Modified
- `packages/types/src/index.ts` - Added `attackerLaunchPosition: Position` to PendingCombat interface
- `packages/game-engine/src/index.ts` - initiateAttack, resolveFinalize, construct methods
- `packages/game-engine/src/validation/actions.ts` - validateConstruct cleanup
- `apps/web/src/stores/gameStore.ts` - performAction deploy case, initiateAttack, submitCombatInput
- `apps/web/src/components/ActionBar.tsx` - Deploy button disabled logic

### Key Architectural Insight
Attack movement is implicit - player clicks enemy ship, path is calculated, and `attackerLaunchPosition` (penultimate position in path) is stored. This is the adjacent square from which attack is launched. Both "stay in place" and failed attacks use this position, never the turn origin.

## Current State
- Core deploy, combat positioning, and construct mechanics now working correctly
- Combat refactor (single entry point pattern) functional but display issues remain
- 18 of 31 Command cards implemented
- All 6 Gambit cards implemented

## Immediate Next Steps
1. **Test combat display issues** - Rolls phase may be bypassing, dice details not showing in modal
2. **Continue combat testing checklist** - Verify all card modifier interactions
3. **Implement ship abilities** - Battlestation Strike, Flagship Transport, etc. (see roadmap)
4. **Command cards Groups 4-6** - Remaining 13 cards

## Known Limitations
- Multiple valid attack launch positions: Path algorithm picks deterministically, player cannot choose
- Future enhancement: Two-step attack flow allowing player to select launch position

## Important Context
Session reinforced importance of:
- Verifying existing code before suggesting changes
- Tracing state through entire flow (store → engine → validation)
- Checking both success and failure paths for state updates
- Not assuming placeholder/fabricated content is still in codebase