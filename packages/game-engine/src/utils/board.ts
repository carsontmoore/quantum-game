/**
 * Board Utilities
 * 
 * Handles spatial logic: adjacency, movement paths, orbital positions.
 * 
 * Terminology (from game rules):
 * - "Next to" = 4 orthogonally adjacent spaces (not diagonal)
 * - "Surrounding" = 8 spaces (orthogonal + diagonal)
 * - "Orbital positions" = 4 spaces next to a planet (orthogonal)
 */

import type { Position, Tile, Ship, ShipType, GameState } from '@quantum/types';

// =============================================================================
// POSITION UTILITIES
// =============================================================================

/** Check if two positions are equal */
export function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

/** Create a position key for Maps/Sets */
export function positionKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

/** Parse position key back to Position */
export function parsePositionKey(key: string): Position {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

/** Get Manhattan distance between two positions */
export function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** Get Chebyshev distance (allows diagonal) */
export function chebyshevDistance(a: Position, b: Position): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

// =============================================================================
// ADJACENCY LOGIC
// =============================================================================

/** 
 * Get orthogonally adjacent positions ("next to")
 * These are the 4 cardinal directions: up, down, left, right
 */
export function getAdjacentPositions(pos: Position): Position[] {
  return [
    { x: pos.x, y: pos.y - 1 },     // Up
    { x: pos.x, y: pos.y + 1 },     // Down
    { x: pos.x - 1, y: pos.y },     // Left
    { x: pos.x + 1, y: pos.y },     // Right
  ];
}

/**
 * Get all surrounding positions (orthogonal + diagonal)
 * These are the 8 spaces around a position
 */
export function getSurroundingPositions(pos: Position): Position[] {
  return [
    { x: pos.x, y: pos.y - 1 },     // Up
    { x: pos.x, y: pos.y + 1 },     // Down
    { x: pos.x - 1, y: pos.y },     // Left
    { x: pos.x + 1, y: pos.y },     // Right
    { x: pos.x - 1, y: pos.y - 1 }, // Up-Left
    { x: pos.x + 1, y: pos.y - 1 }, // Up-Right
    { x: pos.x - 1, y: pos.y + 1 }, // Down-Left
    { x: pos.x + 1, y: pos.y + 1 }, // Down-Right
  ];
}

/**
 * Get diagonal positions only
 */
export function getDiagonalPositions(pos: Position): Position[] {
  return [
    { x: pos.x - 1, y: pos.y - 1 }, // Up-Left
    { x: pos.x + 1, y: pos.y - 1 }, // Up-Right
    { x: pos.x - 1, y: pos.y + 1 }, // Down-Left
    { x: pos.x + 1, y: pos.y + 1 }, // Down-Right
  ];
}

/**
 * Check if position B is adjacent (orthogonal) to position A
 */
export function isAdjacent(a: Position, b: Position): boolean {
  return manhattanDistance(a, b) === 1;
}

/**
 * Check if position B is surrounding position A (includes diagonal)
 */
export function isSurrounding(a: Position, b: Position): boolean {
  return chebyshevDistance(a, b) === 1;
}

// =============================================================================
// TILE / PLANET LOGIC
// =============================================================================

/**
 * Get the center position (planet position) of a tile
 * Tiles are 3x3 grids, planet is at center
 */
export function getTileCenterPosition(tile: Tile): Position {
  return {
    x: tile.position.x + 1,
    y: tile.position.y + 1,
  };
}

/**
 * Get orbital positions for a tile (4 spaces orthogonally adjacent to planet)
 */
export function getOrbitalPositions(tile: Tile): Position[] {
  const center = getTileCenterPosition(tile);
  return getAdjacentPositions(center);
}

/**
 * Check if a position is a planet center
 */
export function isPlanetPosition(pos: Position, tiles: Tile[]): boolean {
  return tiles.some(tile => {
    const center = getTileCenterPosition(tile);
    return positionsEqual(pos, center);
  });
}

/**
 * Check if a position is an orbital position of any planet
 */
export function isOrbitalPosition(pos: Position, tiles: Tile[]): boolean {
  return tiles.some(tile => {
    const orbitals = getOrbitalPositions(tile);
    return orbitals.some(orbital => positionsEqual(pos, orbital));
  });
}

/**
 * Get the tile that contains a position (if any)
 */
export function getTileContainingPosition(pos: Position, tiles: Tile[]): Tile | undefined {
  return tiles.find(tile => {
    const minX = tile.position.x;
    const maxX = tile.position.x + 2;
    const minY = tile.position.y;
    const maxY = tile.position.y + 2;
    return pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY;
  });
}

/**
 * Get the tile for which this position is orbital (if any)
 */
export function getTileForOrbitalPosition(pos: Position, tiles: Tile[]): Tile | undefined {
  return tiles.find(tile => {
    const orbitals = getOrbitalPositions(tile);
    return orbitals.some(orbital => positionsEqual(pos, orbital));
  });
}

// =============================================================================
// BOARD STATE QUERIES
// =============================================================================

/**
 * Check if a position is valid (on the board)
 */
export function isValidPosition(pos: Position, tiles: Tile[]): boolean {
  return getTileContainingPosition(pos, tiles) !== undefined;
}

/**
 * Check if a position is blocked (has a ship or is a planet)
 */
export function isPositionBlocked(pos: Position, state: GameState): boolean {
  // Check if it's a planet
  if (isPlanetPosition(pos, state.tiles)) {
    return true;
  }
  
  // Check if there's a ship there
  const shipAtPosition = state.ships.find(
    ship => ship.position && positionsEqual(ship.position, pos)
  );
  
  return shipAtPosition !== undefined;
}

/**
 * Get ship at position (if any)
 */
export function getShipAtPosition(pos: Position, ships: Ship[]): Ship | undefined {
  return ships.find(
    ship => ship.position && positionsEqual(ship.position, pos)
  );
}

/**
 * Get all ships in orbital positions around a tile
 */
export function getShipsInOrbit(tile: Tile, ships: Ship[]): Ship[] {
  const orbitals = getOrbitalPositions(tile);
  return ships.filter(ship => 
    ship.position && orbitals.some(orbital => positionsEqual(ship.position!, orbital))
  );
}

/**
 * Get ships owned by a player in orbital positions around a tile
 */
export function getPlayerShipsInOrbit(tile: Tile, ships: Ship[], playerId: string): Ship[] {
  return getShipsInOrbit(tile, ships).filter(ship => ship.ownerId === playerId);
}

// =============================================================================
// MOVEMENT PATH FINDING
// =============================================================================

interface PathNode {
  position: Position;
  distance: number;
  path: Position[];
}

/**
 * Find all reachable positions for a ship
 * Respects movement rules: orthogonal only, can't pass through ships or planets
 * 
 * @param ship - The ship to move
 * @param state - Current game state
 * @param allowDiagonal - True if Interceptor's Maneuver ability is active
 * @returns Map of reachable positions to their paths
 */
export function findReachablePositions(
  ship: Ship,
  state: GameState,
  allowDiagonal: boolean = false
): Map<string, Position[]> {
  if (!ship.position) {
    return new Map();
  }
  
  const maxDistance = ship.pipValue as number;
  const reachable = new Map<string, Position[]>();
  const visited = new Set<string>();
  
  // BFS from starting position
  const queue: PathNode[] = [{
    position: ship.position,
    distance: 0,
    path: [],
  }];
  
  visited.add(positionKey(ship.position));
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current.distance > 0) {
      // This position is reachable (not starting position)
      reachable.set(positionKey(current.position), current.path);
    }
    
    if (current.distance >= maxDistance) {
      continue;
    }
    
    // Get neighbors based on movement type
    const neighbors = allowDiagonal
      ? getSurroundingPositions(current.position)
      : getAdjacentPositions(current.position);
    
    for (const neighbor of neighbors) {
      const key = positionKey(neighbor);
      
      if (visited.has(key)) {
        continue;
      }
      
      // Check if position is valid
      if (!isValidPosition(neighbor, state.tiles)) {
        continue;
      }
      
      // Check if it's a planet (can't move through)
      if (isPlanetPosition(neighbor, state.tiles)) {
        continue;
      }
      
      // Check if there's a ship (can't move through, but can attack enemies)
      const shipAtPos = getShipAtPosition(neighbor, state.ships);
      if (shipAtPos) {
        // Can't move through friendly ships
        if (shipAtPos.ownerId === ship.ownerId) {
          continue;
        }
        // Enemy ship: can attack but not move through
        // Mark as reachable but don't continue path
        visited.add(key);
        reachable.set(key, [...current.path, neighbor]);
        continue;
      }
      
      visited.add(key);
      queue.push({
        position: neighbor,
        distance: current.distance + 1,
        path: [...current.path, neighbor],
      });
    }
  }
  
  return reachable;
}

/**
 * Check if a move from one position to another is valid
 */
export function isValidMove(
  ship: Ship,
  from: Position,
  to: Position,
  state: GameState,
  allowDiagonal: boolean = false
): boolean {
  const tempShip = { ...ship, position: from };
  const reachable = findReachablePositions(tempShip, state, allowDiagonal);
  return reachable.has(positionKey(to));
}

/**
 * Get the path for a valid move
 */
export function getMovePath(
  ship: Ship,
  to: Position,
  state: GameState,
  allowDiagonal: boolean = false
): Position[] | null {
  if (!ship.position) {
    return null;
  }
  
  const reachable = findReachablePositions(ship, state, allowDiagonal);
  return reachable.get(positionKey(to)) ?? null;
}
