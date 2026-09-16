import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { colors, radius } from "../theme";
import { getApiUrl } from "../lib/api";
import type { Photo } from "../types";

export function PhotoGrid({
  label,
  photos,
  empty = "No photos yet.",
}: {
  label: string;
  photos: Photo[];
  empty?: string;
}) {
  const [active, setActive] = useState<Photo | null>(null);
  const [base, setBase] = useState<string | null>(null);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getApiUrl().then(setBase);
  }, []);

  function resolveUrl(url: string) {
    if (!url) return url;
    if (!base) return url;
    try {
      if (url.startsWith("/")) return `${base}${url}`;
      const parsed = new URL(url);
      const api = new URL(base);
      // Always load media from the API host the app is talking to.
      return `${api.origin}${parsed.pathname}${parsed.search}`;
    } catch {
      return url;
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {photos.length === 0 ? (
        <Text style={styles.empty}>{empty}</Text>
      ) : (
        <View style={styles.grid}>
          {photos.map((photo) => {
            const uri = resolveUrl(photo.url);
            const broken = failed[photo.id];
            return (
              <Pressable key={photo.id} onPress={() => !broken && setActive(photo)} style={styles.thumbWrap}>
                {broken ? (
                  <View style={[styles.thumb, styles.fallback]}>
                    <Text style={styles.fallbackText}>Photo</Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri }}
                    style={styles.thumb}
                    onError={() => setFailed((prev) => ({ ...prev, [photo.id]: true }))}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
      <Modal visible={Boolean(active)} transparent animationType="fade" onRequestClose={() => setActive(null)}>
        <Pressable style={styles.lightbox} onPress={() => setActive(null)}>
          {active ? (
            <Image source={{ uri: resolveUrl(active.url) }} style={styles.full} resizeMode="contain" />
          ) : null}
          {active?.label ? <Text style={styles.caption}>{active.label}</Text> : null}
          <Text style={styles.captionHint}>Tap to close</Text>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10 },
  label: { fontWeight: "700", marginBottom: 6, color: colors.ink },
  empty: { color: colors.muted },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  thumbWrap: { borderRadius: radius.sm, overflow: "hidden" },
  thumb: { width: 96, height: 96, borderRadius: radius.sm, backgroundColor: colors.line },
  fallback: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line },
  fallbackText: { color: colors.muted, fontWeight: "700", fontSize: 12 },
  lightbox: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  full: { width: "100%", height: "70%" },
  caption: { color: colors.white, marginTop: 12, fontWeight: "600" },
  captionHint: { color: "rgba(255,255,255,0.7)", marginTop: 6, fontSize: 12 },
});
