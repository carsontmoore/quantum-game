/**
 * Game Setup Component
 * Allows players to configure and start a new game
 */

import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { MAP_CONFIGS } from '@quantum/game-engine';
import { FACTIONS, PlayerType, AIDifficulty } from '@quantum/types';

interface PlayerConfig {
  type: 'human' | 'ai';
  factionId: string;
  aiDifficulty: AIDifficulty;
}

export function GameSetup() {
  const { createLocalGame } = useGameStore();
  
  const [selectedMap, setSelectedMap] = useState(MAP_CONFIGS[0].id);
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<PlayerConfig[]>([
    { type: 'human', factionId: 'quantum', aiDifficulty: AIDifficulty.MEDIUM },
    { type: 'ai', factionId: 'void', aiDifficulty: AIDifficulty.MEDIUM },
  ]);

  const mapConfig = MAP_CONFIGS.find(m => m.id === selectedMap);
  const availableMaps = MAP_CONFIGS.filter(m => m.playerCount.includes(playerCount));

  const updatePlayerCount = (count: number) => {
    setPlayerCount(count);
    const newPlayers: PlayerConfig[] = [];
    const usedFactions = new Set<string>();
    
    for (let i = 0; i < count; i++) {
      const existingPlayer = players[i];
      let factionId = existingPlayer?.factionId;
      
      if (!factionId || usedFactions.has(factionId)) {
        factionId = FACTIONS.find(f => !usedFactions.has(f.id))?.id || FACTIONS[0].id;
      }
      
      usedFactions.add(factionId);
      newPlayers.push({
        type: i === 0 ? 'human' : 'ai',
        factionId,
        aiDifficulty: existingPlayer?.aiDifficulty || AIDifficulty.MEDIUM,
      });
    }
    
    setPlayers(newPlayers);
    
    // Update map if current doesn't support new count
    const validMap = MAP_CONFIGS.find(m => m.playerCount.includes(count));
    if (validMap && !MAP_CONFIGS.find(m => m.id === selectedMap)?.playerCount.includes(count)) {
      setSelectedMap(validMap.id);
    }
  };

  const updatePlayer = (index: number, updates: Partial<PlayerConfig>) => {
    setPlayers(prev => prev.map((p, i) => 
      i === index ? { ...p, ...updates } : p
    ));
  };

  const startGame = () => {
    createLocalGame({
      mapConfigId: selectedMap,
      players: players.map(p => ({
        type: p.type === 'human' ? PlayerType.HUMAN : PlayerType.AI,
        factionId: p.factionId,
        aiDifficulty: p.type === 'ai' ? p.aiDifficulty : undefined,
      })),
    });
  };

  const usedFactions = new Set(players.map(p => p.factionId));

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent font-['Orbitron']">
            NEW GAME
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Player Count */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Number of Players
            </label>
            <div className="flex gap-2">
              {[2, 3, 4].map(count => (
                <button
                  key={count}
                  onClick={() => updatePlayerCount(count)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    playerCount === count
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {count} Players
                </button>
              ))}
            </div>
          </div>

          {/* Map Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Galaxy Sector
            </label>
            <div className="grid grid-cols-2 gap-3">
              {availableMaps.map(map => (
                <button
                  key={map.id}
                  onClick={() => setSelectedMap(map.id)}
                  className={`p-4 rounded-lg text-left transition-all ${
                    selectedMap === map.id
                      ? 'bg-blue-600/30 border-2 border-blue-500'
                      : 'bg-slate-800 border-2 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="font-medium text-slate-200">{map.name}</div>
                  <div className="text-sm text-slate-400 mt-1">
                    {map.cubesPerPlayer} cubes • {map.tiles.length} planets
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Player Configuration */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Players
            </label>
            <div className="space-y-3">
              {players.map((player, index) => {
                const faction = FACTIONS.find(f => f.id === player.factionId);
                return (
                  <div
                    key={index}
                    className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="text-sm text-slate-400 mb-1">Player {index + 1}</div>
                        <div className="flex items-center gap-3">
                          {/* Type Toggle */}
                          <select
                            value={player.type}
                            onChange={e => updatePlayer(index, { type: e.target.value as 'human' | 'ai' })}
                            className="bg-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 border border-slate-600"
                          >
                            <option value="human">Human</option>
                            <option value="ai">AI</option>
                          </select>

                          {/* Faction Selection */}
                          <select
                            value={player.factionId}
                            onChange={e => updatePlayer(index, { factionId: e.target.value })}
                            className="bg-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 border border-slate-600"
                          >
                            {FACTIONS.map(f => (
                              <option
                                key={f.id}
                                value={f.id}
                                disabled={usedFactions.has(f.id) && f.id !== player.factionId}
                              >
                                {f.name}
                              </option>
                            ))}
                          </select>

                          {/* AI Difficulty */}
                          {player.type === 'ai' && (
                            <select
                              value={player.aiDifficulty}
                              onChange={e => updatePlayer(index, { aiDifficulty: e.target.value as AIDifficulty })}
                              className="bg-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 border border-slate-600"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Faction Color Indicator */}
                      <div
                        className="w-10 h-10 rounded-full border-2"
                        style={{
                          backgroundColor: faction?.color,
                          borderColor: faction?.secondaryColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="p-6 border-t border-slate-700">
          <button
            onClick={startGame}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-semibold text-lg transition-all shadow-lg hover:shadow-cyan-500/25"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}
