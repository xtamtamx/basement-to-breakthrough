import React, { forwardRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Band } from "@game/types";
import { billManager } from "@game/mechanics/BillManager";
import {
  synergyDiscoverySystem,
  SynergyCombo,
} from "@game/mechanics/SynergyDiscoverySystem";
import { haptics } from "@utils/mobile";

interface LineupStack {
  id: string;
  bands: Band[];
  position: { x: number; y: number };
  synergies: SynergyCombo[];
}

interface DraggedBand {
  band: Band;
  origin: "hand" | "workspace" | "venue";
  originId?: string;
}

interface LineupWorkspaceProps {
  lineupStacks: LineupStack[];
  onDrop: (position: { x: number; y: number }) => void;
  onBandDragStart: (band: Band, origin: "workspace", stackId: string) => void;
  onStackUpdate: (stacks: LineupStack[]) => void;
  draggedBand: DraggedBand | null;
}

export const LineupWorkspace = forwardRef<HTMLDivElement, LineupWorkspaceProps>(
  ({ lineupStacks, onDrop, onStackUpdate }, ref) => {
    const [dragOverStack, setDragOverStack] = useState<string | null>(null);

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const bandData = e.dataTransfer.getData("band");
      if (bandData) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        onDrop({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    };

    const handleStackDragOver = (stackId: string) => {
      setDragOverStack(stackId);
    };

    const handleStackDragLeave = () => {
      setDragOverStack(null);
    };

    const removeFromStack = (stackId: string, bandId: string) => {
      const updatedStacks = lineupStacks
        .map((stack) => {
          if (stack.id === stackId) {
            return {
              ...stack,
              bands: stack.bands.filter((b) => b.id !== bandId),
            };
          }
          return stack;
        })
        .filter((stack) => stack.bands.length > 0);

      onStackUpdate(updatedStacks);
      haptics.light();
    };

    const calculateStackSynergies = (bands: Band[]) => {
      if (bands.length < 2) return [];
      const synergies = synergyDiscoverySystem.checkBandSynergies(bands);
      return synergies;
    };

    return (
      <div
        ref={ref}
        className="h-full p-4 relative overflow-hidden punk-grunge"
        style={{
          backgroundColor: "var(--punk-concrete)",
          border: "2px solid var(--pixel-dark-gray)",
          backgroundImage: `
            repeating-linear-gradient(90deg, transparent, transparent 100px, rgba(157, 78, 221, 0.02) 100px, rgba(157, 78, 221, 0.02) 102px),
            repeating-linear-gradient(0deg, transparent, transparent 100px, rgba(0, 245, 255, 0.02) 100px, rgba(0, 245, 255, 0.02) 102px)
          `,
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <h2
          className="pixel-text pixel-text-sm mb-4 punk-neon-cyan"
          style={{ color: "var(--punk-neon-cyan)" }}
        >
          SHOW BUILDER
        </h2>

        {/* Instructions */}
        {lineupStacks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center opacity-20">
              <p
                className="pixel-text pixel-text-lg mb-2 punk-stencil"
                style={{ color: "var(--punk-neon-purple)" }}
              >
                DROP BANDS HERE
              </p>
              <p
                className="pixel-text pixel-text-sm"
                style={{ color: "var(--pixel-gray)" }}
              >
                BUILD YOUR LINEUP
              </p>
            </div>
          </div>
        )}

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #444 0, #444 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #444 0, #444 1px, transparent 1px, transparent 40px)",
          }}
        />

        {/* Lineup Stacks */}
        <AnimatePresence>
          {lineupStacks.map((stack) => {
            const synergies = calculateStackSynergies(stack.bands);
            const bill =
              stack.bands.length >= 2
                ? billManager.analyzeBill(stack.bands)
                : null;

            return (
              <motion.div
                key={stack.id}
                className={`
                  absolute punk-flyer p-3 
                  ${dragOverStack === stack.id ? "ring-2 ring-cyan-400" : ""}
                `}
                style={{
                  left: stack.position.x,
                  top: stack.position.y,
                  minWidth: "200px",
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}
                onDragOver={() => handleStackDragOver(stack.id)}
                onDragLeave={handleStackDragLeave}
                draggable
                onDragStart={() => {
                  // Handle drag start
                }}
              >
                {/* Stack Header */}
                <div className="mb-2 pb-2 border-b border-gray-700">
                  <div className="flex justify-between items-center">
                    <h3
                      className="pixel-text pixel-text-sm"
                      style={{ color: "var(--pixel-cyan)" }}
                    >
                      LINEUP
                    </h3>
                    <span
                      className="pixel-text pixel-text-xs"
                      style={{ color: "var(--pixel-gray)" }}
                    >
                      {stack.bands.length} BANDS
                    </span>
                  </div>

                  {/* Bill Dynamics */}
                  {bill && (
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      <div className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: "var(--pixel-green)" }}
                        />
                        <span
                          className="pixel-text"
                          style={{
                            fontSize: "8px",
                            color: "var(--pixel-gray)",
                          }}
                        >
                          CHEM: {bill.dynamics.chemistryScore}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: "var(--pixel-yellow)" }}
                        />
                        <span
                          className="pixel-text"
                          style={{
                            fontSize: "8px",
                            color: "var(--pixel-gray)",
                          }}
                        >
                          DRAW: {bill.dynamics.crowdAppeal}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bands in Stack */}
                <div className="space-y-2">
                  {stack.bands.map((band, index) => (
                    <div key={band.id} className="glass-panel p-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p
                            className="pixel-text pixel-text-sm"
                            style={{ color: "var(--pixel-cyan)" }}
                          >
                            {band.name}
                          </p>
                          <p
                            className="pixel-text pixel-text-xs"
                            style={{ color: "var(--pixel-gray)" }}
                          >
                            {index === 0 ? "HEADLINER" : `OPENER ${index}`}
                          </p>
                        </div>
                        <button
                          className="pixel-text pixel-text-xs hover:text-red-400 transition-colors"
                          style={{ color: "var(--pixel-gray)" }}
                          onClick={() => removeFromStack(stack.id, band.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Synergies */}
                {synergies.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-700">
                    <p
                      className="pixel-text pixel-text-xs mb-1"
                      style={{ color: "var(--pixel-magenta)" }}
                    >
                      SYNERGIES:
                    </p>
                    <div className="space-y-1">
                      {synergies.slice(0, 3).map((synergy, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span>{synergy.icon}</span>
                          <span
                            className="pixel-text"
                            style={{
                              fontSize: "8px",
                              color: "var(--pixel-cyan)",
                            }}
                          >
                            {synergy.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drag to Venue Hint */}
                <div className="mt-3 text-center">
                  <p
                    className="pixel-text pixel-text-xs animate-pulse"
                    style={{ color: "var(--pixel-yellow)" }}
                  >
                    DRAG TO VENUE →
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  },
);

LineupWorkspace.displayName = "LineupWorkspace";
