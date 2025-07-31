/**
 * Input validation utilities for game data
 */

import { Band, Venue, Show, Resources } from "@/game/types";

// Validation constraints
export const CONSTRAINTS = {
  // Money constraints
  MIN_MONEY: -10000, // Allow some debt
  MAX_MONEY: 999999,

  // Ticket price constraints
  MIN_TICKET_PRICE: 0,
  MAX_TICKET_PRICE: 1000,

  // Resource constraints
  MIN_REPUTATION: 0,
  MAX_REPUTATION: 100,
  MIN_FANS: 0,
  MAX_FANS: 999999,
  MIN_STRESS: 0,
  MAX_STRESS: 100,
  MIN_CONNECTIONS: 0,
  MAX_CONNECTIONS: 100,

  // Name constraints
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 50,
  NAME_PATTERN: /^[a-zA-Z0-9\s\-'&!?.,]+$/,

  // Venue constraints
  MIN_CAPACITY: 1,
  MAX_CAPACITY: 100000,
  MIN_RENT: 0,
  MAX_RENT: 10000,

  // Band constraints
  MIN_POPULARITY: 0,
  MAX_POPULARITY: 100,
  MIN_ENERGY: 0,
  MAX_ENERGY: 100,

  // Show constraints
  MIN_SHOWS_PER_TURN: 0,
  MAX_SHOWS_PER_TURN: 10,
};

// Validation errors
export class ValidationError extends Error {
  constructor(
    public field: string,
    public value: unknown,
    message: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

// Number validators
export const validateNumber = (
  value: unknown,
  field: string,
  min: number,
  max: number,
): number => {
  const num = Number(value);

  if (isNaN(num)) {
    throw new ValidationError(field, value, `${field} must be a number`);
  }

  if (num < min) {
    throw new ValidationError(field, value, `${field} must be at least ${min}`);
  }

  if (num > max) {
    throw new ValidationError(field, value, `${field} must be at most ${max}`);
  }

  return num;
};

// String validators
export const validateString = (
  value: unknown,
  field: string,
  minLength: number = CONSTRAINTS.MIN_NAME_LENGTH,
  maxLength: number = CONSTRAINTS.MAX_NAME_LENGTH,
  pattern?: RegExp,
): string => {
  if (typeof value !== "string") {
    throw new ValidationError(field, value, `${field} must be a string`);
  }

  const trimmed = value.trim();

  if (trimmed.length < minLength) {
    throw new ValidationError(
      field,
      value,
      `${field} must be at least ${minLength} characters`,
    );
  }

  if (trimmed.length > maxLength) {
    throw new ValidationError(
      field,
      value,
      `${field} must be at most ${maxLength} characters`,
    );
  }

  if (pattern && !pattern.test(trimmed)) {
    throw new ValidationError(
      field,
      value,
      `${field} contains invalid characters`,
    );
  }

  return trimmed;
};

// Game-specific validators
export const validateTicketPrice = (price: unknown): number => {
  return validateNumber(
    price,
    "Ticket price",
    CONSTRAINTS.MIN_TICKET_PRICE,
    CONSTRAINTS.MAX_TICKET_PRICE,
  );
};

export const validateBandName = (name: unknown): string => {
  return validateString(
    name,
    "Band name",
    CONSTRAINTS.MIN_NAME_LENGTH,
    CONSTRAINTS.MAX_NAME_LENGTH,
    CONSTRAINTS.NAME_PATTERN,
  );
};

export const validateVenueName = (name: unknown): string => {
  return validateString(
    name,
    "Venue name",
    CONSTRAINTS.MIN_NAME_LENGTH,
    CONSTRAINTS.MAX_NAME_LENGTH,
    CONSTRAINTS.NAME_PATTERN,
  );
};

export const validateVenueCapacity = (capacity: unknown): number => {
  return validateNumber(
    capacity,
    "Venue capacity",
    CONSTRAINTS.MIN_CAPACITY,
    CONSTRAINTS.MAX_CAPACITY,
  );
};

export const validateVenueRent = (rent: unknown): number => {
  return validateNumber(
    rent,
    "Venue rent",
    CONSTRAINTS.MIN_RENT,
    CONSTRAINTS.MAX_RENT,
  );
};

export const validateResources = (resources: {
  money?: unknown;
  reputation?: unknown;
  fans?: unknown;
  stress?: unknown;
  connections?: unknown;
}): Partial<Resources> => {
  const validated: Partial<Resources> = {};

  if (resources.money !== undefined) {
    validated.money = validateNumber(
      resources.money,
      "Money",
      CONSTRAINTS.MIN_MONEY,
      CONSTRAINTS.MAX_MONEY,
    );
  }

  if (resources.reputation !== undefined) {
    validated.reputation = validateNumber(
      resources.reputation,
      "Reputation",
      CONSTRAINTS.MIN_REPUTATION,
      CONSTRAINTS.MAX_REPUTATION,
    );
  }

  if (resources.fans !== undefined) {
    validated.fans = validateNumber(
      resources.fans,
      "Fans",
      CONSTRAINTS.MIN_FANS,
      CONSTRAINTS.MAX_FANS,
    );
  }

  if (resources.stress !== undefined) {
    validated.stress = validateNumber(
      resources.stress,
      "Stress",
      CONSTRAINTS.MIN_STRESS,
      CONSTRAINTS.MAX_STRESS,
    );
  }

  if (resources.connections !== undefined) {
    validated.connections = validateNumber(
      resources.connections,
      "Connections",
      CONSTRAINTS.MIN_CONNECTIONS,
      CONSTRAINTS.MAX_CONNECTIONS,
    );
  }

  return validated;
};

// Show validation
export const validateShow = (show: Partial<Show>) => {
  const errors: ValidationError[] = [];

  try {
    if (show.ticketPrice !== undefined) {
      validateTicketPrice(show.ticketPrice);
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Show validation failed: ${errors.map((e) => e.message).join(", ")}`,
    );
  }

  return true;
};

// Band validation
export const validateBand = (band: Partial<Band>) => {
  const errors: ValidationError[] = [];

  try {
    if (band.name !== undefined) {
      validateBandName(band.name);
    }

    if (band.popularity !== undefined) {
      validateNumber(
        band.popularity,
        "Popularity",
        CONSTRAINTS.MIN_POPULARITY,
        CONSTRAINTS.MAX_POPULARITY,
      );
    }

    if (band.energy !== undefined) {
      validateNumber(
        band.energy,
        "Energy",
        CONSTRAINTS.MIN_ENERGY,
        CONSTRAINTS.MAX_ENERGY,
      );
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Band validation failed: ${errors.map((e) => e.message).join(", ")}`,
    );
  }

  return true;
};

// Venue validation
export const validateVenue = (venue: Partial<Venue>) => {
  const errors: ValidationError[] = [];

  try {
    if (venue.name !== undefined) {
      validateVenueName(venue.name);
    }

    if (venue.capacity !== undefined) {
      validateVenueCapacity(venue.capacity);
    }

    if (venue.rent !== undefined) {
      validateVenueRent(venue.rent);
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Venue validation failed: ${errors.map((e) => e.message).join(", ")}`,
    );
  }

  return true;
};

// Clamp utility to ensure values stay within bounds
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

// Safe resource update
export const safeUpdateResources = (
  current: {
    money: number;
    reputation: number;
    fans: number;
    stress: number;
    connections: number;
  },
  changes: {
    money?: number;
    reputation?: number;
    fans?: number;
    stress?: number;
    connections?: number;
  },
) => {
  return {
    money: clamp(
      current.money + (changes.money || 0),
      CONSTRAINTS.MIN_MONEY,
      CONSTRAINTS.MAX_MONEY,
    ),
    reputation: clamp(
      current.reputation + (changes.reputation || 0),
      CONSTRAINTS.MIN_REPUTATION,
      CONSTRAINTS.MAX_REPUTATION,
    ),
    fans: clamp(
      current.fans + (changes.fans || 0),
      CONSTRAINTS.MIN_FANS,
      CONSTRAINTS.MAX_FANS,
    ),
    stress: clamp(
      current.stress + (changes.stress || 0),
      CONSTRAINTS.MIN_STRESS,
      CONSTRAINTS.MAX_STRESS,
    ),
    connections: clamp(
      current.connections + (changes.connections || 0),
      CONSTRAINTS.MIN_CONNECTIONS,
      CONSTRAINTS.MAX_CONNECTIONS,
    ),
  };
};
