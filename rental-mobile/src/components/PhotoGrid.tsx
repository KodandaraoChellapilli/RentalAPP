import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { colors, radius } from "../theme";
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

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {photos.length === 0 ? (
        <Text style={styles.empty}>{empty}</Text>
      ) : (
        <View style={styles.grid}>
          {photos.map((photo) => (
            <Pressable key={photo.id} onPress={() => setActive(photo)}>
              <Image source={{ uri: photo.url }} style={styles.thumb} />
            </Pressable>
          ))}
        </View>
      )}
      <Modal visible={Boolean(active)} transparent animationType="fade" onRequestClose={() => setActive(null)}>
        <Pressable style={styles.lightbox} onPress={() => setActive(null)}>
          {active ? <Image source={{ uri: active.url }} style={styles.full} resizeMode="contain" /> : null}
          {active?.label ? <Text style={styles.caption}>{active.label}</Text> : null}
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
});
