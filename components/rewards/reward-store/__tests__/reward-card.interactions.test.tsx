import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RewardCard from "../reward-card";
import { mockReward, createHandlers } from "./reward-card.fixtures";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => (
      <div {...(props as any)}>{children}</div>
    ),
  },
}));

describe("RewardCard interactions and styling", () => {
  const { onRedeem: mockOnRedeem } = createHandlers();

  beforeEach(() => {
    mockOnRedeem.mockClear();
  });

  describe("Interactions", () => {
    it("calls onRedeem when button clicked and can afford", () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      fireEvent.click(screen.getByTestId("reward-store-redeem-button"));
      expect(mockOnRedeem).toHaveBeenCalledWith(mockReward);
    });

    it("does not call onRedeem when cannot afford", () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={false}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      fireEvent.click(screen.getByTestId("reward-store-redeem-button"));
      expect(mockOnRedeem).not.toHaveBeenCalled();
    });

    it("does not call onRedeem when redemption is pending", () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford
          redemptionStatus="PENDING"
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      fireEvent.click(screen.getByTestId("reward-store-redeem-button"));
      expect(mockOnRedeem).not.toHaveBeenCalled();
    });

    it("does not call onRedeem when currently redeeming", () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford
          redemptionStatus={null}
          isRedeeming
          onRedeem={mockOnRedeem}
        />,
      );
      fireEvent.click(screen.getByTestId("reward-store-redeem-button"));
      expect(mockOnRedeem).not.toHaveBeenCalled();
    });
  });

  describe("Styling", () => {
    it("applies opacity when cannot afford and no redemption", () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={false}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      expect(screen.getByTestId("reward-store-card-reward-1")).toHaveClass(
        "opacity-60",
      );
    });

    it("does not apply opacity when can afford", () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      expect(screen.getByTestId("reward-store-card-reward-1")).not.toHaveClass(
        "opacity-60",
      );
    });

    it("does not apply opacity when has redemption status", () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={false}
          redemptionStatus="PENDING"
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      expect(screen.getByTestId("reward-store-card-reward-1")).not.toHaveClass(
        "opacity-60",
      );
    });
  });
});
