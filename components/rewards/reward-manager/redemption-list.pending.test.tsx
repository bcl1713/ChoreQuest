import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { RedemptionList } from "./redemption-list";
import {
  createMockRedemption,
  createRedemptionHandlers,
} from "./redemption-list.fixtures";

describe("RedemptionList - pending", () => {
  const handlers = createRedemptionHandlers();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Empty States", () => {
    it("should render nothing when no redemptions provided", () => {
      const { container } = render(
        <RedemptionList redemptions={[]} {...handlers} />,
      );
      expect(container.querySelector("[data-testid]")).not.toBeInTheDocument();
    });

    it("should not show pending section when no pending redemptions", () => {
      render(
        <RedemptionList
          redemptions={[createMockRedemption("1", "APPROVED")]}
          {...handlers}
        />,
      );
      expect(
        screen.queryByTestId("pending-redemptions-section"),
      ).not.toBeInTheDocument();
    });

    it("should not show approved section when no approved redemptions", () => {
      render(
        <RedemptionList
          redemptions={[createMockRedemption("1", "PENDING")]}
          {...handlers}
        />,
      );
      expect(
        screen.queryByTestId("approved-redemptions-section"),
      ).not.toBeInTheDocument();
    });

    it("should not show history section when no completed redemptions", () => {
      render(
        <RedemptionList
          redemptions={[createMockRedemption("1", "PENDING")]}
          {...handlers}
        />,
      );
      expect(
        screen.queryByTestId("redemption-history-section"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Pending Redemptions", () => {
    it("should render pending redemptions section", () => {
      render(
        <RedemptionList
          redemptions={[createMockRedemption("1", "PENDING")]}
          {...handlers}
        />,
      );
      expect(
        screen.getByTestId("pending-redemptions-section"),
      ).toBeInTheDocument();
      expect(screen.getByText("Pending Redemptions")).toBeInTheDocument();
    });

    it("should display user name and reward info", () => {
      render(
        <RedemptionList
          redemptions={[createMockRedemption("1", "PENDING")]}
          {...handlers}
        />,
      );
      expect(screen.getByText("Test User")).toBeInTheDocument();
      expect(
        screen.getByText("Extra Screen Time (100 gold)"),
      ).toBeInTheDocument();
    });

    it("should display notes when present", () => {
      render(
        <RedemptionList
          redemptions={[
            createMockRedemption("1", "PENDING", {
              notes: "Please approve soon!",
            }),
          ]}
          {...handlers}
        />,
      );
      expect(screen.getByText("Please approve soon!")).toBeInTheDocument();
    });

    it("should display formatted timestamp when requested_at is present", () => {
      render(
        <RedemptionList
          redemptions={[createMockRedemption("1", "PENDING")]}
          {...handlers}
        />,
      );
      const expectedText = new Date("2024-01-15T10:00:00Z").toLocaleString();
      expect(screen.getByText(`Requested ${expectedText}`)).toBeInTheDocument();
    });

    it("should display 'Unknown' when requested_at is null", () => {
      render(
        <RedemptionList
          redemptions={[
            createMockRedemption("1", "PENDING", { requested_at: null }),
          ]}
          {...handlers}
        />,
      );
      expect(screen.getByText("Requested Unknown")).toBeInTheDocument();
    });

    it("should not render notes section when notes are null", () => {
      render(
        <RedemptionList
          redemptions={[createMockRedemption("1", "PENDING", { notes: null })]}
          {...handlers}
        />,
      );
      const items = screen.getAllByTestId("pending-redemption-item");
      expect(items[0].querySelector(".italic")).not.toBeInTheDocument();
    });

    it("should render approve and deny buttons", () => {
      render(
        <RedemptionList
          redemptions={[createMockRedemption("1", "PENDING")]}
          {...handlers}
        />,
      );
      expect(
        screen.getByTestId("approve-redemption-button"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("deny-redemption-button")).toBeInTheDocument();
    });

    it("should call onApprove when approve button clicked", () => {
      render(
        <RedemptionList
          redemptions={[createMockRedemption("redemption-1", "PENDING")]}
          {...handlers}
        />,
      );
      fireEvent.click(screen.getByTestId("approve-redemption-button"));
      expect(handlers.onApprove).toHaveBeenCalledWith("redemption-1");
    });

    it("should call onDeny when deny button clicked", () => {
      render(
        <RedemptionList
          redemptions={[createMockRedemption("redemption-2", "PENDING")]}
          {...handlers}
        />,
      );
      fireEvent.click(screen.getByTestId("deny-redemption-button"));
      expect(handlers.onDeny).toHaveBeenCalledWith("redemption-2");
    });

    it("should render multiple pending redemptions", () => {
      const redemptions = [
        createMockRedemption("1", "PENDING", {
          user_profiles: {
            id: "u1",
            name: "Alice",
            email: "alice@test.com",
            role: "CHILD",
            family_id: "f1",
            created_at: new Date().toISOString(),
          },
        }),
        createMockRedemption("2", "PENDING", {
          user_profiles: {
            id: "u2",
            name: "Bob",
            email: "bob@test.com",
            role: "CHILD",
            family_id: "f1",
            created_at: new Date().toISOString(),
          },
        }),
      ];
      render(<RedemptionList redemptions={redemptions} {...handlers} />);
      expect(screen.getAllByTestId("pending-redemption-item")).toHaveLength(2);
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });
});
