# Supabase JWT Anon Key Fix

## Problem
Family joining was failing with "Invalid family code" for ALL family codes, even valid ones.

## Root Cause
The `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env` was set to a non-JWT token:
```
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"
```

This caused JWT parsing errors: "Expected 3 parts in JWT; got 1" (PGRST301)

## Solution
The anon key must be a proper JWT token. Generated correct JWT using default Supabase local secret:

```javascript
const jwt = require('jsonwebtoken');
const jwtSecret = 'super-secret-jwt-token-with-at-least-32-characters-long';

const anonToken = jwt.sign({
  iss: 'supabase',
  ref: 'localhost', 
  role: 'anon',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
}, jwtSecret);
```

## Fixed .env
```
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzU5MTA2NjMxLCJleHAiOjE3OTA2NDI2MzF9.NkngKkUpeZJRgEwsTAOQFzauIXVPgHsx7M6afIk3iZ8"
```

## Result
Family joining now works perfectly. Users can join families with valid codes like "9R7BIW".

## Note
Supabase CLI's `supabase status` shows "Publishable key" but for local development you need actual JWT tokens for authentication to work properly.