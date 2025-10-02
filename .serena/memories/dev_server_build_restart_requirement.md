# Dev Server Restart Requirement After Build

## Critical Information

**IMPORTANT**: Running `npm run build` crashes the dev server and requires a restart.

## When This Happens

- After running `npm run build` for quality gates
- After any production build command
- The dev server (running on port 3000) will crash and need to be restarted

## What To Do

1. Kill existing dev server background processes
2. Restart dev server with: `npm run dev`
3. Wait for "Ready" message before running E2E tests
4. E2E tests require dev server on port 3000

## Commands

```bash
# Kill existing dev servers (if running in background)
kill <pid>  # or use KillShell tool

# Restart dev server
npm run dev
```

## E2E Test Requirements

- Dev server MUST be running on port 3000
- Check server status before running Playwright tests
- If tests fail with "element not found", likely the server crashed

## Remember

This happens **every single time** you run a build. Always restart the dev server after build commands.