import { describe, expect, it } from 'vitest';

import { parseApiBaseUrl } from '../config';

describe('parseApiBaseUrl', () => {
  it('returns the configured API base URL when provided', () => {
    expect(parseApiBaseUrl('http://localhost:4000')).toBe('http://localhost:4000');
  });

  it('falls back to the local backend default when no API base URL is provided', () => {
    expect(parseApiBaseUrl()).toBe('http://127.0.0.1:4000');
  });

  it('trims whitespace from the configured API base URL', () => {
    expect(parseApiBaseUrl('  http://127.0.0.1:5000/api  ')).toBe('http://127.0.0.1:5000/api');
  });
});
