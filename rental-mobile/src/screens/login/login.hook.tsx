import { useEffect, useRef, useState } from "react";
import { Keyboard, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ApiError, defaultApiUrl, getApiUrl, setApiUrl } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { homeFor } from "../../lib/format";
import { validateLoginForm } from "../../lib/loginValidation";
import type { LoginFormState } from "./login.props";

export function useLogin() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [server, setServer] = useState(defaultApiUrl());
  const [showServer, setShowServer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const taps = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getApiUrl().then(setServer);
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow";
    const hideEvent = Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide";
    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardInset(Platform.OS === "android" ? event.endCoordinates.height : 0);
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardInset(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

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
    Keyboard.dismiss();
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

  const form: LoginFormState = {
    email,
    password,
    showPassword,
    server,
    showServer,
    error,
    pending,
    keyboardInset,
  };

  return {
    ...form,
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
  };
}
