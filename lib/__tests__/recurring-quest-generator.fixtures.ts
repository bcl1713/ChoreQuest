import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database-generated";

export const createMockSupabase = () =>
  ({
    from: jest.fn(),
  } as unknown as SupabaseClient<Database>);
