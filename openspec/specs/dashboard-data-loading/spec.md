# Spec: Dashboard Data Loading

## Purpose

Defines the expected data loading behaviour for the dashboard, including
fetch parallelism and rendering sequencing.

---

## Requirements

### Requirement: Quest templates load as soon as family is known

Quest templates SHALL begin loading as soon as the authenticated user's
`family_id` is available, without waiting for character data to resolve.

#### Scenario: Templates fetch starts in parallel with character fetch

- **WHEN** auth resolves and `profile.family_id` is set
- **THEN** `useQuestTemplates` issues its fetch immediately,
  regardless of whether character data has loaded

#### Scenario: Templates are not rendered until character is ready

- **WHEN** character data is still loading
- **THEN** the dashboard SHALL display a loading state and SHALL NOT
  render quest template content

### Requirement: Dashboard load sequence is documented

The observable load sequence SHALL be: auth → (character and quest
templates in parallel) → render.

#### Scenario: Character and templates load concurrently

- **WHEN** auth completes and both `character` fetch and
  `quest_templates` fetch are in flight
- **THEN** both requests SHALL be observable in network tooling at
  the same time
