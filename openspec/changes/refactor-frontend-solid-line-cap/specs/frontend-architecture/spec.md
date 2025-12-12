## ADDED Requirements
### Requirement: SOLID-Aligned UI Composition
Frontend components and hooks SHALL follow SOLID principles: each file has a single reason to change, presentational pieces avoid side effects, extensions use composition rather than modification, and dependencies on data/side-effects are inverted behind interfaces.

#### Scenario: Single responsibility enforced
- **WHEN** a UI component or hook is added or refactored
- **THEN** data fetching, mutations, and side effects are extracted to containers/services while the presentational component focuses on rendering and UI logic only

#### Scenario: Dependency inversion for side effects
- **WHEN** a component needs Supabase/realtime data or other side effects
- **THEN** it depends on an injected interface (via props, hooks, or context) rather than importing concrete clients directly, enabling mocking and substitution without code changes

#### Scenario: Extension via composition
- **WHEN** new behavior is needed for an existing component
- **THEN** the change is delivered by composing or configuring the component (or creating a derived wrapper) instead of modifying internal logic, preserving open/closed behavior

### Requirement: Feature-First Modules with Clear Boundaries
Feature modules SHALL be organized around routes/features with explicit public entrypoints, using container components for orchestration and presentational components for rendering, and shared primitives SHALL live under common UI libraries to avoid duplication.

#### Scenario: Container and presentational split
- **WHEN** building or refactoring a feature module
- **THEN** the module exposes container components that coordinate data via services/hooks and pass state into presentational components that handle layout/styling without side effects

#### Scenario: Shared primitives reused
- **WHEN** multiple features need the same UI pattern (e.g., buttons, cards, lists)
- **THEN** the pattern is implemented or extended in shared primitives (`components/ui` or equivalent) and reused rather than duplicating bespoke variants inside feature folders

#### Scenario: Controlled dependencies
- **WHEN** a feature module imports code
- **THEN** it only depends on its own module, shared primitives, and service interfaces/hooks defined for cross-cutting concerns, avoiding upward or cyclic dependencies between feature modules

### Requirement: TypeScript File Size Guardrails
TypeScript source files (including `.ts` and `.tsx`) SHALL be limited to a maximum of 300 lines enforced by linting, with documented exceptions only when approved.

#### Scenario: Lint gate for oversized files
- **WHEN** linting runs in CI or locally
- **THEN** any `.ts`/`.tsx` file exceeding 300 lines fails the lint check unless an explicitly documented and approved override is present

#### Scenario: Decomposition of large files
- **WHEN** a TS/TSX file approaches or exceeds 300 lines during refactors
- **THEN** it is split into smaller components/hooks/services that respect single responsibility without changing user-facing behavior

#### Scenario: Legacy max-line waivers removed
- **WHEN** working through the `legacyMaxLineWaivers` ESLint override list
- **THEN** waivers are removed via refactors until only generated `.ts`/`.tsx` files (e.g., Supabase type outputs) remain above 300 lines with documented justification

#### Scenario: Baseline lint errors resolved
- **WHEN** the max-lines rule is introduced
- **THEN** pre-existing lint errors/warnings and rule exemptions (including `no-explicit-any`, `react-hooks/exhaustive-deps`, and `ban-ts-comment` cases) are remediated so the lint baseline returns to clean and suppressions are limited to narrowly justified ignores
