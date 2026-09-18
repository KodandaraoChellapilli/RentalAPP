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
import { Redirect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { OfflineBanner } from "../src/components/OfflineBanner";
import { ApiError, defaultApiUrl, getApiUrl, setApiUrl } from "../src/lib/api";
import { useAuth } from "../src/lib/auth";
import { homeFor } from "../src/lib/format";
import { validateLoginForm } from "../src/lib/loginValidation";

const heroImage = require("../assets/login-hero.png");

const navy = "#0b1c33";
const navyDeep = "#071422";
const amber = "#f5b301";

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
    if (pending) return;

    const validationError = validateLoginForm(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

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

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
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
            <View style={styles.heroFrame}>
              <Image source={heroImage} style={styles.hero} resizeMode="cover" />
              <View style={styles.heroFade} />
            </View>

            <View style={styles.form}>
              <Pressable onPress={revealServer} style={styles.brandWrap} accessibilityRole="header">
                <Text style={styles.brand}>West Ridge Rentals</Text>
              </Pressable>

              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (error) setError(null);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                placeholder="Enter your email"
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />

              <Text style={[styles.label, styles.labelSpaced]}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (error) setError(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={onSubmit}
                  placeholder="Enter your password"
                  placeholderTextColor="#94a3b8"
                  style={[styles.input, styles.passwordInput]}
                />
                <Pressable
                  onPress={() => setShowPassword((value) => !value)}
                  style={styles.showBtn}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  <Text style={styles.showBtnText}>{showPassword ? "Hide" : "Show"}</Text>
                </Pressable>
              </View>

              {showServer ? (
                <>
                  <Text style={[styles.label, styles.labelSpaced]}>API server</Text>
                  <TextInput
                    value={server}
                    onChangeText={setServer}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor="#94a3b8"
                    style={styles.input}
                  />
                </>
              ) : null}

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={onSubmit}
                disabled={pending}
                style={({ pressed }) => [
                  styles.signIn,
                  pending && styles.signInDisabled,
                  pressed && !pending && { opacity: 0.92 },
                ]}
                accessibilityRole="button"
              >
                {pending ? (
                  <ActivityIndicator color={navyDeep} />
                ) : (
                  <Text style={styles.signInLabel}>Sign In</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: navyDeep },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  heroFrame: {
    height: 220,
    backgroundColor: navy,
    borderBottomWidth: 4,
    borderBottomColor: amber,
    overflow: "hidden",
  },
  hero: {
    width: "100%",
    height: "100%",
  },
  heroFade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(7, 20, 34, 0.2)",
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 28,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
  },
  brandWrap: {
    alignItems: "center",
    marginBottom: 32,
  },
  brand: {
    color: amber,
    fontWeight: "800",
    letterSpacing: 2.8,
    textTransform: "uppercase",
    fontSize: 13,
  },
  label: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  labelSpaced: { marginTop: 16 },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    minHeight: 52,
    paddingHorizontal: 14,
    fontSize: 16,
    color: navyDeep,
  },
  passwordRow: { position: "relative", justifyContent: "center" },
  passwordInput: { paddingRight: 64 },
  showBtn: {
    position: "absolute",
    right: 12,
    height: 52,
    justifyContent: "center",
  },
  showBtnText: {
    color: navy,
    fontWeight: "700",
    fontSize: 13,
  },
  errorBox: {
    marginTop: 14,
    backgroundColor: "#450a0a",
    borderWidth: 1,
    borderColor: "#f87171",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  signIn: {
    marginTop: 24,
    minHeight: 54,
    backgroundColor: amber,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  signInDisabled: { opacity: 0.45 },
  signInLabel: {
    color: navyDeep,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
