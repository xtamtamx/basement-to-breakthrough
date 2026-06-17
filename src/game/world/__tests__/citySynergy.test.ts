import { describe, it, expect } from "vitest";
import { cityGenreFit } from "../citySynergy";
import { Genre } from "@game/types";

describe("cityGenreFit", () => {
  it("gives the hometown boost for an exact genre match", () => {
    const fit = cityGenreFit(Genre.GRUNGE, Genre.GRUNGE);
    expect(fit.tier).toBe("perfect");
    expect(fit.multiplier).toBeGreaterThan(1.2);
  });

  it("gives a smaller boost for an adjacent genre", () => {
    const fit = cityGenreFit(Genre.EMO, Genre.PUNK); // punk vibes with emo
    expect(fit.tier).toBe("good");
    expect(fit.multiplier).toBeGreaterThan(1);
    expect(fit.multiplier).toBeLessThan(cityGenreFit(Genre.EMO, Genre.EMO).multiplier);
  });

  it("is neutral (no penalty) for an unrelated genre", () => {
    const fit = cityGenreFit(Genre.METAL, Genre.EMO);
    expect(fit.tier).toBe("neutral");
    expect(fit.multiplier).toBe(1);
  });

  it("is neutral when the city has no genre", () => {
    expect(cityGenreFit(undefined, Genre.PUNK).multiplier).toBe(1);
  });
});
