/** Client-side validation helpers (the server re-validates everything). */

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

/**
 * Scores a password 0-4 for the strength meter on the register screen.
 * +1 for each: length >= 8, mixed case, contains a digit, contains a symbol.
 */
export function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Too weak', 'Weak', 'Okay', 'Strong', 'Excellent'];
  return { score, label: pw ? labels[score] : '' };
}

/** Mirrors the backend rule: >= 6 chars with at least one letter and one number. */
export function passwordError(pw: string): string | undefined {
  if (pw.length < 6) return 'Password must be at least 6 characters';
  if (!/[A-Za-z]/.test(pw)) return 'Password must contain a letter';
  if (!/\d/.test(pw)) return 'Password must contain a number';
  return undefined;
}
