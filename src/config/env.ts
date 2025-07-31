import { devLog } from "../utils/devLogger";

// Environment variable configuration with type safety and defaults

interface EnvConfig {
  // API Configuration
  apiUrl: string;
  apiTimeout: number;

  // Feature Flags
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
  enableDebugMode: boolean;

  // Game Configuration
  maxSaveSlots: number;
  autoSaveInterval: number;

  // Audio Configuration
  enableAudio: boolean;
  defaultMusicVolume: number;
  defaultSfxVolume: number;

  // Performance Configuration
  targetFps: number;
  lowPerformanceMode: boolean;

  // Build Configuration
  buildVersion: string;
  buildDate: string;

  // Runtime Environment
  isDevelopment: boolean;
  isProduction: boolean;
}

// Helper to parse boolean environment variables
const parseBoolean = (
  value: string | undefined,
  defaultValue: boolean,
): boolean => {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === "true";
};

// Helper to parse number environment variables
const parseNumber = (
  value: string | undefined,
  defaultValue: number,
): number => {
  if (value === undefined) return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Create configuration object with defaults
export const env: EnvConfig = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:3000",
  apiTimeout: parseNumber(import.meta.env.VITE_API_TIMEOUT, 30000),

  // Feature Flags
  enableAnalytics: parseBoolean(import.meta.env.VITE_ENABLE_ANALYTICS, false),
  enableErrorReporting: parseBoolean(
    import.meta.env.VITE_ENABLE_ERROR_REPORTING,
    false,
  ),
  enableDebugMode: parseBoolean(import.meta.env.VITE_ENABLE_DEBUG_MODE, false),

  // Game Configuration
  maxSaveSlots: parseNumber(import.meta.env.VITE_MAX_SAVE_SLOTS, 10),
  autoSaveInterval: parseNumber(import.meta.env.VITE_AUTO_SAVE_INTERVAL, 60000),

  // Audio Configuration
  enableAudio: parseBoolean(import.meta.env.VITE_ENABLE_AUDIO, true),
  defaultMusicVolume: parseNumber(
    import.meta.env.VITE_DEFAULT_MUSIC_VOLUME,
    0.3,
  ),
  defaultSfxVolume: parseNumber(import.meta.env.VITE_DEFAULT_SFX_VOLUME, 0.5),

  // Performance Configuration
  targetFps: parseNumber(import.meta.env.VITE_TARGET_FPS, 60),
  lowPerformanceMode: parseBoolean(
    import.meta.env.VITE_LOW_PERFORMANCE_MODE,
    false,
  ),

  // Build Configuration
  buildVersion: import.meta.env.VITE_BUILD_VERSION || "0.0.0",
  buildDate: import.meta.env.VITE_BUILD_DATE || new Date().toISOString(),

  // Runtime Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Log configuration in development
if (env.isDevelopment && env.enableDebugMode) {
  devLog.log("Environment Configuration:", env);
}

// Freeze configuration to prevent accidental mutations
Object.freeze(env);
