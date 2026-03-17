# Error Handling Strategy Spec

## Purpose

Defines the system-wide approach to error classification, API error responses,
React error boundaries, and UI error display patterns.

## Requirements

### Requirement: Typed Error Classes

The system SHALL use a typed error class hierarchy rooted at
`AppError` for all domain and infrastructure errors. Each subclass
SHALL carry an HTTP status code and a machine-readable `code` string,
eliminating string-matching at call sites.

Subclasses: `AuthError` (401), `ForbiddenError` (403),
`NotFoundError` (404), `ValidationError` (400),
`ConflictError` (409).

#### Scenario: Domain error carries status automatically

- **WHEN** a service throws a typed subclass of `AppError`
- **THEN** the error instance exposes a `statusCode` property
  matching its HTTP semantic (e.g., `AuthError` → 401) without
  any additional mapping logic at the call site

#### Scenario: Unclassified errors are not AppError instances

- **WHEN** an unexpected runtime error is thrown (e.g., database
  connection failure)
- **THEN** the error is NOT an instance of `AppError` and is
  treated as an unclassified 500 error

### Requirement: Standardized API Error Response

All API routes SHALL return error responses in the shape
`{ error: string, code: string }` with an appropriate HTTP status
code. A shared `handleRouteError` helper SHALL produce this response
from any thrown value.

#### Scenario: Typed error produces correct response shape

- **WHEN** an API route handler catches an `AppError` subclass
- **THEN** the response body is `{ error: <message>, code: <code> }`
  and the HTTP status matches the error's `statusCode`

#### Scenario: Unclassified error produces 500 response

- **WHEN** an API route handler catches a non-`AppError` throwable
- **THEN** the response is
  `{ error: "Internal server error", code: "INTERNAL_ERROR" }`
  with HTTP status 500

#### Scenario: No route produces a bare string error response

- **WHEN** any API route returns an error
- **THEN** the response body always includes both `error` and `code`
  fields (never a bare string or alternative shape)

### Requirement: Root Error Boundary

The application SHALL render a root-level React error boundary
wrapping all page content. When an unhandled component error
propagates to the boundary, it SHALL display a recovery UI rather
than crashing the entire app.

#### Scenario: Unhandled component error shows recovery UI

- **WHEN** a React component beneath the root boundary throws an
  unhandled error
- **THEN** the boundary renders a fallback UI with a message and
  a reload/recover action instead of a blank or broken page

#### Scenario: Development mode re-throws for overlay

- **WHEN** the app is running in development mode
  (`NODE_ENV !== "production"`)
- **THEN** the error boundary re-throws so React's built-in
  error overlay is shown, preserving the developer experience

### Requirement: Consistent UI Error Display

Components SHALL use exactly one of two patterns for displaying
errors, chosen by context:

- **Toast (transient)**: `useNotification` hook — for action
  feedback (save, delete, submit) that auto-dismisses
- **Inline (persistent)**: `ErrorAlert` component — for load errors
  or validation errors that must remain visible until resolved

Components SHALL NOT manage custom notification state objects
as a substitute for these patterns.

#### Scenario: Action error shown as toast

- **WHEN** a user-triggered action (form submit, button press)
  fails
- **THEN** the component calls `useNotification().error(message)`
  and the toast auto-dismisses without manual state management

#### Scenario: Load error shown inline

- **WHEN** data required to render a component fails to load
- **THEN** the component renders an `ErrorAlert` component in
  place of the failed content, visible until the condition resolves

#### Scenario: No ad-hoc notification state in components

- **WHEN** a component needs to display an error
- **THEN** it does NOT declare a local `notification` state object
  of shape `{ type, message }` as the sole error display mechanism
