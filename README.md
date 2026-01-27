# Quantum - Digital Board Game

A digital recreation of the Quantum 4X space strategy board game, built as a Progressive Web App.

## 🎮 Game Overview

Quantum is a fast-paced 4X (explore, expand, exploit, exterminate) strategy game where players command fleets of ships represented by dice. Ships move based on their pip values and have unique abilities. The goal is to be the first player to place all your quantum cubes on planets across the galaxy.

### Key Mechanics

- **Ships as Dice**: Each ship is a die (1-6) that determines both movement range and special ability
- **Ship Types**:
  - 1️⃣ **Battlestation** - Strike: Attack adjacent enemies without moving
  - 2️⃣ **Flagship** - Transport: Carry allied ships during movement
  - 3️⃣ **Destroyer** - Warp: Swap positions with any allied ship
  - 4️⃣ **Frigate** - Modify: Transform into a 3 or 5
  - 5️⃣ **Interceptor** - Maneuver: Move diagonally
  - 6️⃣ **Scout** - Free Reconfigure: Reroll without using an action

- **Combat**: Lower total (die value + roll) wins, attacker wins ties
- **Construction**: Ships in orbit around a planet must sum exactly to the planet's number to place a cube

## 🏗️ Architecture

```
quantum-game/
├── apps/
│   ├── web/              # React PWA frontend
│   └── api/              # Hono API server
├── packages/
│   ├── types/            # Shared TypeScript types
│   ├── game-engine/      # Core game logic
│   └── ai/               # AI opponent logic
└── package.json          # Monorepo root
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State | Zustand |
| Monorepo | npm workspaces |
| Backend | Node.js, Hono (planned) |
| Database | MongoDB |
| PWA | vite-plugin-pwa |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB (local or Atlas)

### Installation

```bash
# Clone the repo
git clone https://github.com/

# Install dependencies
npm install

# Build shared packages first (required before running)
npm run build:packages

# Start the web app in development mode
npm run dev
```

### Running Both Frontend and API

```bash
# Terminal 1 - Start the API server (requires MongoDB)
npm run dev:api

# Terminal 2 - Start the web frontend
npm run dev:web
```

### Environment Variables

Create `.env` files in `apps/api/`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/quantum
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

## 🎯 Current Features

- [x] Core game engine with full rule implementation
- [x] Local play vs AI opponent
- [x] AI opponents (Easy, Medium, Hard difficulty)
- [x] Interactive game board with ship selection
- [x] Turn management and action validation
- [x] Combat resolution with visual feedback
- [x] Research and breakthrough system
- [x] Advance card system (Command + Gambit cards)
- [x] Card selection modal and market display
- [x] Deploy ships from scrapyard
- [ ] Multiple cubes per planet (in progress)
- [ ] Ship ability UI improvements
- [ ] Real-time online multiplayer
- [ ] Async turn-based play

## 🧪 Development

### Key Files

- `packages/game-engine/src/index.ts` - Main game engine class
- `packages/game-engine/src/cards.ts` - Card definitions
- `apps/web/src/stores/gameStore.ts` - Client state management
- `apps/web/src/components/` - React UI components

### TypeScript Notes

See [LEARNINGS.md](./LEARNINGS.md) for documented patterns including:
- Type vs value imports for enums
- React key uniqueness for card instances
- Action log slicing for AI turn detection

### Commit Convention
```
feat: new feature
fix: bug fix
refactor: code change that neither fixes nor adds
docs: documentation only
test: adding or updating tests
chore: maintenance tasks
```

## 📁 Project Structure

### Packages

#### `@quantum/types`
Shared TypeScript type definitions for the entire project including game state, actions, events, and database models.

#### `@quantum/game-engine`
Pure TypeScript game logic with no external dependencies. Includes:
- Board utilities (adjacency, pathfinding)
- Dice rolling and combat resolution
- Action validation
- State management

#### `@quantum/ai`
Rule-based AI opponent that evaluates available actions and selects optimal moves based on difficulty level.

### Apps

#### `@quantum/web`
React PWA frontend featuring:
- Game setup with faction and map selection
- Interactive board rendering
- Player panels with resource tracking
- Action bar for quick commands

#### `@quantum/api`
Hono-based REST API providing:
- User authentication (JWT)
- Game creation and management
- Action processing
- AI turn execution

## 🎲 Game Rules Quick Reference

### Turn Structure

1. **Action Phase** (3 actions + ship abilities)
   - Reconfigure: Reroll a ship
   - Deploy: Place ship from scrapyard
   - Move/Attack: Move up to ship number
   - Construct: Place cube (2 actions)
   - Research: +1 to research counter

2. **Advance Cards Phase**
   - Earn cards for cubes placed
   - Research breakthrough at 6 grants a card

### Adjacency Rules

- **Next to**: 4 orthogonal spaces (↑↓←→)
- **Surrounding**: 8 spaces (includes diagonals)
- **Orbital**: 4 spaces next to a planet

## 🔮 Future Roadmap

1. **v0.2**: Real-time multiplayer with WebSockets
2. **v0.3**: Async turn-based play
3. **v0.4**: Player statistics and leaderboards
4. **v0.5**: Faction-specific abilities
5. **v1.0**: Map editor and custom rules

## 📄 License

This project is a fan-made digital recreation for personal use. Quantum board game is © Funforge.

## 🙏 Acknowledgments

- Original Quantum game designed by Eric Zimmerman
- Published by Funforge
