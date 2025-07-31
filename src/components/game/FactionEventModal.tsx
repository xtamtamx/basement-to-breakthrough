import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FactionEvent } from "@game/types";
import { haptics } from "@utils/mobile";
import { audio } from "@utils/audio";

interface FactionEventModalProps {
  event: FactionEvent | null;
  onChoice: (eventId: string, choiceId: string) => void;
}

export const FactionEventModal: React.FC<FactionEventModalProps> = ({
  event,
  onChoice,
}) => {
  if (!event) return null;

  const handleChoice = (choiceId: string) => {
    haptics.medium();
    audio.play("click");
    onChoice(event.id, choiceId);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="glass-panel p-6 max-w-md w-full"
        >
          <div className="text-center mb-4">
            <h2
              className="pixel-text pixel-text-lg pixel-text-shadow"
              style={{ color: "var(--pixel-red)" }}
            >
              FACTION EVENT
            </h2>
          </div>

          <h3
            className="pixel-text pixel-text-sm mb-3"
            style={{ color: "var(--pixel-yellow)" }}
          >
            {event.title}
          </h3>

          <p
            className="pixel-text pixel-text-xs mb-6"
            style={{ color: "var(--pixel-white)", lineHeight: "1.5" }}
          >
            {event.description}
          </p>

          <div className="space-y-3">
            {event.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice.id)}
                className="w-full glass-button p-3 text-left hover:scale-102 transition-transform"
              >
                <span className="pixel-text pixel-text-sm">{choice.text}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
