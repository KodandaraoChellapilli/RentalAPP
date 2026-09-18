const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Client-side login checks — returns a user-facing message, or null if ok. */
export function validateLoginForm(emailRaw: string, password: string): string | null {
  const email = emailRaw.trim();
  const hasEmail = email.length > 0;
  const hasPassword = password.length > 0;

  if (!hasEmail && !hasPassword) return "Please enter your email and password.";
  if (!hasEmail) return "Please enter your email.";
  if (!hasPassword) return "Please enter your password.";
  if (!EMAIL_RE.test(email)) return "Please enter a valid email address.";
  return null;
}
