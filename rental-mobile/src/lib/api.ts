import { Platform } from "react-native";
import { getItem, removeItem, setItem } from "./storage";

const TOKEN_KEY = "rental_token";
const API_KEY = "rental_api_url";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export function defaultApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  if (Platform.OS === "android") return "http://10.0.2.2:3001";
  return "http://localhost:3001";
}

export async function getApiUrl() {
  return (await getItem(API_KEY)) || defaultApiUrl();
}

export async function setApiUrl(url: string) {
  await setItem(API_KEY, url.replace(/\/$/, ""));
}

export async function getToken() {
  return getItem(TOKEN_KEY);
}

export async function setToken(token: string | null) {
  if (token) await setItem(TOKEN_KEY, token);
  else await removeItem(TOKEN_KEY);
}

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const base = await getApiUrl();
  const headers = new Headers(opts.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (opts.body && !(opts.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { ...opts, headers });
  } catch {
    throw new ApiError("Can't reach the yard server. Check Wi-Fi and try again.", 0);
  }
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new ApiError(data.error || "Request failed.", response.status);
  return data as T;
}

export function appendPhotos(form: FormData, photos: Array<{ uri: string; name: string; type: string }>) {
  photos.forEach((photo, index) => {
    form.append("photos", {
      uri: photo.uri,
      name: photo.name || `photo-${index}.jpg`,
      type: photo.type || "image/jpeg",
    } as unknown as Blob);
  });
}
