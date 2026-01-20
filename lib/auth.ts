// lib/auth.ts
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface DecodedToken {
  id: string;
  email: string;
  role: string;
}

export function verifyToken(request: NextRequest): DecodedToken | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function generateToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '90d' });
}