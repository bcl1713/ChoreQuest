# Supabase Type Migration Key Findings

## Database Schema vs Application Code Mismatch

### Root Issue Identified
The migration from Prisma to Supabase has created a field naming inconsistency:

**Database Reality:**
- Supabase database uses snake_case: `honor_points`, `user_id`, `created_at`, etc.
- The generated Supabase types correctly reflect this: `Character.honor_points`

**Application Code Reality:**  
- Many components were written expecting camelCase: `honorPoints`, `userId`, `createdAt`
- This creates TypeScript errors when components access `character.honorPoints` but database returns `character.honor_points`

### Key Examples Found:
1. **app/dashboard/page.tsx:214** - `{character.honorPoints}` should be `{character.honor_points}`
2. **CharacterCreation component** - Fixed to use proper Supabase types
3. **Multiple test files and utilities** - Still use camelCase `honorPoints`

### Type Naming Confirmed Correct:
- `Character` (capitalized) is the correct export name from `/lib/types/database.ts`
- `export type Character = Tables<'characters'>` matches table name properly

### Migration Strategy Needed:
1. **Fix Field References** - Update all component field access to use snake_case
2. **Alternative: Create Adapter Layer** - Transform data between snake_case and camelCase
3. **Update Test Data** - All test utilities and mock data to match snake_case

### Files Requiring Field Reference Updates:
- `app/dashboard/page.tsx` - Line 214: `character.honorPoints` → `character.honor_points`
- Various test files using `honorPoints` in mock data
- Any other components accessing `character.honorPoints`

### Recommendation:
Fix field references directly rather than creating transform layer - keeps code closer to database reality and avoids transformation overhead.