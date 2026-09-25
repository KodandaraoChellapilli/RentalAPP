import Constants from "expo-constants";
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

function lanHost() {
  const hostUri = Constants.expoConfig?.hostUri || Constants.linkingUri || "";
  const host = hostUri.replace(/^[a-z]+:\/\//i, "").split("/")[0]?.split(":")[0];
  if (host && host !== "localhost" && host !== "127.0.0.1") return host;
  return null;
}

function isLocalOrLanHost(host: string) {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "10.0.2.2" ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

function reachableOrigin(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" && isLocalOrLanHost(parsed.hostname)) {
      parsed.protocol = "http:";
    }
    return parsed.origin;
  } catch {
    return url.replace(/\/$/, "");
  }
}

export function defaultApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return reachableOrigin(process.env.EXPO_PUBLIC_API_URL);
  if (!__DEV__) {
    throw new Error("Set EXPO_PUBLIC_API_URL before building the production app.");
  }
  const host = lanHost();
  if (host) return `http://${host}:3001`;
  if (Platform.OS === "android") return "http://10.0.2.2:3001";
  return "http://localhost:3001";
}

export async function getApiUrl() {
  const stored = await getItem(API_KEY);
  const fallback = defaultApiUrl();
  if (!stored) return fallback;
  try {
    const host = new URL(stored).hostname;
    if ((host === "localhost" || host === "127.0.0.1") && Platform.OS !== "web") {
      const lan = lanHost();
      if (lan) return `http://${lan}:3001`;
      if (Platform.OS === "android") return "http://10.0.2.2:3001";
    }
  } catch {
    return fallback;
  }
  return reachableOrigin(stored);
}

export function resolveMediaUrl(url: string | null | undefined, origin = defaultApiUrl()) {
  if (!url) return "";
  if (url.startsWith("file:") || url.startsWith("content:") || url.startsWith("data:") || url.startsWith("ph://")) {
    return url;
  }
  const base = reachableOrigin(origin);
  try {
    if (url.startsWith("/")) return `${base}${url}`;
    const parsed = new URL(url);
    return `${base}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
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
