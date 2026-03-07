import { RewardType } from "@/lib/types/database";
import { RewardFormData } from "../reward-form";

export const createHandlers = () => ({
  onSubmit: jest.fn(),
  onCancel: jest.fn(),
  onChange: jest.fn(),
});

export const defaultFormData: RewardFormData = {
  name: "",
  description: "",
  type: "SCREEN_TIME" as RewardType,
  cost: "",
};

export const filledFormData: RewardFormData = {
  name: "Extra Screen Time",
  description: "30 minutes of extra screen time",
  type: "SCREEN_TIME" as RewardType,
  cost: "100",
};
