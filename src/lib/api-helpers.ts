import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import mongoose from 'mongoose';

// ─── Response helpers ────────────────────────────────────────────────────────

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function notFound(resource = 'Resource') {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 });
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function validationError(details: unknown) {
  return NextResponse.json({ error: 'Invalid input', details }, { status: 422 });
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the current authenticated user's session or null.
 */
export async function getSession() {
  return auth();
}

/**
 * Asserts that a valid session exists and returns the user.
 * Throws (returns a 401 response object) if not authenticated.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

/**
 * Asserts that the current user has admin role.
 * Returns null if not admin.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.role !== 'admin') return null;
  return session.user;
}

// ─── ObjectId helpers ─────────────────────────────────────────────────────────

export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export function toObjectId(id: string) {
  return new mongoose.Types.ObjectId(id);
}

// ─── Error normaliser ─────────────────────────────────────────────────────────

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}
