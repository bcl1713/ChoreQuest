import { screen, waitFor } from "@testing-library/react";
import { mockGetFamilyInfo, renderFamilySettings, resetFamilySettingsMocks } from "./family-settings.fixtures";

describe("FamilySettings - errors", () => {
  beforeEach(() => {
    resetFamilySettingsMocks();
  });

  it("displays error state when loading fails", async () => {
    mockGetFamilyInfo.mockRejectedValue(new Error("Database error"));

    renderFamilySettings();

    await waitFor(() => {
      expect(screen.getByText("Failed to load family information")).toBeInTheDocument();
    });
  });

  it("displays error when familyInfo is null", async () => {
    mockGetFamilyInfo.mockResolvedValue(null);

    renderFamilySettings();

    await waitFor(() => {
      expect(screen.getByText("Failed to load family settings")).toBeInTheDocument();
    });
  });
});
