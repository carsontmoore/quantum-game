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
- [x] AI turn loop debugging (appears stuck in some cases)
- [x] Deploy from scrapyard UI (blocking - core mechanic)
- [x] Advance card selection flow (when earned via research/dominance)
- [x] BUG : Deploy phase during Reorganization ends after first deployment, even with additional ship deploy options available
- [x] Combat system refactor to single entry point pattern
- [x] Combat state machine (pre-combat, rolls, re-roll, resolution phases)
- [x] Command cards Group 1: Brilliant, Curious (start-of-turn passives)
- [x] Command cards Group 2: Agile, Energetic, Stealthy, Eager, Precocious, Intelligent, Ingenious, Flexible (constant modifiers)
- [x] Command cards Group 3: Ferocious, Strategic, Rational, Stubborn, Dangerous, Cruel, Relentless, Scrappy (combat modifiers)
- [x] Gambit cards: Expansion, Aggression, Momentum, Relocation, Reorganization, Sabotage


### In Progress
- [ ] Dominance counter appears to work from Advance card (Aggression) but did not update until AI turn (should be instant)
- [ ] Handle Expansion card selection / free deploy when there are no valid orbital positions 
  - Prevent Expansion card choice (need conditional) if all 5 ships currently in orbit
- [ ] Test combat refactor (human vs AI, AI vs human, hot-seat, all combat card combinations)

### Remaining MVP Tasks
- [ ] Ship ability UI triggers:
  - Battlestation (Strike) - attack adjacent without moving
  - Flagship (Transport) - carry other ships
  - Destroyer (Warp) - swap positions with friendly ship
  - Frigate (Modify) - change pip to 3 or 5
  - Interceptor (Maneuver) - diagonal movement (passive, may already work)
  - Scout (Free Reconfigure) - reroll without action cost
- [ ] Command cards Group 4: Arrogant, Warlike, Conformist, Tactical (conditional action bonuses)
- [ ] Command cards Group 5: Righteous, Ravenous, Plundering, Tyrannical, Cerebral (dominance/research modifiers)
- [ ] Command cards Group 6: Resourceful, Cunning, Clever, Nomadic (special abilities)

- [ ] Combat feedback (show dice rolls, animations)
- [ ] AI turn visibility (display actions taken)
- [ ] Complete UI polish and testing
- [ ] Add re-roll option for players during initial setup (must re-roll all 3 ships)
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

- [ ] Double check AI turn flow
  - Attack resolution modal appeared on AI turn prior to ships moving into valid attack position
    - Verify attack position conditional for players - AI was able to initiate attack without ships moving and/or being in a valid (adjacent) orbital position for attack

- [ ] Momentum needs to be tested to allow a ship (re)use an ability
- [ ] Advance card UI ? Logos / Images?
  - What are the numbers on each card currently representing ?
- [ ] Reorganization modal needs to inform user which ships (locations) are being chosen for reconfigure (specifically important in the case of duplicate ship types - user needs to know which scout / 6 is being removed and which stays in orbit for example)

- [ ] Handle user choosing 'SKIP'  - reference rules - is user allowed to defer taking a card until a later turn? Do they lose the ability to gain a card if choosing skip ?
- [ ] Tests for playing cards in combination (a key feature of strategy in Quantum)
- [ ] BUG:  Deploy button active in ActionBar despite user actions being 0. Clicking does nothing but button should not be enabled if action count is zero (unless reactivated due to advance card effect)
- [ ] Command sheets should be able to be selected, such that the player can reference it for any other player at any point in the turn / game
- [ ] Double check that ship abilities are functioning
  - Does Frigate have the ability to modify ?
- [ ] Verify rules that players are unable to skip research gain, and the ensure this is captured in the game mechanics
- [ ] Address known limitation for multiple launch attack position scenario [Need 2 step attack flow]
  - When multiple valid launch positions exist, let player choose which adjacent square to attack from
  - For ships with higher pip values, there could be multiple valid adjacent squares to attack from
    - Current path algorithm picks one deterministically 
    - Long term need to implement 2 step attack flow: 
      - Player Selects ship and enemy target
      - If multiple valid launch positions exist, show them highlighted and let player choose
      - Then resolve combat
- [ ] visual indicator showing attack path before confirming attack

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

### Command Cards (31 total)
18 implemented, 13 remaining: 

**Implemented:**
- Group 1: Brilliant, Curious
- Group 2: Agile, Energetic, Stealthy, Eager, Precocious, Intelligent, Ingenious, Flexible
- Group 3: Ferocious, Strategic, Rational, Stubborn, Dangerous, Cruel, Relentless, Scrappy

**Remaining:**
- Group 4: Arrogant, Warlike, Conformist, Tactical
- Group 5: Righteous, Ravenous, Plundering, Tyrannical, Cerebral
- Group 6: Resourceful, Cunning, Clever, Nomadic


### Gambit Cards (6 fabricated)
All implemented: Expansion, Aggression, Momentum, Relocation, Reorganization, Sabotage


### Fabricated Advance Cards for potential future inclusion
- Swift
- Resilient
- Industrious
- Dominant
- Ruthless
- Adaptive
- Coordinated
- Aggressive
- Mobile
- Evasive
- Fortified
- Expansionist
- Researcher
- Commander
- Flanking
- Veteran, Prepared, Salvage, Intimidating
- Pioneers, Quantum Mastery, Overwhelming, Persistent
- Gambits:  Quantum Surge, Wormhole, Colonize, Espionage, Overdrive


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
- [ ] Remove commented-out legacy combat code from game-engine and gameStore after testing confirms refactor works
- [ ] Unit tests for combat system (phased state machine, card modifiers, edge cases)

---

## Bug Fixes Log

| Date | Issue | Resolution |
|------|-------|------------|
| Session 1 | Ships rendering at wrong positions (diagonal, multiple planets) | Fixed: Added `position: 'absolute'` to inline style; replaced wrapper divs with React Fragment |
| Session 1 | Tailwind v4 not loading styles | Fixed: Downgraded to Tailwind v3 with proper config |
| Session 1 | TypeScript composite project error | Fixed: Added `composite: true` to tsconfig files |
| Session 1 | Vite not resolving workspace packages | Fixed: Added explicit aliases in vite.config.ts |



## Bugs during Combat Testing
- Free reconfigure for ship type 6 cost an action
  - Ship abilities have yet to be implemented, likely reason why?
- Previous combatModal that showed combat details (what numbers were rolled) no longer renders
  - AI attacking human immediately advanced to resolution modal - should it bypass in this way?
  - All combat details appear to have been lost
    - Human attacks AI:  modal simply shows result "Defender holds" - does not show dice result or any other detail
  - Double-check expected modal behavior post-refactor
- Deploying from scrapyard is broken 
  - Possible to deploy ship but unable to move it with remaining action 
    - No Ships in Scrapyard error, Deploy case logging in console
  - Behavior persists across multiple turns and extends to every deployed ship - HUGE BUG

- No visual cue it is the player's turn / AI turn has ended
- Rolls phase completely bypassed 
- Attacker stay in place functionality is broken -  when moving a ship into attack position, the 'stay in place' should not be the original spot , it should be the adjacent spot on the board that the attack is launched from - need to fix - core movement mechanic is currently broken
- Won attack (human initiated), now unable to utilize remaining actions (ActionBar disabled). Able to yse research only because its available in its own component outside the ActionBar component
  - clicking research allowed progression and enabled ActionBar for subsequent turn, so issue appears combat resolution related
- Modal showed me Defender wins, but AI was the attacker and destroyed one of my ships - so combat mapping is broken ?