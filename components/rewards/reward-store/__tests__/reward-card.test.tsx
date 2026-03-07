import React from "react";
import { render, screen } from "@testing-library/react";
import RewardCard from "../reward-card";
import { mockReward, createHandlers } from "./reward-card.fixtures";
describe("RewardCard", () => {
  const { onRedeem: mockOnRedeem } = createHandlers();
  beforeEach(() => {
    mockOnRedeem.mockClear();
  });
  describe("Rendering", () => {
    it("renders reward name and description", () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      expect(screen.getByText("Extra Screen Time")).toBeInTheDocument();
      expect(
        screen.getByText("30 minutes of extra screen time"),
      ).toBeInTheDocument();
    });
    it("renders correct icon for SCREEN_TIME type", () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      expect(
        screen.getByLabelText("SCREEN_TIME reward type"),
      ).toBeInTheDocument();
      expect(screen.getByText("Screen Time")).toBeInTheDocument();
    });
    it("renders correct icon for PRIVILEGE type", () => {
      const privilegeReward: Reward = { ...mockReward, type: "PRIVILEGE" };
      render(
        <RewardCard
          reward={privilegeReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      expect(
        screen.getByLabelText("PRIVILEGE reward type"),
      ).toBeInTheDocument();
      expect(screen.getByText("Privilege")).toBeInTheDocument();
    });
    it("renders correct icon for PURCHASE type", () => {
      const purchaseReward: Reward = { ...mockReward, type: "PURCHASE" };
      render(
        <RewardCard
          reward={purchaseReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      expect(screen.getByLabelText("PURCHASE reward type")).toBeInTheDocument();
      expect(screen.getByText("Purchase")).toBeInTheDocument();
    });
    it("renders correct icon for EXPERIENCE type", () => {
      const experienceReward: Reward = { ...mockReward, type: "EXPERIENCE" };
      render(
        <RewardCard
          reward={experienceReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      expect(
        screen.getByLabelText("EXPERIENCE reward type"),
      ).toBeInTheDocument();
      expect(screen.getByText("Experience")).toBeInTheDocument();
    });
    it("displays reward cost", () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      expect(screen.getByText("50 gold")).toBeInTheDocument();
    });
    it("has correct test id", () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      expect(
        screen.getByTestId("reward-store-card-reward-1"),
      ).toBeInTheDocument();
    });
  });
  describe("Button States", () => {
    it('shows "Redeem Reward" when user can afford and no redemption status', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      expect(
        screen.getByTestId("reward-store-redeem-button"),
      ).toHaveTextContent("Redeem Reward");
      expect(
        screen.getByTestId("reward-store-redeem-button"),
      ).not.toBeDisabled();
    });
    it('shows "Insufficient Gold" when user cannot afford', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={false}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      expect(
        screen.getByTestId("reward-store-redeem-button"),
      ).toHaveTextContent("Insufficient Gold");
      expect(screen.getByTestId("reward-store-redeem-button")).toBeDisabled();
    });
    it('shows "Request Pending" with PENDING status', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus="PENDING"
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      expect(
        screen.getByTestId("reward-store-redeem-button"),
      ).toHaveTextContent("Request Pending");
      expect(screen.getByTestId("reward-store-redeem-button")).toBeDisabled();
    });
    it('shows "Approved" with APPROVED status', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus="APPROVED"
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      expect(
        screen.getByTestId("reward-store-redeem-button"),
      ).toHaveTextContent("Approved");
      expect(screen.getByTestId("reward-store-redeem-button")).toBeDisabled();
    });
    it('shows "Redeeming..." spinner when redeeming', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={true}
          onRedeem={mockOnRedeem}
        />,
      );
      expect(screen.getByText("Redeeming...")).toBeInTheDocument();
      expect(screen.getByTestId("reward-store-redeem-button")).toBeDisabled();
    });
  });
  describe("Status Badge", () => {
    it("shows PENDING badge when status is PENDING", () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus="PENDING"
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      expect(screen.getByText("Pending")).toBeInTheDocument();
    });
    it("shows APPROVED badge when status is APPROVED", () => {
      const { container } = render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus="APPROVED"
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      const badge = container.querySelector(".bg-green-900\\/30");
      expect(badge).toBeInTheDocument();
      expect(badge?.textContent).toBe("Approved");
    });
    it("does not show badge when no redemption status", () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />,
      );
      expect(screen.queryByText("Pending")).not.toBeInTheDocument();
      expect(screen.queryByText("Approved")).not.toBeInTheDocument();
    });
  });
});
