import React, { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";

interface GameLayoutProps {
  children: ReactNode;
  hud?: ReactNode;
  overlays?: ReactNode;
  modals?: ReactNode;
}

// Z-index scale for consistent layering
const Z_INDEX = {
  BACKGROUND: 0,
  GAME_BOARD: 10,
  HUD: 20,
  OVERLAYS: 30,
  MODALS: 40,
  CRITICAL: 50,
} as const;

export const GameLayout: React.FC<GameLayoutProps> = ({
  children,
  hud,
  overlays,
  modals,
}) => {
  return (
    <div className="game-root h-screen w-screen overflow-hidden bg-[#0F0F0F]">
      {/* Background Layer */}
      <div className="absolute inset-0" style={{ zIndex: Z_INDEX.BACKGROUND }}>
        {/* Punk texture overlay */}
        <div className="absolute inset-0 punk-grunge opacity-20" />

        {/* Venue photography texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
            radial-gradient(circle at 20% 30%, var(--punk-neon-purple) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, var(--punk-neon-cyan) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, var(--pixel-dark-purple) 0%, transparent 60%)
          `,
          }}
        />
      </div>

      {/* Game Board Layer */}
      <div
        className="relative h-full w-full"
        style={{ zIndex: Z_INDEX.GAME_BOARD }}
      >
        {children}
      </div>

      {/* HUD Layer - Non-blocking with pointer-events-none */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: Z_INDEX.HUD }}
      >
        {hud}
      </div>

      {/* Overlays Layer - For notifications, tooltips */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: Z_INDEX.OVERLAYS }}
      >
        <AnimatePresence>{overlays}</AnimatePresence>
      </div>

      {/* Modals Layer - Always on top with backdrop */}
      <div className="modal-container" style={{ zIndex: Z_INDEX.MODALS }}>
        <AnimatePresence>{modals}</AnimatePresence>
      </div>
    </div>
  );
};
