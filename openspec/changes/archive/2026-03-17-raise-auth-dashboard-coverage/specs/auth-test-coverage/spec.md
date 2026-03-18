# Auth Test Coverage Spec

## ADDED Requirements

### Requirement: AuthForm renders correct fields per type

The test suite SHALL verify that AuthForm renders the
appropriate input fields for each form type (login,
register, create-family).

#### Scenario: Login form fields

- **WHEN** AuthForm renders with type "login"
- **THEN** it SHALL display email and password fields
- **AND** it SHALL NOT display name or familyCode fields

#### Scenario: Register form fields

- **WHEN** AuthForm renders with type "register"
- **THEN** it SHALL display name, email, password, and
  familyCode fields

#### Scenario: Create-family form fields

- **WHEN** AuthForm renders with type "create-family"
- **THEN** it SHALL display name, userName, email, and
  password fields

### Requirement: AuthForm validates input with Zod schemas

The test suite SHALL verify that AuthForm enforces
validation rules and displays per-field error messages.

#### Scenario: Invalid email rejected

- **WHEN** user submits a form with an invalid email
- **THEN** a validation error SHALL appear for the
  email field
- **AND** onSubmit SHALL NOT be called

#### Scenario: Short password rejected

- **WHEN** user submits register form with password
  shorter than 6 characters
- **THEN** a validation error SHALL appear for the
  password field

#### Scenario: Missing family code rejected

- **WHEN** user submits register form without familyCode
- **THEN** a validation error SHALL appear for the
  familyCode field

#### Scenario: Valid input passes validation

- **WHEN** user submits a form with all valid fields
- **THEN** onSubmit SHALL be called with the form data
- **AND** no validation errors SHALL be displayed

### Requirement: AuthForm handles loading and error states

The test suite SHALL verify loading and error prop
behavior.

#### Scenario: Loading state disables form

- **WHEN** isLoading prop is true
- **THEN** all input fields SHALL be disabled
- **AND** the submit button SHALL show loading text

#### Scenario: Error prop displays error banner

- **WHEN** error prop contains a message string
- **THEN** the error message SHALL be visible in the form

### Requirement: registerUser validates family code

The test suite SHALL verify that registerUser checks
family code validity before creating an account.

#### Scenario: Invalid family code throws error

- **WHEN** registerUser is called with a non-existent
  family code
- **THEN** it SHALL throw an "Invalid family code" error
- **AND** setIsLoading SHALL be called with false

#### Scenario: Valid family code proceeds to account creation

- **WHEN** registerUser is called with a valid family code
- **THEN** it SHALL call supabase.auth.signUp
- **AND** it SHALL insert a user_profiles row with role
  YOUNG_HERO

#### Scenario: Profile insert failure throws error

- **WHEN** the user_profiles insert fails after auth signup
- **THEN** registerUser SHALL throw an error with the
  failure message

### Requirement: updatePasswordFlow validates and updates

The test suite SHALL verify the full password change flow.

#### Scenario: Current password incorrect

- **WHEN** updatePasswordFlow is called with wrong
  current password
- **THEN** it SHALL throw "Current password is incorrect"

#### Scenario: Successful password update

- **WHEN** updatePasswordFlow is called with correct
  current password and valid new password
- **THEN** it SHALL make an HTTP PUT to the Supabase
  auth endpoint with the new password

#### Scenario: No user logged in

- **WHEN** updatePasswordFlow is called with null user
- **THEN** it SHALL throw an error

#### Scenario: Loading state managed correctly

- **WHEN** any auth action function is called
- **THEN** setIsLoading SHALL be called with true at start
- **AND** setIsLoading SHALL be called with false in finally
