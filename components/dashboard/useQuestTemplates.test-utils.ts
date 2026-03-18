export const makeTemplate = (id: string, overrides = {}) => ({
  id,
  family_id: "fam-1",
  title: `Quest ${id}`,
  description: null,
  is_active: true,
  reward_gold: 10,
  reward_xp: 20,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  ...overrides,
});
