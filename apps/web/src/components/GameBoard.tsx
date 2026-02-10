/**
 * Game Board Component
 * Renders the galaxy map with planets and ships
 */

import { useMemo, Fragment } from 'react';
import { useGameStore } from '../stores/gameStore';
import { FACTIONS, ShipType, SHIP_ABILITIES } from '@quantum/types';
import { getOrbitalPositions, getTileCenterPosition } from '@quantum/game-engine';
import clsx from 'clsx';

const CELL_SIZE = 48;
const SHIP_NAMES: Record<ShipType, string> = {
  [ShipType.BATTLESTATION]: 'Battlestation',
  [ShipType.FLAGSHIP]: 'Flagship',
  [ShipType.DESTROYER]: 'Destroyer',
  [ShipType.FRIGATE]: 'Frigate',
  [ShipType.INTERCEPTOR]: 'Interceptor',
  [ShipType.SCOUT]: 'Scout',
};

export function GameBoard() {
  const { 
    gameState, 
    selectedShipId, 
    highlightedPositions, 
    selectShip, 
    performAction,
    isDeployMode,
    selectedScrapyardIndex,
    exitDeployMode, 
    highlightedTiles,
    relocationPhase,
  } = useGameStore();
  
  if (!gameState) return null;

  // Helper function to check if tile is highlighted
  const isTileHighlighted = (tileId: string) => highlightedTiles.includes(tileId);

  // Calculate board dimensions
  const { minX, minY, maxX, maxY } = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const tile of gameState.tiles) {
      minX = Math.min(minX, tile.position.x);
      minY = Math.min(minY, tile.position.y);
      maxX = Math.max(maxX, tile.position.x + 2);
      maxY = Math.max(maxY, tile.position.y + 2);
    }
    return { minX, minY, maxX, maxY };
  }, [gameState.tiles]);
  const width = (maxX - minX + 1) * CELL_SIZE;
  const height = (maxY - minY + 1) * CELL_SIZE;

  // Check if a position is highlighted
  const isHighlighted = (x: number, y: number) => {
    return highlightedPositions.some(p => p.x === x && p.y === y);
  };

  // Handle cell click
  const handleCellClick = (x: number, y: number) => {
    if (relocationPhase === 'selectDestination') {
      console.log('Relocation click:', { x, y, highlightedTiles });
      // Find which tile this cell belongs to
      const tile = gameState.tiles.find(t => 
        Math.abs(t.position.x - x) <= 1 && Math.abs(t.position.y - y) <= 1
      );
      console.log('Tile found:', tile);
      console.log('Is highlighted:', tile ? highlightedTiles.includes(tile.id) : 'no tile');
      if (tile && highlightedTiles.includes(tile.id)) {
        useGameStore.getState().executeRelocation(tile.id);
        return;
      }
    }
    console.log('Cell clicked:', { x, y, isDeployMode, selectedScrapyardIndex, isHighlighted: isHighlighted(x, y) });
    if (!isHighlighted(x, y)) return;
    // Handle Deploy Mode
    if (isDeployMode && selectedScrapyardIndex !== null) {
      performAction({
        type: 'deploy',
        shipIndex: selectedScrapyardIndex,
        targetPosition: { x, y },
      });
      // Exit Deploy Mode not required - performAction handles it
      return;
      console.log("CHECK isDeployMode: ", isDeployMode);
    }
    // Handle move/attack (requires selected ship)
    if (!selectedShipId) return;
    
    const targetShip = gameState.ships.find(s => s.position?.x === x && s.position?.y === y);
    
    if (targetShip && targetShip.ownerId !== gameState.currentPlayerId) {
      // Attack
      performAction({ type: 'attack', shipId: selectedShipId, targetPosition: { x, y } });
    } else {
      // Move
      performAction({ type: 'move', shipId: selectedShipId, targetPosition: { x, y } });
    }
  };

  // Handle ship click
  const handleShipClick = (shipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ship = gameState.ships.find(s => s.id === shipId);
    
    if (ship?.ownerId === gameState.currentPlayerId) {
      selectShip(selectedShipId === shipId ? null : shipId);
    } else if (selectedShipId && ship) {
      // Clicking enemy ship with selected ship = attack
      const targetPos = ship.position;
      if (targetPos && isHighlighted(targetPos.x, targetPos.y)) {
        performAction({ type: 'attack', shipId: selectedShipId, targetPosition: targetPos });
      }
    }
  };


// const player1Ships = gameState.ships.filter(s => s.ownerId === gameState.players[0].id);


  return (
    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 overflow-auto">
      <div
        className="relative mx-auto"
        style={{ width, height }}
      >
        {/* Grid Background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(100,116,139,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100,116,139,0.3) 1px, transparent 1px)
            `,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          }}
        />

        {/* Render Tiles */}
        {gameState.tiles.map(tile => {
          const centerPos = getTileCenterPosition(tile);
          const orbitals = getOrbitalPositions(tile);
          const cubeOwner = tile.quantumCube
            ? gameState.players.find(p => p.id === tile.quantumCube)
            : null;
          const faction = cubeOwner
            ? FACTIONS.find(f => f.id === cubeOwner.factionId)
            : null;

          return (
            <Fragment key={tile.id}>
              {/* Planet */}
              <div
                className={clsx(
                  isTileHighlighted(tile.id) && 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900',
                  'planet absolute flex items-center justify-center text-lg font-bold',
                  'transform -translate-x-1/2 -translate-y-1/2',
                  cubeOwner && 'has-cube'
                )}
                style={{
                  left: (centerPos.x - minX) * CELL_SIZE + CELL_SIZE / 2,
                  top: (centerPos.y - minY) * CELL_SIZE + CELL_SIZE / 2,
                  width: CELL_SIZE * 0.9,
                  height: CELL_SIZE * 0.9,
                  borderColor: faction?.color || undefined,
                  boxShadow: faction ? `0 0 20px ${faction.color}40` : undefined,
                }}
                onClick={() => {
                  if (isTileHighlighted(tile.id) && relocationPhase === 'selectDestination') {
                    useGameStore.getState().executeRelocation(tile.id);
                  }
                }}
              >
                {tile.planetNumber}
              </div>

              {/* Orbital Slots */}
              {orbitals.map((pos, i) => {
                const highlighted = isHighlighted(pos.x, pos.y);
                const hasShip = gameState.ships.some(
                  s => s.position?.x === pos.x && s.position?.y === pos.y
                );

                return (
                  <div
                    key={`${tile.id}-orbital-${i}`}
                    className={clsx(
                      'orbital-slot absolute transform -translate-x-1/2 -translate-y-1/2',
                      highlighted && !hasShip && 'valid-target'
                    )}
                    style={{
                      left: (pos.x - minX) * CELL_SIZE + CELL_SIZE / 2,
                      top: (pos.y - minY) * CELL_SIZE + CELL_SIZE / 2,
                    }}
                    onClick={() => handleCellClick(pos.x, pos.y)}
                  />
                );
              })}
            </Fragment>
          );
        })}

        {/* Render Ships */}
        {gameState.ships.map(ship => {
          if (!ship.position) return null;

          const owner = gameState.players.find(p => p.id === ship.ownerId);
          const faction = owner ? FACTIONS.find(f => f.id === owner.factionId) : null;
          const isSelected = selectedShipId === ship.id;
          const isCurrentPlayer = ship.ownerId === gameState.currentPlayerId;
          const canSelect = isCurrentPlayer && !ship.hasMovedThisTurn;

          return (
            <div
              key={ship.id}
              className={clsx(
                'ship-die absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer',
                isSelected && 'selected glow-pulse',
                canSelect && 'hover:scale-110',
                !isCurrentPlayer && 'opacity-90'
              )}
              style={{
                position: 'absolute',
                left: (ship.position.x - minX) * CELL_SIZE + CELL_SIZE / 2,
                top: (ship.position.y - minY) * CELL_SIZE + CELL_SIZE / 2,
                backgroundColor: faction?.color || '#64748b',
                color: '#fff',
                borderColor: faction?.secondaryColor || '#475569',
                borderWidth: 2,
              }}
              onClick={(e) => handleShipClick(ship.id, e)}
              title={`${SHIP_NAMES[ship.pipValue]} - ${SHIP_ABILITIES[ship.pipValue].name}`}
            >
              {ship.pipValue}
            </div>
          );
        })}

        {/* Highlighted Positions (non-orbital) */}
        {highlightedPositions.map(pos => {
          const isOrbital = gameState.tiles.some(t => {
            const orbitals = getOrbitalPositions(t);
            return orbitals.some(o => o.x === pos.x && o.y === pos.y);
          });

          if (isOrbital) return null;

          const hasEnemy = gameState.ships.some(
            s => s.position?.x === pos.x && s.position?.y === pos.y &&
                 s.ownerId !== gameState.currentPlayerId
          );

          return (
            <div
              key={`highlight-${pos.x}-${pos.y}`}
              className={clsx(
                'absolute w-10 h-10 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer',
                'transition-colors duration-150',
                hasEnemy
                  ? 'border-2 border-red-500 bg-red-500/20 hover:bg-red-500/40'
                  : 'border-2 border-green-500 bg-green-500/20 hover:bg-green-500/40'
              )}
              style={{
                left: (pos.x - minX) * CELL_SIZE + CELL_SIZE / 2,
                top: (pos.y - minY) * CELL_SIZE + CELL_SIZE / 2,
              }}
              onClick={() => handleCellClick(pos.x, pos.y)}
            />
          );
        })}
      </div>
    </div>
  );
}
