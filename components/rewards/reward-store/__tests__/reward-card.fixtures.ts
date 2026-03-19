import { Reward } from "@/lib/types/database";

export const mockReward: Reward = {
  id: "reward-1",
  family_id: "family-1",
  name: "Extra Screen Time",
  description: "30 minutes of extra screen time",
  type: "SCREEN_TIME",
  cost: 50,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: null,
};

export const createHandlers = () => ({
  onRedeem: jest.fn(),
});
