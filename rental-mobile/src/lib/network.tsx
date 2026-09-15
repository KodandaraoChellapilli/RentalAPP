import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppState, Platform } from "react-native";
import { getApiUrl } from "./api";

type NetworkState = {
  online: boolean;
  checking: boolean;
  lastCheckedAt: number | null;
  refresh: () => Promise<void>;
};

const NetworkContext = createContext<NetworkState | null>(null);

async function probe(): Promise<boolean> {
  if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.onLine === false) {
    return false;
  }
  try {
    const base = await getApiUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(`${base}/api/health`, { method: "GET", signal: controller.signal });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);
  const [checking, setChecking] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setChecking(true);
    const ok = await probe();
    setOnline(ok);
    setLastCheckedAt(Date.now());
    setChecking(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });

    let removeWeb: (() => void) | undefined;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const onOnline = () => refresh();
      const onOffline = () => setOnline(false);
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      removeWeb = () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    }

    return () => {
      clearInterval(interval);
      sub.remove();
      removeWeb?.();
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ online, checking, lastCheckedAt, refresh }),
    [online, checking, lastCheckedAt, refresh],
  );

  return createElement(NetworkContext.Provider, { value }, children);
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used inside NetworkProvider");
  return ctx;
}
