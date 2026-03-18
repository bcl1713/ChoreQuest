# Tasks: Raise Auth & Dashboard Test Coverage

## 1. Auth Form Tests

- [x] 1.1 Create AuthForm.test.tsx with render tests
  for login, register, and create-family field sets
- [x] 1.2 Add Zod validation tests: invalid email,
  short password, missing familyCode, valid submission
- [x] 1.3 Add loading state and error prop display tests

## 2. Auth Action Tests

- [x] 2.1 Add registerUser tests: invalid family code,
  valid flow with profile insert, profile insert failure
- [x] 2.2 Add updatePasswordFlow tests: wrong current
  password, successful update, null user, loading states
- [x] 2.3 Verify all auth actions manage setIsLoading
  correctly (true at start, false in finally)

## 3. Dashboard Component Tests

- [x] 3.1 Create AdminDashboard test with tab rendering
  and tab switching assertions
- [x] 3.2 Add tab selection styling and panel visibility
  tests

## 4. Dashboard Hook and Handler Tests

- [x] 4.1 Create useQuestTemplates.test.ts with loading
  behavior tests (enabled/disabled, null familyId,
  error handling)
- [x] 4.2 Add useQuestTemplates realtime subscription
  tests (INSERT, UPDATE, DELETE events)
- [x] 4.3 Create AuthErrorHandler.test.tsx with URL
  param detection, timeout, and cleanup tests

## 5. API Route Tests: Quest Instance Approve

- [x] 5.1 Create approve route test with successful
  approval by GM scenario
- [x] 5.2 Add approve rejection tests: non-GM, cross-
  family, invalid UUID, missing auth token

## 6. API Route Tests: Quest Instance Assign

- [x] 6.1 Create assign route test with successful
  assignment scenario
- [x] 6.2 Add assign rejection tests: missing
  characterId, non-FAMILY quest type, non-GM,
  cross-family

## 7. API Route Tests: Quest Instance Deny

- [x] 7.1 Create deny route test with successful
  denial of COMPLETED quest
- [x] 7.2 Add deny rejection tests: non-completed
  quest, cross-family, non-GM

## 8. API Route Tests: Quest Instance Release

- [x] 8.1 Create release route test with GM release
  and assigned hero release scenarios
- [x] 8.2 Add release tests for FAMILY vs INDIVIDUAL
  quest type handling
- [x] 8.3 Add release rejection tests: unauthorized
  user, cross-family

## 9. API Route Tests: Quest Instance Delete

- [x] 9.1 Create delete route test with successful
  deletion by GM
- [x] 9.2 Add delete rejection tests: non-GM, quest
  not found, cross-family
