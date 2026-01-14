/**
 * Authentication Middleware
 */

import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'quantum-dev-secret-change-in-production';

export interface JWTPayload {
  userId: string;
  username: string;
}

/**
 * Middleware to verify JWT token
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authorization header required' }, 401);
  }
  
  const token = authHeader.slice(7);
  
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}

/**
 * Optional auth - sets user if token present, continues otherwise
 */
export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      c.set('user', payload);
    } catch {
      // Invalid token, continue without user
    }
  }
  
  await next();
}

/**
 * Generate JWT token
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Get user from context (after auth middleware)
 */
export function getUser(c: Context): JWTPayload | undefined {
  return c.get('user') as JWTPayload | undefined;
}
