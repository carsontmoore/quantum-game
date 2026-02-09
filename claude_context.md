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
Major combat system refactor to single entry point pattern:
- Combat logic moved entirely into game engine
- Engine methods: initiateAttack, advanceCombat, cancelCombat (+ private phase handlers)
- Store simplified to thin wrappers: initiateAttack, submitCombatInput, setCombatResult, cancelCombat
- Combat state (combatPhase, pendingCombat) now lives on GameState, not store
- CombatResultModal reads from gameState, uses submitCombatInput for all player choices
- AI combat handled automatically within engine's advanceCombat loop
- Legacy attack() method preserved for AI compatibility

Command cards implemented:
- Group 1 (start-of-turn): Brilliant, Curious
- Group 2 (constant modifiers): Agile, Energetic, Stealthy, Eager, Precocious, Intelligent, Ingenious, Flexible
- Group 3 (combat modifiers): Ferocious, Strategic, Rational, Stubborn, Dangerous, Cruel, Relentless, Scrappy

Key architectural decisions:
- Single advanceCombat(input?) entry point handles all combat progression
- Engine advances automatically until human input needed, returns needsInput describing what's required
- AI decisions made inline during advanceCombat loop
- Stubborn edge case: action deducted before ship removal, hasMovedThisTurn only set if ship not destroyed

## Current State
- Combat refactor complete but untested
- Legacy combat code preserved as comments for potential rollback
- 18 of 31 Command cards implemented
- All 6 Gambit cards implemented

## Immediate Next Steps
1. Test combat refactor (human vs AI, AI vs human, hot-seat, all combat card combinations)
2. Consider unit tests for engine combat methods given refactor complexity
3. Continue with Group 4, 5, 6 Command cards after testing confirms stability

## Important Context
This session encountered significant issues with context drift and errors in suggested code. Key lessons:
- Always verify existing type definitions before modifying
- Use domain types (ShipType, Position) not primitives
- Never use `as any` - fix the actual type
- Order state mutations correctly (deduct before remove)
- Verify entity exists before mutating it

The CLAUDE_RULES.md file contains non-negotiable principles learned from this session.

## Files Modified This Session
- packages/types/src/index.ts
- packages/game-engine/src/index.ts
- packages/game-engine/src/utils/state.ts
- apps/web/src/stores/gameStore.ts
- apps/web/src/components/CombatResultModal.tsx