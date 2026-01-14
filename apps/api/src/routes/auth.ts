/**
 * Auth Routes
 * 
 * User registration and authentication
 */

import { Hono } from 'hono';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { generateToken } from '../middleware/auth.js';

const auth = new Hono();

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const RegisterSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /auth/register
 * Create a new user account
 */
auth.post('/register', async (c) => {
  const body = await c.req.json();
  const parsed = RegisterSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.issues }, 400);
  }
  
  const { username, email, password } = parsed.data;
  
  try {
    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return c.json({ error: 'Email already registered' }, 409);
      }
      return c.json({ error: 'Username already taken' }, 409);
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const userId = `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    
    const user = new User({
      _id: userId,
      username,
      email,
      passwordHash,
    });
    
    await user.save();
    
    // Generate token
    const token = generateToken({ userId, username });
    
    return c.json({
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        username,
        email,
      },
    }, 201);
    
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

/**
 * POST /auth/login
 * Authenticate user
 */
auth.post('/login', async (c) => {
  const body = await c.req.json();
  const parsed = LoginSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.issues }, 400);
  }
  
  const { email, password } = parsed.data;
  
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!validPassword) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    const token = generateToken({ 
      userId: user._id, 
      username: user.username,
    });
    
    return c.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        stats: user.stats,
        preferences: user.preferences,
      },
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

/**
 * GET /auth/me
 * Get current user profile (requires auth)
 */
auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Not authenticated' }, 401);
  }
  
  // Import jwt and verify inline to avoid circular deps
  const jwt = await import('jsonwebtoken');
  const token = authHeader.slice(7);
  
  try {
    const payload = jwt.default.verify(
      token, 
      process.env.JWT_SECRET || 'quantum-dev-secret-change-in-production'
    ) as { userId: string };
    
    const user = await User.findById(payload.userId);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        stats: user.stats,
        preferences: user.preferences,
      },
    });
    
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

export default auth;
