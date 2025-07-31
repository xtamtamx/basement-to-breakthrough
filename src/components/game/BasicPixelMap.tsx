import React from "react";
import { motion } from "framer-motion";
import { VenueType } from "@game/types";

interface BasicVenue {
  id: string;
  name: string;
  type: VenueType | string;
  x?: number;
  y?: number;
}

interface BasicPixelMapProps {
  venues?: BasicVenue[];
  selectedVenue?: string | null;
  onVenueClick?: (venueId: string) => void;
  className?: string;
}

export const BasicPixelMap: React.FC<BasicPixelMapProps> = ({
  venues = [],
  selectedVenue,
  onVenueClick,
  className = "",
}) => {
  // Default demo venues if none provided
  const defaultVenues = [
    { id: "v1", name: "The Pit", type: "warehouse", x: 100, y: 100 },
    { id: "v2", name: "The Dive", type: "dive_bar", x: 300, y: 100 },
    { id: "v3", name: "Basement", type: "basement", x: 200, y: 250 },
  ];

  const venuesToShow = venues.length > 0 ? venues : defaultVenues;

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "400px",
        position: "relative",
        background: "#0A0A0A",
        border: "4px solid #2D2D2D",
        overflow: "hidden",
      }}
    >
      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          pointerEvents: "none",
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#FF0066",
          fontSize: "14px",
          fontFamily: "monospace",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        City Map
      </div>

      {/* Render venues as simple pixel blocks */}
      {venuesToShow.map((venue) => {
        const isSelected = selectedVenue === venue.id;
        const x = venue.x || Math.random() * 300 + 50;
        const y = venue.y || Math.random() * 250 + 75;

        return (
          <motion.div
            key={venue.id}
            style={{
              position: "absolute",
              left: `${x}px`,
              top: `${y}px`,
              cursor: "pointer",
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onVenueClick?.(venue.id)}
          >
            {/* Venue building - simple pixel art */}
            <div
              style={{
                width: "40px",
                height: "40px",
                background:
                  venue.type === "warehouse"
                    ? "#5A5A5A"
                    : venue.type === "dive_bar"
                      ? "#8B4513"
                      : venue.type === "basement"
                        ? "#2D2D2D"
                        : "#696969",
                border: isSelected ? "2px solid #FF0066" : "2px solid #000",
                boxShadow: isSelected ? "0 0 10px #FF0066" : "none",
                imageRendering: "pixelated",
                position: "relative",
              }}
            >
              {/* Simple windows */}
              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  left: "8px",
                  width: "8px",
                  height: "8px",
                  background: "#FFD700",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  width: "8px",
                  height: "8px",
                  background: "#FFD700",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "8px",
                  left: "8px",
                  width: "8px",
                  height: "8px",
                  background: venue.type === "basement" ? "#000" : "#FFD700",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "8px",
                  right: "8px",
                  width: "8px",
                  height: "8px",
                  background: venue.type === "basement" ? "#000" : "#FFD700",
                }}
              />
            </div>

            {/* Venue label */}
            <div
              style={{
                marginTop: "4px",
                background: "rgba(0,0,0,0.9)",
                border: "1px solid #FF0066",
                padding: "2px 4px",
                fontSize: "10px",
                fontFamily: "monospace",
                fontWeight: 700,
                color: "#FFFFFF",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                whiteSpace: "nowrap",
                textAlign: "center",
              }}
            >
              {venue.name}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
