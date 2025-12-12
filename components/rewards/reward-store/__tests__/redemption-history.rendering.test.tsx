import React from "react";
import { render, screen } from "@testing-library/react";
import RedemptionHistory from "../redemption-history";
import { createMockRedemption } from "./redemption-history.fixtures";

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
      render(<RedemptionHistory redemptions={baseRedemptions} isGuildMaster={false} />);
      expect(screen.getByText("Recent Redemptions")).toBeInTheDocument();
    });

    it("displays redemption name and cost", () => {
      render(<RedemptionHistory redemptions={baseRedemptions} isGuildMaster={false} />);
      expect(screen.getByText("Dragon Plush")).toBeInTheDocument();
      expect(screen.getAllByText("200").length).toBeGreaterThan(0);
    });

    it("displays user name and request date", () => {
      render(<RedemptionHistory redemptions={baseRedemptions} isGuildMaster={false} />);
      expect(screen.getAllByText("Test Hero").length).toBeGreaterThan(0);
      expect(screen.getByText(/Requested:/)).toBeInTheDocument();
    });

    it("renders notes when present", () => {
      render(<RedemptionHistory redemptions={baseRedemptions} isGuildMaster={false} />);
      expect(screen.getByText("Please approve!")).toBeInTheDocument();
    });
  });

  describe("Status Display", () => {
    it("shows status badges for each redemption", () => {
      render(<RedemptionHistory redemptions={baseRedemptions} isGuildMaster={false} />);
      expect(screen.getByText("PENDING")).toBeInTheDocument();
      expect(screen.getByText("APPROVED")).toBeInTheDocument();
      expect(screen.getByText("FULFILLED")).toBeInTheDocument();
      expect(screen.getByText("DENIED")).toBeInTheDocument();
    });

    it("shows approved and fulfilled timestamps", () => {
      render(<RedemptionHistory redemptions={baseRedemptions} isGuildMaster={false} />);
      expect(screen.getByText(/Approved:/)).toBeInTheDocument();
      expect(screen.getByText(/Fulfilled:/)).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("renders empty message when no redemptions", () => {
      render(<RedemptionHistory redemptions={[]} isGuildMaster={false} />);
      expect(screen.getByText("No redemptions yet")).toBeInTheDocument();
    });
  });
});
