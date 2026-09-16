import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { friendlyError } from "../lib/errors";

/**
 * Loads data when a screen gains focus and supports pull-to-refresh.
 * Keeps the same loading/error/refresh pattern across list screens.
 */
export function useFocusedLoad<T>(fetcher: () => Promise<T>, fallbackMessage: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setData(await fetcher());
      setError(null);
    } catch (err) {
      setError(friendlyError(err, fallbackMessage));
    } finally {
      setRefreshing(false);
    }
  }, [fetcher, fallbackMessage]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const initialLoading = data === null && !error && refreshing;

  return { data, error, refreshing, load, setData, initialLoading };
}
