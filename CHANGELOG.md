# Changelog

## [0.2.3] - 2025-10-17

### Added
- **Timezone Support for Quest Recurrence** (#60)
  - Added `timezone` column to `families` table (IANA timezone string)
  - Quest recurrence (daily/weekly resets) now aligns to family timezone instead of server time
  - Auto-detect timezone on family creation using browser's Intl API
  - Added timezone selector in Family Settings for GMs to update timezone
  - Comprehensive timezone utilities with 31 passing unit tests
  - Streak validation now respects family timezone for consecutive completions

### Changed
- Updated `recurring-quest-generator` to use timezone-aware date calculations
- Updated `streak-service` to validate consecutive completions using family timezone
- Updated `FamilyService` to include timezone in family info and provide update method

### Technical Details
- Installed `date-fns` and `date-fns-tz` for timezone handling
- Created `/lib/timezone-utils.ts` with helpers for timezone-aware operations
- Database migration `/supabase/migrations/20251017000001_add_family_timezone.sql`
- All existing families default to UTC timezone (maintains current behavior)

## [0.2.2] - Previous release
