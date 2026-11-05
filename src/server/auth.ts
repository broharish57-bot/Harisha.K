import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';

const JWT_SECRET = process.env.SESSION_SECRET || 'ruralcare-production-secret-token-2026-secure';

export interface UserSession {
  id: string;
  phone: string;
  email?: string;
  full_name: string;
  role: 'patient' | 'doctor' | 'health_worker' | 'admin' | 'doctor_admin';
  preferred_language: 'kn' | 'hi' | 'en';
  village_or_town: string;
  district: string;
  state: string;
  is_verified: boolean;
  emergency_contact_phone?: string;
  doctor_details?: any;
  health_worker_details?: any;
}

export function createAuthToken(user: UserSession): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    phone: user.phone,
    role: user.role,
    name: user.full_name,
    lang: user.preferred_language,
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
  })).toString('base64url');
  
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifyAuthToken(token: string): { sub: string; role: string; phone: string; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return decoded;
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: UserSession;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.substring(7).trim();
  const decoded = verifyAuthToken(token);
  if (!decoded) {
    return next();
  }

  try {
    const user = db.prepare('SELECT id, email, phone, full_name, role, preferred_language, village_or_town, district, state, is_verified FROM profiles WHERE id = ?').get(decoded.sub) as UserSession | undefined;
    if (user) {
      req.user = {
        ...user,
        is_verified: Boolean(user.is_verified)
      };
    }
  } catch (err) {
    console.error('Auth lookup error:', err);
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

export function requireRole(allowedRoles: Array<'patient' | 'doctor' | 'health_worker' | 'admin' | 'doctor_admin'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    // Doctor Admin has dual authority for all doctor, admin, and clinical tasks
    if (req.user.role === 'doctor_admin') {
      if (allowedRoles.includes('doctor') || allowedRoles.includes('admin') || allowedRoles.includes('doctor_admin')) {
        return next();
      }
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Requires one of: ${allowedRoles.join(', ')}` });
    }
    next();
  };
}
