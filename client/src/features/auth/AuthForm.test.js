import { describe, expect, it } from 'vitest';
import { validateAuthForm } from './AuthForm';

describe('validateAuthForm', () => {
  it('needs name and an 8+ character password to register', () => {
    const errors = validateAuthForm({ name: ' ', email: 'a@b.co', password: 'short' }, 'register');
    expect(Object.keys(errors).sort()).toEqual(['name', 'password']);
  });

  it('only checks presence of password on login', () => {
    expect(validateAuthForm({ name: '', email: 'a@b.co', password: 'x' }, 'login')).toEqual({});
  });

  it('rejects malformed emails', () => {
    expect(validateAuthForm({ name: '', email: 'not-an-email', password: 'x' }, 'login')).toHaveProperty('email');
  });
});
