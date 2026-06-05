import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}));

// Mock AudioContext
window.AudioContext = vi.fn().mockImplementation(() => ({
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  })),
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: {
      value: 440,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    type: "sine",
  })),
  createBiquadFilter: vi.fn(() => ({
    connect: vi.fn(),
    frequency: { value: 350 },
    type: "lowpass",
  })),
  destination: {},
  currentTime: 0,
}));

// Provide a real, spec-compliant localStorage.
//
// jsdom *does* implement a working Storage, but vitest's jsdom environment never
// copies `window.localStorage` onto the test global: jsdom exposes it as a prototype
// getter (not an own property) and it isn't in vitest's hard-coded global key list.
// So a bare `localStorage` reference falls through to Node's experimental Web Storage,
// which is a non-functional stub here (no backing file) — its methods are missing and
// nothing persists. That stub is what broke the safeStorage tests.
//
// Bridge the JSDOM instance's real localStorage onto the global. Because it is an
// instance of the same `Storage` constructor that vitest *does* expose globally,
// `localStorage instanceof Storage` holds and `vi.spyOn(Storage.prototype, ...)`
// correctly intercepts calls. It persists values and supports bracket access / for...in.
const jsdomWindow = (globalThis as { jsdom?: { window?: Window & typeof globalThis } })
  .jsdom?.window;
if (jsdomWindow?.localStorage) {
  globalThis.localStorage = jsdomWindow.localStorage;
}

// Reset storage between tests for isolation.
afterEach(() => {
  localStorage.clear();
});

// Mock haptics
vi.mock("@utils/mobile", () => ({
  haptics: {
    light: vi.fn(),
    medium: vi.fn(),
    heavy: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    selection: vi.fn(),
  },
}));
