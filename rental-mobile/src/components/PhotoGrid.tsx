import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../theme";
import { RemoteImage } from "./RemoteImage";
import type { Photo } from "../types";
import { photoUri } from "../lib/photos";

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

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {photos.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="image-outline" size={20} color={colors.placeholder} />
          <Text style={styles.empty}>{empty}</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {photos.map((photo) => (
            <Pressable key={photo.id} onPress={() => setActive(photo)} style={styles.thumbWrap}>
              <RemoteImage uri={photoUri(photo)} style={styles.thumb} accessibilityLabel={photo.label || "Equipment photo"} />
            </Pressable>
          ))}
        </View>
      )}
      <Modal visible={Boolean(active)} transparent animationType="fade" onRequestClose={() => setActive(null)}>
        <Pressable style={styles.lightbox} onPress={() => setActive(null)}>
          {active ? (
            <RemoteImage uri={photoUri(active)} style={styles.full} resizeMode="contain" accessibilityLabel={active.label} />
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
  empty: { color: colors.muted, flex: 1 },
  emptyBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#efeae2",
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  thumbWrap: { borderRadius: radius.sm, overflow: "hidden" },
  thumb: { width: 96, height: 96, borderRadius: radius.sm, backgroundColor: colors.line },
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
