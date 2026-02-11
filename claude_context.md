# Quantum Game - Session Context

## Project Overview
Quantum is a turn-based strategy board game implementation with:
- Monorepo: packages/types, packages/game-engine, packages/ai, apps/web
- React frontend with Zustand state management
- TypeScript throughout
- Local play against AI opponent

## Before Starting
1. Read CLAUDE_RULES.md at project root
2. Read ARCHITECTURE.md for technical patterns and decisions
3. Read ROADMAP.md to understand project goals and current progress
4. For any implementation, ask to see existing code before suggesting changes

## Last Session Completed

### Combat Card Testing - All Group 3 Complete
- Ferocious: -1 to roll ✅
- Scrappy: Attacker re-roll own die ✅
- Dangerous: Mutual destruction option ✅
- Stubborn: Defender wins ties, attacker destroyed on loss ✅
- Cruel: Force opponent re-roll ✅
- Rational: Roll fixed at 3 ✅
- Strategic: -2 if adjacent ally (launch OR target position) ✅
- Relentless: Re-roll own die ✅

### Key Fixes Implemented
1. **formatCalculation helper** - displays Rational/Ferocious/Strategic modifiers explicitly
2. **Re-roll phase logic** - options only shown when losing; Rational hides own-die re-rolls
3. **Strategic dual-check** - attacker gets bonus if ally adjacent to launch OR target position
4. **executeReroll modifiers** - preserve modifier arrays to prevent crash

### Files Modified
- `packages/game-engine/src/index.ts` - executeRolls (Strategic logic), executeReroll (modifiers preservation)
- `apps/web/src/components/CombatResultModal.tsx` - formatCalculation, re-roll visibility logic

## Current State
- All Group 3 combat cards implemented and tested
- 18 of 31 Command cards complete (Groups 1-3)
- All 6 Gambit cards implemented
- Combat modal displays full roll breakdown with modifiers

## Immediate Next Steps
1. Implement Command cards Groups 4-6 (13 remaining)
2. Implement ship abilities (Battlestation Strike, Flagship Transport, etc.)
3. UI polish items (combat highlighting, modifier badges on ships)

## Cleanup Required
- Remove debug cards from `packages/game-engine/src/utils/state.ts`
- Remove console.log statements from `executeRolls` (Strategic debug logs)