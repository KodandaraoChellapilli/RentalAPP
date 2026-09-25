const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

type CorsEnv = {
  NODE_ENV?: string;
  CORS_ORIGINS?: string;
};

export function resolveCorsOrigin(requestOrigin: string | null | undefined, env: CorsEnv = process.env) {
  const configured = (env.CORS_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const production = env.NODE_ENV === "production";
  const origin = requestOrigin?.trim() || "";

  if (configured.includes("*")) {
    return production ? null : "*";
  }
  if (origin && configured.includes(origin)) return origin;
  if (!production && origin && LOCAL_ORIGIN.test(origin)) return origin;
  return null;
}

export function corsHeaderRecord(requestOrigin: string | null | undefined, env: CorsEnv = process.env) {
  const allow = resolveCorsOrigin(requestOrigin, env);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    Vary: "Origin",
  };
  if (allow) headers["Access-Control-Allow-Origin"] = allow;
  return headers;
}
