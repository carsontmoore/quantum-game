/**
 * Quantum - Main App Component
 */

import { useGameStore } from './stores/gameStore';
import { GameBoard } from './components/GameBoard';
import { GameSetup } from './components/GameSetup';
import { PlayerPanel } from './components/PlayerPanel';
import { ActionBar } from './components/ActionBar';
import { GameHeader } from './components/GameHeader';
import { CombatResultModal } from './components/CombatResultModal';
import { CommandSheet } from './components/CommandSheet';
import { CardSelectionModal } from './components/CardSelectionModal';
import { Card } from './components/Card';
import { CardDetailModal } from './components/CardDetailModal';
import { useState } from 'react';
import { AdvanceCard } from '@quantum/types';
import { ReorganizationModal } from './components/ReorganizationModal';

function App() {
  const { 
    gameState, 
    showSetupModal, 
    showCardSelection,
    error, 
    clearError,
    closeCardSelection,
    selectCard,
  } = useGameStore();
  
  const [previewCard, setPreviewCard] = useState<AdvanceCard | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 space-grid">
      <GameHeader />

      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-900/90 border border-red-600 rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
          <span className="text-red-200">{error}</span>
          <button onClick={clearError} className="text-red-400 hover:text-red-200 text-xl leading-none">×</button>
        </div>
      )}

      {showSetupModal && <GameSetup />}

      {gameState && !showSetupModal && (
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6">
            {/* Left Panel - Player Info */}
            <div className="order-2 lg:order-1 space-y-4">
              <PlayerPanel />
              <CommandSheet />
            </div>

            {/* Center - Game Board */}
            <div className="order-1 lg:order-2">
              <GameBoard />
              <ActionBar />
            </div>

            {/* Right Panel - Card Market */}
            <div className="order-3 space-y-4">
              {/* Gambit Market */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-purple-400 mb-3 uppercase tracking-wide">
                  Gambit Market
                </h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {gameState.cards.gambitMarket.map((card, index) => (
                    <Card
                      key={card.id || index}
                      card={card}
                      size="small"
                      onClick={() => setPreviewCard(card)}
                    />
                  ))}
                </div>
                <div className="text-xs text-slate-500 text-center mt-2">
                  Deck: {gameState.cards.gambitDeck.length}
                </div>
              </div>

              {/* Command Market */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">
                  Command Market
                </h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {gameState.cards.commandMarket.map((card, index) => (
                    <Card
                      key={card.id || index}
                      card={card}
                      size="small"
                      onClick={() => setPreviewCard(card)}
                    />
                  ))}
                </div>
                <div className="text-xs text-slate-500 text-center mt-2">
                  Deck: {gameState.cards.commandDeck.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      {gameState?.status === 'finished' && gameState.winnerId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 text-center max-w-md mx-4 border border-slate-600">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-yellow-400 mb-2">Victory!</h2>
            <p className="text-slate-300 mb-6">
              {gameState.players.find(p => p.id === gameState.winnerId)?.factionId} wins!
            </p>
            <button onClick={() => useGameStore.getState().reset()} className="action-btn primary">
              New Game
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CombatResultModal />
      
      <CardSelectionModal
        isOpen={showCardSelection}
        onSelect={selectCard}
        onClose={closeCardSelection}
      />
      
      <CardDetailModal
        card={previewCard}
        onClose={() => setPreviewCard(null)}
      />

      <ReorganizationModal />
    </div>
  );
}

export default App;