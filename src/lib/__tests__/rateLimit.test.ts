import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, getClientId } from '../rateLimit';

describe('rateLimit', () => {
  it('allows requests within limit', () => {
    const id = `test-${Date.now()}`;
    const result = rateLimit(id, { limit: 3, windowSeconds: 60 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('blocks request when limit exceeded', () => {
    const id = `test-exceed-${Date.now()}`;
    rateLimit(id, { limit: 2, windowSeconds: 60 });
    rateLimit(id, { limit: 2, windowSeconds: 60 });
    const result = rateLimit(id, { limit: 2, windowSeconds: 60 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('returns a future resetTime', () => {
    const id = `test-time-${Date.now()}`;
    const before = Date.now();
    const result = rateLimit(id, { limit: 10, windowSeconds: 60 });
    expect(result.resetTime).toBeGreaterThan(before);
  });
});

describe('getClientId', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientId(req)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '9.9.9.9' },
    });
    expect(getClientId(req)).toBe('9.9.9.9');
  });

  it('returns anonymous when no IP headers present', () => {
    const req = new Request('http://localhost');
    expect(getClientId(req)).toBe('anonymous');
  });
});
