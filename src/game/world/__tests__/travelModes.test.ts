import { describe, it, expect } from "vitest";
import { rollTravelOffer } from "../travelModes";

describe("rollTravelOffer", () => {
  it("offers the requested number of cards", () => {
    expect(rollTravelOffer({ reputation: 0 })).toHaveLength(3);
  });

  it("gates the sponsored tour bus behind fame (minReputation 30)", () => {
    // count beyond the pool returns ALL eligible modes
    const lowFame = rollTravelOffer({ reputation: 0 }, 99);
    expect(lowFame.some((m) => m.id === "sponsoredBus")).toBe(false);
    expect(lowFame).toHaveLength(5); // van, bus, train, hitchhike, flight

    const famous = rollTravelOffer({ reputation: 50 }, 99);
    expect(famous.some((m) => m.id === "sponsoredBus")).toBe(true);
    expect(famous).toHaveLength(6);
  });

  it("bleeds more cred on sellout travel the more famous you are", () => {
    const flightAt = (rep: number) =>
      rollTravelOffer({ reputation: rep }, 99).find((m) => m.id === "flight")!;
    expect(flightAt(0).effects.diyPoints).toBe(-4); // repScale 0
    expect(flightAt(100).effects.diyPoints).toBe(-9); // repScale 5
    expect(flightAt(100).effects.diyPoints).toBeLessThan(flightAt(0).effects.diyPoints);
  });

  it("DIY modes build cred, sellout modes cost it", () => {
    const all = rollTravelOffer({ reputation: 50 }, 99);
    const van = all.find((m) => m.id === "van")!;
    const flight = all.find((m) => m.id === "flight")!;
    expect(van.effects.diyPoints).toBeGreaterThan(0);
    expect(flight.effects.diyPoints).toBeLessThan(0);
  });
});
