import React from "react";
import { render, screen } from "@testing-library/react";
import RedemptionHistory from "./redemption-history";
import { createMockRedemption } from "./redemption-history.fixtures";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => (
      <div {...(props as any)}>{children}</div>
    ),
  },
}));

describe("RedemptionHistory rendering", () => {
  const baseRedemptions = [
    createMockRedemption("redemption-1", "PENDING"),
    createMockRedemption("redemption-2", "APPROVED", {
      approved_by: "gm-1",
      notes: "Please approve!",
    }),
    createMockRedemption("redemption-3", "FULFILLED"),
    createMockRedemption("redemption-4", "DENIED"),
  ];

  describe("Rendering", () => {
    it("renders section title", () => {
      render(
        <RedemptionHistory
          redemptions={baseRedemptions}
          isGuildMaster={false}
        />,
      );
      expect(screen.getByText("Recent Redemptions")).toBeInTheDocument();
    });

    it("displays redemption name and cost", () => {
      render(
        <RedemptionHistory
          redemptions={baseRedemptions}
          isGuildMaster={false}
        />,
      );
      expect(screen.getAllByText("Dragon Plush").length).toBeGreaterThan(0);
      expect(screen.getAllByText("200").length).toBeGreaterThan(0);
    });

    it("displays user name and request date", () => {
      render(
        <RedemptionHistory
          redemptions={baseRedemptions}
          isGuildMaster={false}
        />,
      );
      expect(screen.getAllByText("Test Hero").length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Requested by/).length).toBeGreaterThan(0);
    });

    it("renders notes when present", () => {
      render(
        <RedemptionHistory
          redemptions={baseRedemptions}
          isGuildMaster={false}
        />,
      );
      expect(screen.getByText("Please approve!")).toBeInTheDocument();
    });
  });

  describe("Status Display", () => {
    it("shows status badges for each redemption", () => {
      render(
        <RedemptionHistory
          redemptions={baseRedemptions}
          isGuildMaster={false}
        />,
      );
      expect(screen.getByText("pending")).toBeInTheDocument();
      expect(screen.getByText("approved")).toBeInTheDocument();
      expect(screen.getByText("fulfilled")).toBeInTheDocument();
      expect(screen.getByText("denied")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("renders empty message when no redemptions", () => {
      render(<RedemptionHistory redemptions={[]} isGuildMaster={false} />);
      expect(
        screen.getByText("No redemption history yet."),
      ).toBeInTheDocument();
    });
  });
});
