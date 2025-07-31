import React from "react";
import { motion } from "framer-motion";

interface BasicVenue {
  id: string;
  name: string;
  type: string;
}

interface FixedPixelMapProps {
  venues?: BasicVenue[];
  selectedVenue?: string | null;
  onVenueClick?: (venueId: string) => void;
}

export const FixedPixelMap: React.FC<FixedPixelMapProps> = ({
  venues = [],
  selectedVenue,
  onVenueClick,
}) => {
  // Default demo venues if none provided
  const defaultVenues = [
    { id: "v1", name: "The Pit", type: "warehouse" },
    { id: "v2", name: "The Dive", type: "dive_bar" },
    { id: "v3", name: "Basement", type: "basement" },
  ];

  const venuesToShow = venues.length > 0 ? venues : defaultVenues;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "#0A0A0A",
        border: "4px solid #2D2D2D",
        minHeight: "400px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
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
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#FF0066",
          fontSize: "20px",
          fontFamily: "monospace",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          textShadow: "2px 2px 0px #000",
        }}
      >
        Underground City
      </div>

      {/* Venue Container */}
      <div
        style={{
          position: "relative",
          width: "80%",
          maxWidth: "600px",
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
        }}
      >
        {venuesToShow.map((venue, index) => {
          const isSelected = selectedVenue === venue.id;

          return (
            <motion.div
              key={venue.id}
              style={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onVenueClick?.(venue.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Venue building */}
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  background:
                    venue.type === "warehouse"
                      ? "#5A5A5A"
                      : venue.type === "dive_bar"
                        ? "#8B4513"
                        : "#2D2D2D",
                  border: isSelected ? "3px solid #FF0066" : "3px solid #000",
                  boxShadow: isSelected ? "0 0 20px #FF0066" : "0 4px 0 #000",
                  imageRendering: "pixelated",
                  position: "relative",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gridTemplateRows: "1fr 1fr",
                  gap: "10px",
                  padding: "15px",
                }}
              >
                {/* Windows */}
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      background:
                        venue.type === "basement" && i > 2 ? "#000" : "#FFD700",
                      border: "2px solid #000",
                    }}
                  />
                ))}
              </div>

              {/* Venue label */}
              <div
                style={{
                  background: "rgba(0,0,0,0.9)",
                  border: "2px solid #FF0066",
                  padding: "4px 8px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  whiteSpace: "nowrap",
                  boxShadow: isSelected ? "0 0 10px #FF0066" : "none",
                }}
              >
                {venue.name}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Instructions */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          color: "#5A5A5A",
          fontSize: "12px",
          fontFamily: "monospace",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Click a venue to select
      </div>
    </div>
  );
};
