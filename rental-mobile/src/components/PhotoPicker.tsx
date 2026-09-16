import { useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors, radius } from "../theme";
import type { LocalPhoto } from "../types";
import { Button } from "./ui";
import { tapFeedback } from "../lib/haptics";

export function PhotoPicker({
  photos,
  onChange,
  requiredLabel,
  minCount = 1,
}: {
  photos: LocalPhoto[];
  onChange: (photos: LocalPhoto[]) => void;
  requiredLabel: string;
  minCount?: number;
}) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<LocalPhoto | null>(null);
  const met = photos.length >= minCount;

  async function add(fromCamera: boolean, replaceLast = false) {
    setBusy(true);
    try {
      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          fromCamera
            ? "Camera access is required to take condition photos."
            : "Photo library access is required to upload photos.",
        );
        return;
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({
            quality: 0.7,
            allowsMultipleSelection: true,
            selectionLimit: 8,
          });
      if (result.canceled) return;
      const next = result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || `photo-${Date.now()}-${index}.jpg`,
        type: asset.mimeType || "image/jpeg",
      }));
      tapFeedback();
      if (replaceLast && photos.length > 0) {
        onChange([...photos.slice(0, -1), ...next]);
        return;
      }
      onChange([...photos, ...next]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View>
      <Text style={[styles.required, met && { color: colors.success }]}>
        {met
          ? `${photos.length} photo${photos.length === 1 ? "" : "s"} ready`
          : `Required: ${requiredLabel}`}
      </Text>
      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <Button label="Take photo" onPress={() => add(true)} pending={busy} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="From library" variant="ghost" onPress={() => add(false)} pending={busy} />
        </View>
      </View>
      {photos.length > 0 ? (
        <ScrollView
          horizontal
          nestedScrollEnabled
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.preview}
        >
          {photos.map((photo, index) => (
            <View key={`${photo.uri}-${index}`} style={styles.thumbWrap}>
              <Pressable onPress={() => setPreview(photo)}>
                <Image source={{ uri: photo.uri }} style={styles.thumb} />
              </Pressable>
              <View style={styles.thumbActions}>
                {index === photos.length - 1 ? (
                  <Pressable onPress={() => add(true, true)} hitSlop={6}>
                    <Text style={styles.retake}>Retake</Text>
                  </Pressable>
                ) : (
                  <View />
                )}
                <Pressable onPress={() => onChange(photos.filter((_, i) => i !== index))} hitSlop={6}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : null}
      <Modal visible={Boolean(preview)} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={styles.lightbox} onPress={() => setPreview(null)}>
          {preview ? <Image source={{ uri: preview.uri }} style={styles.full} resizeMode="contain" /> : null}
          <Text style={styles.caption}>Tap anywhere to close</Text>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  required: { fontWeight: "700", color: colors.accent, marginBottom: 10 },
  actions: { flexDirection: "row", gap: 8, marginBottom: 12 },
  preview: { gap: 10, paddingVertical: 4 },
  thumbWrap: { width: 128 },
  thumb: { width: 128, height: 128, borderRadius: radius.md, backgroundColor: colors.line },
  thumbActions: { marginTop: 6, flexDirection: "row", justifyContent: "space-between" },
  retake: { color: colors.ink, fontWeight: "700", fontSize: 12 },
  remove: { color: colors.danger, fontWeight: "700", fontSize: 12 },
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
