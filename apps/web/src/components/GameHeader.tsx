/**
 * Game Header Component
 */

import { useGameStore } from '../stores/gameStore';

export function GameHeader() {
  const { gameState, reset } = useGameStore();

  return (
    <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent font-['Orbitron']">
            QUANTUM
          </h1>
          {gameState && (
            <span className="text-sm text-slate-400">
              Turn {gameState.turnNumber}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {gameState && (
            <>
              <div className="text-sm text-slate-400">
                {gameState.status === 'in_progress' ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    In Progress
                  </span>
                ) : gameState.status === 'finished' ? (
                  <span className="text-yellow-400">Game Over</span>
                ) : (
                  gameState.status
                )}
              </div>
              <button
                onClick={reset}
                className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                New Game
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
