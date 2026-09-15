import { ApiError } from "./api";

export function friendlyError(err: unknown, fallback: string) {
  if (err instanceof ApiError) {
    if (err.status === 0) {
      return "Can't reach the yard server. Check Wi-Fi and try again.";
    }
    return err.message;
  }
  return fallback;
}

export function isOfflineError(err: unknown) {
  return err instanceof ApiError && err.status === 0;
}
