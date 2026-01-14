/**
 * MongoDB Models
 * 
 * Mongoose schemas for Users and Games
 */

import mongoose, { Schema, Document } from 'mongoose';
import type { 
  UserDocument, 
  GameDocument, 
  GameState, 
  UserStats, 
  UserPreferences,
  GameStatus,
} from '@quantum/types';

// =============================================================================
// USER MODEL
// =============================================================================

const UserStatsSchema = new Schema<UserStats>({
  gamesPlayed: { type: Number, default: 0 },
  gamesWon: { type: Number, default: 0 },
  gamesByFaction: { type: Map, of: Object, default: {} },
  gamesByMap: { type: Map, of: Object, default: {} },
  totalCubesPlaced: { type: Number, default: 0 },
  totalShipsDestroyed: { type: Number, default: 0 },
  totalDominanceGained: { type: Number, default: 0 },
}, { _id: false });

const UserPreferencesSchema = new Schema<UserPreferences>({
  defaultFaction: { type: String, default: null },
  soundEnabled: { type: Boolean, default: true },
  animationsEnabled: { type: Boolean, default: true },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
}, { _id: false });

const UserSchema = new Schema<UserDocument>({
  _id: { type: String, required: true },
  username: { type: String, required: true, unique: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  stats: { type: UserStatsSchema, default: () => ({}) },
  preferences: { type: UserPreferencesSchema, default: () => ({}) },
}, { 
  timestamps: true,
  _id: false,
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

export const User = mongoose.model<UserDocument>('User', UserSchema);

// =============================================================================
// GAME MODEL
// =============================================================================

// We store the full game state as a nested document
// This allows atomic updates and easy retrieval
const GameSchema = new Schema<GameDocument>({
  _id: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['lobby', 'setup', 'in_progress', 'finished', 'abandoned'],
    default: 'lobby',
  },
  mapConfigId: { type: String, required: true },
  finishedAt: { type: Date, default: null },
  winnerId: { type: String, default: null },
  playerIds: [{ type: String }],
  playerFactions: { type: Map, of: String },
  state: { type: Schema.Types.Mixed, required: true },
}, {
  timestamps: true,
  _id: false,
});

// Indexes for common queries
GameSchema.index({ status: 1 });
GameSchema.index({ playerIds: 1 });
GameSchema.index({ 'state.currentPlayerId': 1 });
GameSchema.index({ createdAt: -1 });

export const Game = mongoose.model<GameDocument>('Game', GameSchema);

// =============================================================================
// CONNECTION
// =============================================================================

export async function connectDatabase(uri: string): Promise<void> {
  try {
    await mongoose.connect(uri);
    console.log('📦 Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log('📦 Disconnected from MongoDB');
}
