import { describe, it, expect } from "vitest";
import { cityGenreFit, homeCityFit, HOME_CITY_MULT } from "../citySynergy";
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

describe("homeCityFit", () => {
  it("gives the hometown-crowd bonus when the band plays its home city", () => {
    const fit = homeCityFit("nasheattle", "nasheattle");
    expect(fit.isHome).toBe(true);
    expect(fit.multiplier).toBe(HOME_CITY_MULT);
    expect(fit.label).toBe("Hometown crowd");
  });

  it("is neutral away from home, or when the band has no home city", () => {
    expect(homeCityFit("nasheattle", "home").multiplier).toBe(1);
    expect(homeCityFit("nasheattle", "home").isHome).toBe(false);
    expect(homeCityFit(undefined, "home").multiplier).toBe(1);
  });
});
