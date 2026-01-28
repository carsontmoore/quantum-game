# Quantum Game - Project Roadmap

## MVP (Phase 1)

### Completed
- [x] Core game engine with full rule implementation
- [x] Local hot-seat multiplayer
- [x] AI opponents (Easy, Medium, Hard) - rule-based
- [x] Interactive game board with ship selection
- [x] Turn management and action validation
- [x] Research and advance card systems (framework)
- [x] Ship rendering fixed (tile positioning bug resolved)
- [x] Verified 2/3/4 player map rendering
- [x] Basic ship movement working
- [x] AI takes turns and can attack

### In Progress
- [x] Deploy from scrapyard UI (blocking - core mechanic)
- [x] AI turn loop debugging (appears stuck in some cases)

### Remaining MVP Tasks
- [ ] Ship ability UI triggers:
  - Battlestation (Strike) - attack adjacent without moving
  - Flagship (Transport) - carry other ships
  - Destroyer (Warp) - swap positions with friendly ship
  - Frigate (Modify) - change pip to 3 or 5
  - Interceptor (Maneuver) - diagonal movement (passive, may already work)
  - Scout (Free Reconfigure) - reroll without action cost
- [ ] Advance card selection flow (when earned via research/dominance)
- [ ] Combat feedback (show dice rolls, animations)
- [ ] AI turn visibility (display actions taken)
- [ ] Complete UI polish and testing
- [ ] Add re-roll option for players during initial setup
- [ ] Show scrapyard / make visible to all players 
- [ ] Polish and refine UI, add planet styling, formatting, background images, music , styling to the dice and board , animations for battle and cards, and components for each player's command sheet
- [ ] Modify card deck contents based on number of players in game
- [ ] Highlight / Animate / Add Border to ships engaged in battle
- [ ] Display actual ship pip total in combat resolution modal for calculation (currently shows 'roll # + ship' , change to 'roll # + pip number' or use ship name in lieu of pip number).  Could also clarify ship name next to or underneath 'Attacker' and 'Defender'
- [ ] Change the CardSelectionModal to show all available cards, as opposed to forcing user to alternate between Command and Gambit
- [ ] Update card descriptions in CardSelectionModal (Gambit and Command cards need clarifying / correct explanation of mechanic)
- [ ] Add card specific mechanic description to CardSelectionModal when card is highlighted
- [ ] Ensure scrapyard is visible as part of command sheet (for both player and AI)
- [ ] Add logic to account for Entaglement condition
- [ ] Consolidate research buttons / Make clear user notification of research action 
- [ ] Handle Expansion card selection / free deploy when there are no valid orbital positions 
  - Prevent Expansion card choice (need conditional) if all 5 ships currently in orbit
- [ ] Double check AI turn flow
  - Attack resolution modal appeared on AI turn prior to ships moving into valid attack position
    - Verify attack position conditional for players - AI was able to initiate attack without ships moving and/or being in a valid (adjacent) orbital position for attack
- Dominance counter appears to work from Advance card (Aggression) but did not update until AI turn (should be instant)
- [ ] Momentum bug needs to be edited to allow a ship to move a second time / (re)use an ability
- [ ] Advance card UI ? Logos / Images?
  - What are the numbers on each card currently representing ?
- [ ] Reorganization modal needs to inform user which ships (locations) are being chosen for reconfigure (specifically important in the case of duplicate ship types - user needs to know which scout / 6 is being removed and which stays in orbit for example)
- [ ] BUG : Deploy phase during Reorganization ends after first deployment, even with additional ship deploy options available
- [ ] Handle user choosing 'SKIP'  - reference rules - is user allowed to defer taking a card until a later turn? Do they lose the ability to gain a card if choosing skip ?
- [ ] Tests for playing cards in combination (a key feature of strategy in Quantum)
- [ ] BUG:  Deploy button active in ActionBar despite user actions being 0. Clicking does nothing but button should not be enabled if action count is zero (unless reactivated due to advance card effect)
- [ ] Command sheets should be able to be selected, such that the player can reference it for any other player at any point in the turn / game
- [ ] Double check that ship abilities are functioning
  - Does Frigate have the ability to modify ?
- [ ] Verify rules that players are unable to skip research gain, and the ensure this is captured in the game mechanics
---

## Phase 2 - Multiplayer & Persistence

- [ ] Real-time online multiplayer (WebSockets)
- [ ] Async turn-based play
- [ ] User accounts and statistics
- [ ] Game history and replays
- [ ] Interactive setup phase (choose starting planet, place ships manually)

---

## Phase 3 - AI Enhancement

- [ ] **MCTS algorithm** for Hard difficulty (smarter move evaluation via simulated playouts)
- [ ] **Strategic memory** - AI persists across turns, tracks goals and adapts to opponent patterns
- [ ] **AI personalities/playstyles:**
  - *Aggressive* - Prioritizes attacks, dominance counter, disrupting opponents
  - *Researcher* - Prioritizes research breakthroughs, card acquisition
  - *Builder* - Prioritizes efficient cube placement, avoids risky combat
  - *Tactician* - Prioritizes command card synergies and combos
  - *Balanced* - Current default behavior
- [ ] Difficulty-specific behaviors (not just weight tuning):
  - Easy: Makes occasional mistakes, ignores some threats
  - Medium: Solid fundamentals, some predictability
  - Hard: Optimal play, opponent modeling, adaptive strategy

---

## Phase 4 - Content & Customization

- [ ] Map editor and custom configurations
- [ ] Faction-specific abilities (unique ships, modified abilities, faction cards)
- [ ] Expansion content (new cards, new ship types, 5-6 player support)
- [ ] Custom rule variants
- [ ] Build tutorial mode / first-time walkthrough

---

## Placeholder Content Requiring Replacement

### Maps
- **Binary Stars** (2-player) - Placeholder name, layout, planet positions/numbers
- **Tri-Sector** (3-player) - Placeholder name, layout, planet positions/numbers
- **The Quadrant** (4-player) - Placeholder name, layout, planet positions/numbers
- **The Expanse** (2-player large) - Placeholder name, layout, planet positions/numbers
- Starting planet assignments for each map - Guessed based on corners/edges

### Command Cards (31 fabricated)
All names, descriptions, and effect implementations are invented:
- Relentless, Dangerous, Ferocious
- Agile, Swift
- Resourceful, Brilliant
- Resilient, Strategic
- Industrious, Dominant
- Ruthless, Cunning, Adaptive, Coordinated
- Aggressive, Mobile, Evasive, Fortified
- Expansionist, Researcher, Commander, Flanking
- Veteran, Prepared, Salvage, Intimidating
- Pioneers, Quantum Mastery, Overwhelming, Persistent

### Gambit Cards (6 fabricated)
All names, descriptions, quantities, and effect implementations are invented:
- Sabotage (2 copies)
- Quantum Surge (3 copies)
- Wormhole (3 copies)
- Colonize (2 copies)
- Espionage (2 copies)
- Overdrive (3 copies)

### Faction Names
- **Quantum Alliance** - Placeholder name
- **Void Collective** - Placeholder name
- **Stellar Dominion** - Placeholder name
- **Nebula Syndicate** - Placeholder name

The original game likely has different faction names (or may just use colors).

### Faction Colors
- Blue, Purple, Red, Green color assignments - Guessed, may not match original

### Game Constants (need verification)
- Starting research counter = 1
- Cubes per player per map (4-7 range guessed)
- Card market size = 3 each

### Card Effect Implementations
- All `CommandEffect` enum values and their logic
- All `GambitEffect` enum values and their logic
- How effects modify combat, movement, actions, etc.

---

## Content Verified as Accurate

Based on our discussions, the following is implemented correctly:
- Ship types 1-6 (Battlestation through Scout)
- Ship ability names (Strike, Transport, Warp, Modify, Maneuver, Free Reconfigure)
- Ship ability descriptions
- Movement = pip value
- Combat resolution (lower total wins, attacker wins ties)
- Dominance tracking (+1 attacker, -1 defender on kill)
- Research breakthrough at 6, resets to 1
- 3 actions per turn + free abilities
- Construct requires exact orbital sum = planet number
- Adjacency rules (orthogonal vs surrounding vs orbital)
- Turn structure (Actions phase → Advance Cards phase)
- Max 3 active Command cards
- Gambit = immediate, Command = persistent

---

## Technical Debt

- [ ] Add `position: 'absolute'` to inline styles (Tailwind class wasn't applying)
- [ ] Unit tests for game engine (action validation, combat resolution, win conditions)
- [ ] Integration tests for AI decision-making
- [ ] E2E tests for critical user flows

---

## Bug Fixes Log

| Date | Issue | Resolution |
|------|-------|------------|
| Session 1 | Ships rendering at wrong positions (diagonal, multiple planets) | Fixed: Added `position: 'absolute'` to inline style; replaced wrapper divs with React Fragment |
| Session 1 | Tailwind v4 not loading styles | Fixed: Downgraded to Tailwind v3 with proper config |
| Session 1 | TypeScript composite project error | Fixed: Added `composite: true` to tsconfig files |
| Session 1 | Vite not resolving workspace packages | Fixed: Added explicit aliases in vite.config.ts |