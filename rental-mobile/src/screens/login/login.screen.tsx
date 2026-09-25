import { ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import assets from "../../assets";
import { BrandMark } from "../../components/BrandMark";
import { Field } from "../../components/Field";
import { OfflineBanner } from "../../components/OfflineBanner";
import { Button } from "../../components/ui";
import { homeFor } from "../../lib/format";
import { useLogin } from "./login.hook";
import { createStyles } from "./login.styles";

export default function LoginScreen() {
  const styles = createStyles();
  const {
    user,
    loading,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    server,
    setServer,
    showServer,
    error,
    setError,
    pending,
    keyboardInset,
    revealServer,
    onSubmit,
  } = useLogin();

  if (!loading && user) return <Redirect href={homeFor(user.role) as "/(owner)/dashboard"} />;

  return (
    <ImageBackground source={assets.loginHero} style={[styles.root, styles.background]} resizeMode="cover">
      <LinearGradient
        colors={["rgba(11,18,32,0.52)", "rgba(11,18,32,0.82)", "rgba(11,18,32,0.96)"]}
        locations={[0, 0.45, 1]}
        style={styles.overlay}
      >
        <StatusBar style="light" />
        <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
          <OfflineBanner />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.flex}
            keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
          >
            <ScrollView
              style={styles.flex}
              contentContainerStyle={[styles.content, { paddingBottom: 32 + keyboardInset }]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
              showsVerticalScrollIndicator={false}
            >
              <Pressable onPress={revealServer} style={styles.brandRow} accessibilityRole="header">
                <BrandMark />
                <Text style={styles.brandName}>West Ridge Rentals</Text>
              </Pressable>

              <View style={styles.textContainer}>
                <Text style={styles.headline}>Welcome back</Text>
                <Text style={styles.headline}>Ready for the yard.</Text>
              </View>

              <View style={styles.inputContainer}>
                <Field
                  placeholder="Email"
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
                  accessibilityLabel="Email"
                />
                <Field
                  placeholder="Password"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (error) setError(null);
                  }}
                  secureTextEntry={!showPassword}
                  isSecure
                  onSecurePress={() => setShowPassword((value) => !value)}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={onSubmit}
                  accessibilityLabel="Password"
                />
                {showServer ? (
                  <Field
                    placeholder="API server"
                    value={server}
                    onChangeText={setServer}
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="API server"
                  />
                ) : null}
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.buttonContainer}>
                <Button label={pending ? "Signing in…" : "Sign in"} variant="dark" pending={pending} onPress={onSubmit} />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}
