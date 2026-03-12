# Password Change Feedback Tasks

## 1. Update PasswordChangeForm Component

- [x] 1.1 Import `useNotification` hook in PasswordChangeForm
- [x] 1.2 Initialize `useNotification(0)` for error notifications (no auto-dismiss)
- [x] 1.3 Remove local `error` state from component
- [x] 1.4 Remove `ErrorAlert` component from JSX
- [x] 1.5 Update successful password change to call `success()` notification
  alongside existing `onSuccess` callback
- [x] 1.6 Update error handling in catch block to call `error()` notification
  instead of setting state
- [x] 1.7 Update form validation errors to call `error()` notification instead
  of setting state

## 2. Add Notification Display to ProfileSettings

- [x] 2.1 Verify ProfileSettings already renders NotificationContainer
- [x] 2.2 Verify ProfileSettings passes `dismiss` callback to
  NotificationContainer
- [x] 2.3 Test that error notifications from PasswordChangeForm appear in
  container

## 3. Write Tests for Password Change Notifications

- [x] 3.1 Write test: Success notification displays when password change
  succeeds
- [x] 3.2 Write test: Success notification includes "Password changed
  successfully" message
- [x] 3.3 Write test: Failure notification displays when validation fails
- [x] 3.4 Write test: Failure notification displays when updatePassword
  throws error
- [x] 3.5 Write test: Error notification remains visible (no auto-dismiss)
- [x] 3.6 Write test: Success notification still triggers onSuccess callback
  for character refresh
- [x] 3.7 Write test: Success notification works when user navigates away
  from password tab

## 4. Accessibility Verification

- [x] 4.1 Verify notifications are announced to screen readers
- [x] 4.2 Verify notifications are keyboard dismissible
- [x] 4.3 Test with accessibility scanner (axe or similar)

## 5. Manual Testing and QA

- [x] 5.1 Test password change success path end-to-end
- [x] 5.2 Test validation error feedback (current password missing)
- [x] 5.3 Test validation error feedback (passwords don't match)
- [x] 5.4 Test validation error feedback (password too weak)
- [x] 5.5 Test server error feedback (authentication failure)
- [x] 5.6 Test notification persistence when switching tabs
- [x] 5.7 Test notification persistence when navigating away from settings
- [x] 5.8 Verify notification styling matches design system

## 6. Code Quality Checks

- [x] 6.1 Run TypeScript compiler - zero errors
- [x] 6.2 Run linter - zero errors and warnings
- [x] 6.3 Run all tests - all passing
- [x] 6.4 Verify PasswordChangeForm stays under 300 lines (if currently over)
