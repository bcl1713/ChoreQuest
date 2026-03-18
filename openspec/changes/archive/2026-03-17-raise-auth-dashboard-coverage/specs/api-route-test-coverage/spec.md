# API Route Test Coverage Spec

## ADDED Requirements

### Requirement: Quest instance approve endpoint tested

The test suite SHALL cover the POST
/api/quest-instances/[id]/approve route.

#### Scenario: Successful approval by Guild Master

- **WHEN** a GUILD_MASTER sends a valid approve request
  for a quest in their family
- **THEN** the handler SHALL return the approved quest
- **AND** the response status SHALL be 200

#### Scenario: Non-GM user rejected

- **WHEN** a non-GUILD_MASTER user sends an approve
  request
- **THEN** the handler SHALL return 403
  QUEST_APPROVE_FORBIDDEN

#### Scenario: Cross-family approval rejected

- **WHEN** a GUILD_MASTER sends an approve request for
  a quest in a different family
- **THEN** the handler SHALL return 403

#### Scenario: Invalid UUID rejected

- **WHEN** the quest ID is not a valid UUID
- **THEN** the handler SHALL return 400 QUEST_ID_INVALID

#### Scenario: Missing auth token rejected

- **WHEN** the request has no Authorization header
- **THEN** the handler SHALL return 401

### Requirement: Quest instance assign endpoint tested

The test suite SHALL cover the POST
/api/quest-instances/[id]/assign route.

#### Scenario: Successful assignment by Guild Master

- **WHEN** a GUILD_MASTER assigns a FAMILY quest to a
  character in their family
- **THEN** the handler SHALL return the assigned quest
  with status PENDING

#### Scenario: Missing characterId rejected

- **WHEN** the request body lacks a characterId field
- **THEN** the handler SHALL return 400
  CHARACTER_ID_REQUIRED

#### Scenario: Non-FAMILY quest type rejected

- **WHEN** a GUILD_MASTER tries to assign an INDIVIDUAL
  quest
- **THEN** the handler SHALL return 400
  QUEST_TYPE_INVALID

#### Scenario: Non-GM assign rejected

- **WHEN** a non-GUILD_MASTER sends an assign request
- **THEN** the handler SHALL return 403

### Requirement: Quest instance deny endpoint tested

The test suite SHALL cover the POST
/api/quest-instances/[id]/deny route.

#### Scenario: Successful denial of completed quest

- **WHEN** a GUILD_MASTER denies a COMPLETED quest in
  their family
- **THEN** the handler SHALL set status to PENDING
- **AND** it SHALL clear completed_at

#### Scenario: Non-completed quest rejected

- **WHEN** a GUILD_MASTER tries to deny a quest that
  is not COMPLETED
- **THEN** the handler SHALL return 400
  QUEST_NOT_DENIABLE

#### Scenario: Cross-family denial rejected

- **WHEN** a GUILD_MASTER denies a quest from another
  family
- **THEN** the handler SHALL return 403

### Requirement: Quest instance release endpoint tested

The test suite SHALL cover the POST
/api/quest-instances/[id]/release route.

#### Scenario: GM releases a quest

- **WHEN** a GUILD_MASTER releases a quest in their
  family
- **THEN** the handler SHALL return success

#### Scenario: Assigned hero releases own quest

- **WHEN** the hero assigned to a quest sends a release
  request
- **THEN** the handler SHALL return success

#### Scenario: Unauthorized user rejected

- **WHEN** a user who is not GM, not assigned, and not
  the claimer sends a release request
- **THEN** the handler SHALL return 403

#### Scenario: FAMILY quest uses service

- **WHEN** a FAMILY quest is released
- **THEN** QuestInstanceService.releaseQuest SHALL be
  called

#### Scenario: INDIVIDUAL quest unassigns directly

- **WHEN** an INDIVIDUAL quest is released
- **THEN** the quest SHALL be updated with
  assigned_to_id=null and status=AVAILABLE

### Requirement: Quest instance delete endpoint tested

The test suite SHALL cover the DELETE
/api/quest-instances/[id] route.

#### Scenario: Successful deletion by Guild Master

- **WHEN** a GUILD_MASTER deletes a quest in their
  family
- **THEN** the handler SHALL delete the quest
- **AND** return a success response

#### Scenario: Non-GM delete rejected

- **WHEN** a non-GUILD_MASTER sends a delete request
- **THEN** the handler SHALL return 403

#### Scenario: Quest not found

- **WHEN** the quest ID does not exist
- **THEN** the handler SHALL return 404 QUEST_NOT_FOUND

#### Scenario: Cross-family deletion rejected

- **WHEN** a GUILD_MASTER tries to delete a quest from
  another family
- **THEN** the handler SHALL return 403
