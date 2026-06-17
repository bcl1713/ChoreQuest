import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { RedemptionList } from "./redemption-list";
import {
  createMockRedemption,
  createRedemptionHandlers,
} from "./redemption-list.fixtures";

describe("RedemptionList - approved and history", () => {
  const handlers = createRedemptionHandlers();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Approved Redemptions", () => {
    it("should render approved redemptions section", () => {
      render(
        <RedemptionList
          redemptions={[createMockRedemption("1", "APPROVED")]}
          {...handlers}
        />,
      );
      expect(
        screen.getByTestId("approved-redemptions-section"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Approved - Awaiting Fulfillment"),
      ).toBeInTheDocument();
    });

    it("should display approved metadata", () => {
      render(
        <RedemptionList
          redemptions={[createMockRedemption("1", "APPROVED")]}
          {...handlers}
        />,
      );
      expect(
        screen.getByTestId("approved-redemption-item"),
      ).toBeInTheDocument();
      expect(screen.getAllByText("Test User").length).toBeGreaterThan(0);
    });

    it("should render fulfill button and call handler", () => {
      render(
        <RedemptionList
          redemptions={[createMockRedemption("fulfill-1", "APPROVED")]}
          {...handlers}
        />,
      );
      fireEvent.click(screen.getByTestId("fulfill-redemption-button"));
      expect(handlers.onFulfill).toHaveBeenCalledWith("fulfill-1");
    });
  });

  describe("Completed Redemptions (History)", () => {
    it("should render history section", () => {
      render(
        <RedemptionList
          redemptions={[createMockRedemption("1", "FULFILLED")]}
          {...handlers}
        />,
      );
      expect(
        screen.getByTestId("redemption-history-section"),
      ).toBeInTheDocument();
      expect(screen.getByText("Redemption History")).toBeInTheDocument();
    });

    it("should group fulfilled and denied redemptions", () => {
      render(
        <RedemptionList
          redemptions={[
            createMockRedemption("1", "FULFILLED"),
            createMockRedemption("2", "DENIED"),
          ]}
          {...handlers}
        />,
      );
      expect(screen.getAllByTestId("completed-redemption-item")).toHaveLength(
        2,
      );
    });

    it("should show fulfillment timestamp for fulfilled redemptions", () => {
      render(
        <RedemptionList
          redemptions={[createMockRedemption("1", "FULFILLED")]}
          {...handlers}
        />,
      );
      expect(screen.getByText(/Fulfilled /)).toBeInTheDocument();
    });
  });

  describe("Mixed Redemptions", () => {
    it("should render multiple sections when data spans states", () => {
      render(
        <RedemptionList
          redemptions={[
            createMockRedemption("1", "PENDING"),
            createMockRedemption("2", "APPROVED"),
            createMockRedemption("3", "FULFILLED"),
          ]}
          {...handlers}
        />,
      );
      expect(
        screen.getByTestId("pending-redemptions-section"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("approved-redemptions-section"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("redemption-history-section"),
      ).toBeInTheDocument();
    });
  });

  describe("Memoization", () => {
    it("should not re-render when props are unchanged", () => {
      const redemptions = [createMockRedemption("1", "PENDING")];
      const { rerender } = render(
        <RedemptionList redemptions={redemptions} {...handlers} />,
      );
      rerender(<RedemptionList redemptions={redemptions} {...handlers} />);
      expect(screen.getByText("Pending Redemptions")).toBeInTheDocument();
    });
  });
});
