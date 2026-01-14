/**
 * Dice Utilities
 * 
 * Random number generation for ship reconfiguration and combat.
 * Provides both random and seedable implementations for testing/replay.
 */

import { ShipType } from '@quantum/types';

/**
 * Roll a single die (1-6)
 */
export function rollDie(): ShipType {
  return (Math.floor(Math.random() * 6) + 1) as ShipType;
}

/**
 * Roll a die ensuring it's different from the current value
 * Used for Reconfigure action
 */
export function rollDifferent(currentValue: ShipType): ShipType {
  let newValue: ShipType;
  do {
    newValue = rollDie();
  } while (newValue === currentValue);
  return newValue;
}

/**
 * Seeded random number generator for deterministic replays
 * Uses a simple LCG (Linear Congruential Generator)
 */
export class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  /**
   * Generate next random number (0-1)
   */
  next(): number {
    // LCG parameters (same as MINSTD)
    this.seed = (this.seed * 48271) % 2147483647;
    return this.seed / 2147483647;
  }
  
  /**
   * Roll a die (1-6)
   */
  rollDie(): ShipType {
    return (Math.floor(this.next() * 6) + 1) as ShipType;
  }
  
  /**
   * Roll a die ensuring different value
   */
  rollDifferent(currentValue: ShipType): ShipType {
    let newValue: ShipType;
    do {
      newValue = this.rollDie();
    } while (newValue === currentValue);
    return newValue;
  }
  
  /**
   * Shuffle an array in place
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  /**
   * Get current seed state (for saving/restoring)
   */
  getSeed(): number {
    return this.seed;
  }
}

/**
 * Shuffle an array (Fisher-Yates)
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Combat roll result
 */
export interface CombatRolls {
  attackerRoll: number;
  defenderRoll: number;
}

/**
 * Roll combat dice for attacker and defender
 */
export function rollCombat(): CombatRolls {
  return {
    attackerRoll: rollDie(),
    defenderRoll: rollDie(),
  };
}

/**
 * Calculate combat totals
 * Lower total wins, attacker wins ties
 */
export function calculateCombatResult(
  attackerShipValue: ShipType,
  defenderShipValue: ShipType,
  attackerRoll: number,
  defenderRoll: number
): { winner: 'attacker' | 'defender'; attackerTotal: number; defenderTotal: number } {
  const attackerTotal = attackerShipValue + attackerRoll;
  const defenderTotal = defenderShipValue + defenderRoll;
  
  // Lower total wins, attacker wins ties
  const winner = attackerTotal <= defenderTotal ? 'attacker' : 'defender';
  
  return { winner, attackerTotal, defenderTotal };
}
