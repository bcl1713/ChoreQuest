# Password Change Feedback Design

## Context

The application already has a robust notification system:

- `useNotification` hook provides `success()`, `error()`, and `info()`
  methods
- `NotificationContainer` renders toast notifications at fixed position
  (top-right)
- Supports configurable auto-dismiss (default 3000ms)
- ProfileSettings integrates notifications and passes `handleSuccess`
  callback to PasswordChangeForm

PasswordChangeForm currently:

- Calls `onSuccess` callback on successful password change
- Displays errors only in an inline `ErrorAlert` component
- No integration with the toast notification system for error feedback

## Goals / Non-Goals

**Goals:**

- Add error toast notifications when password change fails (validation,
  auth, server errors)
- Maintain success toast notifications (already working via callback)
- Ensure both success and error notifications persist across navigation
- Use existing notification infrastructure to avoid duplication

**Non-Goals:**

- Modify the underlying `useNotification` hook or `NotificationContainer`
- Create a new notification system
- Change the UI appearance or styling of notifications
- Modify ErrorAlert component behavior

## Decisions

### 1. Use existing notification hook in PasswordChangeForm

**Decision**: Import and use `useNotification` directly in
PasswordChangeForm component.

**Rationale**: ProfileSettings already manages notifications at the
parent level, but PasswordChangeForm needs to handle error cases which
aren't currently exposed. Using `useNotification` in the form gives it
direct control over error notifications while maintaining the existing
success callback pattern.

**Alternatives considered**:

- Extend PasswordChangeForm props to accept an error callback (adds prop
  drilling; less clean)
- Move all notification logic to ProfileSettings (would require
  refactoring form to expose errors differently)
- Create a wrapper component around PasswordChangeForm (unnecessary
  indirection)

### 2. Configure useNotification with different timeouts

**Decision**: Use auto-dismiss for success messages (3-5 seconds), no
auto-dismiss for errors.

**Rationale**: Success messages are non-blocking and users understand
the outcome; errors require acknowledgment. This matches spec
requirement for error messages to "persist and require user to dismiss".

**Implementation**: Use `useNotification(0)` with manual dismiss for
errors. Success notifications use default timeout.

**Alternatives considered**:

- Same timeout for both (reduces clarity; errors need longer visibility)
- User-configurable timeouts (overcomplicated; fixed values work well)

### 3. Simplify error handling in form

**Decision**: Remove local `error` state from PasswordChangeForm and
rely solely on notifications.

**Rationale**: Having both inline `ErrorAlert` and toast notifications
for the same error is redundant. Users see the toast immediately; inline
error is no longer necessary. Simplifies component logic.

**Alternatives considered**:

- Keep both (UI clutter, duplicate information)
- Keep only inline error (not visible if user navigates; violates spec)

## Risks / Trade-offs

- **Removing ErrorAlert**: Notifications use consistent error color scheme
- **Error dismissal**: Error notifications don't auto-dismiss; manual close
  required
- **Error context**: UpdatePassword error messages are descriptive; clear
  messaging preserved
- **Notification overlap**: z-index 50 with fixed positioning prevents
  overlap with other content
