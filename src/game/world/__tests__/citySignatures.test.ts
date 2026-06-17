import { describe, it, expect } from "vitest";
import { getCitySignature } from "../citySignatures";

describe("citySignatures", () => {
  it("gives New Angeles the lucrative-but-brutal-rent industry signature", () => {
    const sig = getCitySignature("newangeles");
    expect(sig).toBeDefined();
    expect(sig!.rentMult).toBeGreaterThan(1); // expensive
    expect(sig!.revenueMult).toBeGreaterThan(1); // but lucrative
    expect(sig!.repMult).toBeLessThan(1); // sellout pressure
  });

  it("gives San Tampa a high-incident mosh signature", () => {
    expect(getCitySignature("santampa")!.incidentMult).toBeGreaterThan(1);
  });

  it("makes starter towns cheaper than the capital", () => {
    expect(getCitySignature("home")!.rentMult!).toBeLessThan(getCitySignature("newangeles")!.rentMult!);
  });

  it("returns undefined for an unknown city", () => {
    expect(getCitySignature("atlantis")).toBeUndefined();
  });
});
