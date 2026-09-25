export type LoginFormState = {
  email: string;
  password: string;
  showPassword: boolean;
  server: string;
  showServer: boolean;
  error: string | null;
  pending: boolean;
  keyboardInset: number;
};
