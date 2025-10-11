// eslint-disable-next-line @typescript-eslint/no-require-imports
const jwt = require("jsonwebtoken");

// Replace with your actual JWT secret from supabase/config.toml
// For local development, it's often 'super-secret-jwt-token-with-at-least-32-characters-long'
const JWT_SECRET = "dev-secret-key-not-for-production-use";

// Payload for the anonymous role
const payload = {
  role: "anon",
  iss: "supabase",
  ref: "local", // Or your project ref if not local
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365, // 1 year expiration
};

const token = jwt.sign(payload, JWT_SECRET);

console.log("Generated JWT for NEXT_PUBLIC_SUPABASE_ANON_KEY:");
console.log(token);
