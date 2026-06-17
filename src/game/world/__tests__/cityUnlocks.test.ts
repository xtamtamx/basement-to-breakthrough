import { describe, it, expect, beforeEach, vi } from "vitest";
import { isCityUnlocked, recordCityUnlocks } from "../cityUnlocks";
import { metaProgressionManager } from "@game/mechanics/MetaProgressionManager";
import { City } from "@game/types";

vi.mock("@game/mechanics/MetaProgressionManager", () => ({
  metaProgressionManager: { hasUnlock: vi.fn(), recordUnlock: vi.fn() },
}));

const city = (id: string, unlock: City["unlock"]): City =>
  ({ id, name: id, blurb: "", vibe: "", primaryGenre: "PUNK", theme: "home", districts: [], venues: [], unlock } as unknown as City);

const home = city("home", { type: "default", label: "Home turf" });
const cityA = city("a", { type: "reputation", value: 15, label: "Reach 15" });
const cityB = city("b", { type: "reputation", value: 100, label: "Reach 100" });

describe("cityUnlocks", () => {
  let unlocked: Set<string>;
  beforeEach(() => {
    unlocked = new Set();
    vi.mocked(metaProgressionManager.hasUnlock).mockImplementation((id) => unlocked.has(id));
    vi.mocked(metaProgressionManager.recordUnlock).mockImplementation((id) => {
      if (unlocked.has(id)) return false;
      unlocked.add(id);
      return true;
    });
  });

  it("treats default (home) cities as always unlocked", () => {
    expect(isCityUnlocked(home)).toBe(true);
  });

  it("locks reputation cities until recorded in meta", () => {
    expect(isCityUnlocked(cityA)).toBe(false);
  });

  it("records cities whose threshold is met and leaves the rest locked", () => {
    const newly = recordCityUnlocks([home, cityA, cityB], 20);
    expect(newly.map((c) => c.id)).toEqual(["a"]); // 20 >= 15, < 100; home isn't reputation-gated
    expect(isCityUnlocked(cityA)).toBe(true);
    expect(isCityUnlocked(cityB)).toBe(false);
  });

  it("is idempotent — an already-unlocked city isn't reported again", () => {
    recordCityUnlocks([cityA], 20);
    expect(recordCityUnlocks([cityA], 20)).toEqual([]);
  });

  it("unlocks persist (cross-run) once reputation has ever crossed the threshold", () => {
    recordCityUnlocks([cityB], 100);
    expect(isCityUnlocked(cityB)).toBe(true);
    // a later run at low reputation still sees it unlocked
    expect(recordCityUnlocks([cityB], 5)).toEqual([]);
    expect(isCityUnlocked(cityB)).toBe(true);
  });
});
