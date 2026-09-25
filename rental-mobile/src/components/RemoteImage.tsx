import { Image, StyleSheet, View, type ImageStyle, type StyleProp } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { defaultApiUrl, getApiUrl, resolveMediaUrl } from "../lib/api";

export function RemoteImage({
  uri,
  style,
  accessibilityLabel,
  resizeMode = "cover",
}: {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
  resizeMode?: "cover" | "contain";
}) {
  const [origin, setOrigin] = useState(defaultApiUrl());
  const [failed, setFailed] = useState(false);
  const resolved = useMemo(() => resolveMediaUrl(uri, origin), [uri, origin]);

  useEffect(() => {
    let active = true;
    getApiUrl().then((next) => {
      if (active) setOrigin(next);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (!resolved || failed) {
    return (
      <View style={[styles.fallback, style]}>
        <Ionicons name="image-outline" size={22} color={colors.placeholder} />
      </View>
    );
  }

  return (
    <Image
      key={resolved}
      source={{ uri: resolved }}
      style={style}
      resizeMode={resizeMode}
      accessibilityLabel={accessibilityLabel}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#efeae2",
  },
});
