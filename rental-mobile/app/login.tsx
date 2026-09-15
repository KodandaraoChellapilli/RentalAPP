import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ErrorText } from "../src/components/ui";
import { Field } from "../src/components/Field";
import { OfflineBanner } from "../src/components/OfflineBanner";
import { ApiError, defaultApiUrl, getApiUrl, setApiUrl } from "../src/lib/api";
import { useAuth } from "../src/lib/auth";
import { homeFor } from "../src/lib/format";
import { colors } from "../src/theme";

export default function LoginScreen() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  return (
    <SafeAreaView style={styles.safe}>
      <OfflineBanner />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "center" }}
      >
        <Pressable onPress={revealServer}>
          <Text style={styles.kicker}>Ridgeline Rentals</Text>
        </Pressable>
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>
          Same accounts as the website. Employees can clock in and photograph equipment from the yard.
        </Text>
        <ErrorText message={error} />
        <Field
          dark
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Field
          dark
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />
        {showServer ? (
          <>
            <Field dark label="API server" value={server} onChangeText={setServer} autoCapitalize="none" />
            <Text style={styles.hint}>
              Phone on Wi-Fi: use your computer’s LAN address, for example http://192.168.1.20:3001. Simulator:
              localhost is fine.
            </Text>
          </>
        ) : (
          <View style={{ height: 8 }} />
        )}
        <Button label="Sign in" onPress={onSubmit} pending={pending} disabled={!email || !password} />
        <View style={{ height: 16 }} />
        <Text style={styles.demo}>Demo: admin@rental.app · employee@rental.app · abc@rental.app / demo123</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink, padding: 24 },
  kicker: { color: colors.amber, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", fontSize: 12 },
  title: { color: colors.white, fontSize: 36, fontWeight: "700", marginTop: 8 },
  subtitle: { color: "#d6d3d1", marginTop: 8, marginBottom: 20, lineHeight: 22 },
  hint: { color: "#a8a29e", fontSize: 12, marginBottom: 16, lineHeight: 18 },
  demo: { color: "#a8a29e", fontSize: 12, textAlign: "center" },
});
