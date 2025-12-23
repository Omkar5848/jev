import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { NextApiResponse } from 'next';

export async function hashPassword(pw: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}
export async function comparePassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function signToken(payload: object) {
  const secret = process.env.JWT_SECRET || 'devsecret';
  return jwt.sign(payload, secret, { expiresIn: '1d' });
}

export function setAuthCookie(res: NextApiResponse, token: string) {
  const cookie = serialize('jeevak_token', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24
  });
  res.setHeader('Set-Cookie', cookie);
}


export function saveAuth({ token, role, displayName }: { token: string; role: string; displayName?: string }) {
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
  if (displayName) localStorage.setItem('displayName', displayName);
}

export function logoutAndRedirect() {
  localStorage.clear();
  if (typeof window !== 'undefined') window.location.href = '/login';
}