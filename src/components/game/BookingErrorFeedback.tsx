import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { haptics } from "@utils/mobile";
import { audio } from "@utils/audio";
import { SATIRICAL_ERROR_MESSAGES } from "@game/data/satiricalText";

interface BookingErrorFeedbackProps {
  error: {
    type:
      | "insufficient_funds"
      | "venue_booked"
      | "invalid_lineup"
      | "capacity_exceeded";
    message: string;
    position: { x: number; y: number };
  } | null;
  onDismiss: () => void;
}

export const BookingErrorFeedback: React.FC<BookingErrorFeedbackProps> = ({
  error,
  onDismiss,
}) => {
  useEffect(() => {
    if (error) {
      // Haptic feedback
      haptics.error();

      // Audio feedback
      audio.play("error");

      // Auto dismiss after 3 seconds
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, onDismiss]);

  if (!error) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed pointer-events-none"
        style={{
          left: error.position.x,
          top: error.position.y,
          transform: "translate(-50%, -50%)",
          zIndex: 2000,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
      >
        {/* Error shake animation */}
        <motion.div
          animate={{
            x: [0, -10, 10, -10, 10, 0],
          }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
          }}
        >
          <div
            className="glass-panel p-4 border-2"
            style={{
              borderColor: "var(--pixel-red)",
              backgroundColor: "rgba(255, 0, 110, 0.1)",
              minWidth: "200px",
            }}
          >
            {/* Error icon */}
            <motion.div
              className="text-center mb-2"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: 3,
              }}
            >
              <span className="text-3xl">⚠️</span>
            </motion.div>

            {/* Error message */}
            <p
              className="pixel-text pixel-text-sm text-center mb-2"
              style={{ color: "var(--pixel-red)" }}
            >
              {error.type === "insufficient_funds" && "NOT ENOUGH CASH"}
              {error.type === "venue_booked" && "VENUE ALREADY BOOKED"}
              {error.type === "invalid_lineup" && "INVALID LINEUP"}
              {error.type === "capacity_exceeded" && "VENUE TOO SMALL"}
            </p>

            <p
              className="pixel-text pixel-text-xs text-center"
              style={{ color: "var(--pixel-white)" }}
            >
              {error.type === "insufficient_funds" &&
                SATIRICAL_ERROR_MESSAGES.INSUFFICIENT_FUNDS}
              {error.type === "venue_booked" &&
                SATIRICAL_ERROR_MESSAGES.VENUE_BOOKED}
              {error.type === "invalid_lineup" &&
                SATIRICAL_ERROR_MESSAGES.INVALID_LINEUP}
              {error.type === "capacity_exceeded" &&
                SATIRICAL_ERROR_MESSAGES.CAPACITY_EXCEEDED}
            </p>

            {/* Visual feedback bars */}
            <div className="flex justify-center gap-1 mt-3">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-8 h-1"
                  style={{ backgroundColor: "var(--pixel-red)" }}
                  animate={{
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.1,
                    repeat: Infinity,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
