import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { OfflineBanner } from "../src/components/OfflineBanner";
import { ApiError, defaultApiUrl, getApiUrl, setApiUrl } from "../src/lib/api";
import { useAuth } from "../src/lib/auth";
import { homeFor } from "../src/lib/format";

const heroImage = require("../assets/login-hero.jpg");

export default function LoginScreen() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [server, setServer] = useState(defaultApiUrl());
  const [showServer, setShowServer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const taps = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getApiUrl().then(setServer);
  }, []);

  if (!loading && user) return <Redirect href={homeFor(user.role) as "/(owner)/dashboard"} />;

  function revealServer() {
    taps.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      taps.current = 0;
    }, 1200);
    if (taps.current >= 5) {
      taps.current = 0;
      setShowServer((value) => !value);
    }
  }

  async function onSubmit() {
    setError(null);
    setPending(true);
    try {
      await setApiUrl(server.trim() || defaultApiUrl());
      const next = await login(email.trim(), password);
      router.replace(homeFor(next.role) as "/(owner)/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Can't reach the yard server. Check Wi-Fi and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  const canSubmit = Boolean(email.trim() && password);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0a1f14", "#07140e", "#050a08"]} style={StyleSheet.absoluteFill} />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <OfflineBanner />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.card}>
              <View style={styles.heroWrap}>
                <Image source={heroImage} style={styles.hero} resizeMode="cover" />
                <LinearGradient
                  colors={["transparent", "rgba(8,18,12,0.85)"]}
                  style={styles.heroFade}
                />
                <Pressable onPress={revealServer} style={styles.brandOnHero} accessibilityRole="header">
                  <Text style={styles.brand}>Ridgeline Rentals</Text>
                </Pressable>
              </View>

              <View style={styles.form}>
                <Text style={styles.heading}>Log In</Text>

                <Text style={styles.label}>Email address</Text>
                <View style={styles.inputShell}>
                  <Ionicons name="mail-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    placeholder="Enter your email"
                    placeholderTextColor="#6b7280"
                    style={styles.input}
                  />
                </View>

                <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
                <View style={styles.inputShell}>
                  <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={onSubmit}
                    placeholder="Enter your password"
                    placeholderTextColor="#6b7280"
                    style={[styles.input, styles.inputWithTrailing]}
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={10}
                    style={styles.eyeBtn}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#9ca3af"
                    />
                  </Pressable>
                </View>

                {showServer ? (
                  <>
                    <Text style={[styles.label, { marginTop: 16 }]}>API server</Text>
                    <View style={styles.inputShell}>
                      <Ionicons name="server-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        value={server}
                        onChangeText={setServer}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholderTextColor="#6b7280"
                        style={styles.input}
                      />
                    </View>
                  </>
                ) : null}

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <Pressable
                  onPress={onSubmit}
                  disabled={!canSubmit || pending}
                  style={({ pressed }) => [
                    styles.signInPress,
                    (!canSubmit || pending) && styles.signInDisabled,
                    pressed && canSubmit && !pending && { opacity: 0.92 },
                  ]}
                  accessibilityRole="button"
                >
                  <LinearGradient
                    colors={["#22c55e", "#4ade80", "#86efac"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.signInGradient}
                  >
                    {pending ? (
                      <ActivityIndicator color="#052e16" />
                    ) : (
                      <Text style={styles.signInLabel}>Sign In</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050a08" },
  safe: { flex: 1 },
  flex: { flex: 1 },
  glowTop: {
    position: "absolute",
    top: -80,
    left: -40,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: "rgba(34, 197, 94, 0.18)",
  },
  glowBottom: {
    position: "absolute",
    bottom: 40,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(74, 222, 128, 0.1)",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  card: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  heroWrap: {
    height: 180,
    backgroundColor: "#111",
  },
  hero: {
    width: "100%",
    height: "100%",
  },
  heroFade: {
    ...StyleSheet.absoluteFill,
  },
  brandOnHero: {
    position: "absolute",
    left: 18,
    bottom: 14,
  },
  brand: {
    color: "#bbf7d0",
    fontWeight: "700",
    letterSpacing: 2.4,
    textTransform: "uppercase",
    fontSize: 12,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 24,
  },
  heading: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  label: {
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    color: "#ffffff",
    fontSize: 15,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
  },
  inputWithTrailing: { paddingRight: 8 },
  eyeBtn: { padding: 4 },
  errorBox: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: "rgba(185, 28, 28, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.35)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  signInPress: {
    marginTop: 22,
    borderRadius: 999,
    overflow: "hidden",
  },
  signInDisabled: { opacity: 0.45 },
  signInGradient: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  signInLabel: {
    color: "#052e16",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
