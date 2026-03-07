import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RedemptionHistory from "../redemption-history";
import {
  createMockRedemption,
  createRedemptionHandlers,
} from "./redemption-history.fixtures";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => (
      <div {...(props as any)}>{children}</div>
    ),
  },
}));

describe("RedemptionHistory actions", () => {
  const handlers = createRedemptionHandlers();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Display Limit", () => {
    it("only displays up to 5 redemptions", () => {
      const manyRedemptions = Array.from({ length: 8 }, (_, i) =>
        createMockRedemption(`redemption-${i}`, "PENDING"),
      );
      render(
        <RedemptionHistory
          redemptions={manyRedemptions}
          isGuildMaster={false}
        />,
      );
      const items = screen.getAllByTestId(/^redemption-/);
      expect(items.length).toBeLessThanOrEqual(5);
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
        />,
      );
      expect(screen.getByTestId("approve-pending")).toBeInTheDocument();
      expect(screen.getByTestId("deny-pending")).toBeInTheDocument();
      expect(screen.getByTestId("fulfill-approved")).toBeInTheDocument();
    });

    it("calls handlers for approve/deny/fulfill", () => {
      render(
        <RedemptionHistory
          redemptions={gmRedemptions}
          isGuildMaster
          onApprove={handlers.onApprove}
          onDeny={handlers.onDeny}
          onFulfill={handlers.onFulfill}
        />,
      );
      fireEvent.click(screen.getByTestId("approve-pending"));
      fireEvent.click(screen.getByTestId("deny-pending"));
      fireEvent.click(screen.getByTestId("fulfill-approved"));
      expect(handlers.onApprove).toHaveBeenCalledWith("pending");
      expect(handlers.onDeny).toHaveBeenCalledWith("pending");
      expect(handlers.onFulfill).toHaveBeenCalledWith("approved");
    });
  });
});
