import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RedemptionHistory from "../redemption-history";
import { createMockRedemption, createRedemptionHandlers } from "./redemption-history.fixtures";

describe("RedemptionHistory actions", () => {
  const handlers = createRedemptionHandlers();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Limit Display", () => {
    it("shows limit message when provided", () => {
      render(
        <RedemptionHistory
          redemptions={[createMockRedemption("1", "PENDING")]}
          isGuildMaster
          onApprove={handlers.onApprove}
          onDeny={handlers.onDeny}
          onFulfill={handlers.onFulfill}
          limit={5}
        />
      );
      expect(screen.getByText("Showing latest 5 redemptions")).toBeInTheDocument();
    });
  });

  describe("Guild Master Actions", () => {
    const gmRedemptions = [
      createMockRedemption("pending", "PENDING"),
      createMockRedemption("approved", "APPROVED"),
    ];

    it("renders action buttons for pending and approved items", () => {
      render(
        <RedemptionHistory
          redemptions={gmRedemptions}
          isGuildMaster
          onApprove={handlers.onApprove}
          onDeny={handlers.onDeny}
          onFulfill={handlers.onFulfill}
        />
      );
      expect(screen.getByTestId("gm-approve-pending")).toBeInTheDocument();
      expect(screen.getByTestId("gm-deny-pending")).toBeInTheDocument();
      expect(screen.getByTestId("gm-fulfill-approved")).toBeInTheDocument();
    });

    it("calls handlers for approve/deny/fulfill", () => {
      render(
        <RedemptionHistory
          redemptions={gmRedemptions}
          isGuildMaster
          onApprove={handlers.onApprove}
          onDeny={handlers.onDeny}
          onFulfill={handlers.onFulfill}
        />
      );
      fireEvent.click(screen.getByTestId("gm-approve-pending"));
      fireEvent.click(screen.getByTestId("gm-deny-pending"));
      fireEvent.click(screen.getByTestId("gm-fulfill-approved"));
      expect(handlers.onApprove).toHaveBeenCalledWith("pending");
      expect(handlers.onDeny).toHaveBeenCalledWith("pending");
      expect(handlers.onFulfill).toHaveBeenCalledWith("approved");
    });
  });
});
