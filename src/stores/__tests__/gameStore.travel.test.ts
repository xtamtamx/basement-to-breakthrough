import { describe, it, expect, beforeEach, vi } from "vitest";
import { showPromotionSystem } from "@game/mechanics/ShowPromotionSystem";

// cancelAllScheduledShows captures a runtime snapshot via dynamic import — stub it.
vi.mock("@game/persistence/runtimeSnapshot", () => ({
  captureRuntimeSnapshot: vi.fn(() => null),
}));

import { useGameStore } from "../gameStore";

describe("cancelAllScheduledShows — travel scoping", () => {
  beforeEach(() => {
    showPromotionSystem.reset();
  });

  it("clears booked shows, refunds their deposits, and empties the promotion Map", () => {
    // Two shows live in both the promotion Map and the store's display list.
    showPromotionSystem.restore([
      { id: "s1", promotionInvestment: [] } as never,
      { id: "s2", promotionInvestment: [] } as never,
    ]);
    useGameStore.setState({
      money: 100,
      scheduledShows: [
        { id: "s1", bookingDeposit: 90 } as never,
        { id: "s2", bookingDeposit: 60 } as never,
      ],
    });

    useGameStore.getState().cancelAllScheduledShows();

    expect(useGameStore.getState().scheduledShows).toEqual([]);
    expect(useGameStore.getState().money).toBe(250); // 100 + 90 + 60 refunded
    expect(showPromotionSystem.getScheduledShows()).toHaveLength(0);
  });

  it("is a safe no-op when nothing is booked", () => {
    useGameStore.setState({ money: 500, scheduledShows: [] });
    useGameStore.getState().cancelAllScheduledShows();
    expect(useGameStore.getState().money).toBe(500);
    expect(useGameStore.getState().scheduledShows).toEqual([]);
  });
});
