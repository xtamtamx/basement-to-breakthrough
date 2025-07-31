import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Band, Venue } from "@game/types";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { audio } from "@utils/audio";

interface MapBasedBookingProps {
  bands: Band[];
  venues: Venue[];
  onBookShow: (bands: Band[], venue: Venue) => void;
  phase: GamePhase;
  turn: number;
}

// Generate pseudo-random but consistent positions for venues
const getVenuePosition = (venueId: string, index: number) => {
  const positions = [
    { x: 15, y: 20 }, // Top left
    { x: 65, y: 15 }, // Top right
    { x: 40, y: 35 }, // Center
    { x: 20, y: 55 }, // Bottom left
    { x: 70, y: 50 }, // Bottom right
    { x: 85, y: 35 }, // Right
  ];
  return positions[index % positions.length];
};

export const MapBasedBooking: React.FC<MapBasedBookingProps> = ({
  bands,
  venues,
  onBookShow,
  turn,
}) => {
  const { money, reputation } = useGameStore();
  const [draggedBand, setDraggedBand] = useState<Band | null>(null);
  const [selectedBand, setSelectedBand] = useState<Band | null>(null);
  const [hoveredVenue, setHoveredVenue] = useState<string | null>(null);
  const [bookedShows, setBookedShows] = useState<Map<string, Band[]>>(
    new Map(),
  );

  const handleBandSelect = useCallback((band: Band) => {
    setSelectedBand(band);
    haptics.light();
  }, []);

  const handleVenueClick = useCallback(
    (venue: Venue) => {
      if (!selectedBand) return;

      if (bookedShows.has(venue.id)) {
        haptics.error();
        return;
      }

      onBookShow([selectedBand], venue);
      setBookedShows((prev) => new Map(prev).set(venue.id, [selectedBand]));
      setSelectedBand(null);
      haptics.success();
      audio.play("success");
    },
    [selectedBand, bookedShows, onBookShow],
  );

  const handleVenueDrop = useCallback(
    (venue: Venue) => {
      if (!draggedBand) return;

      if (bookedShows.has(venue.id)) {
        haptics.error();
        return;
      }

      onBookShow([draggedBand], venue);
      setBookedShows((prev) => new Map(prev).set(venue.id, [draggedBand]));
      setDraggedBand(null);
      haptics.success();
      audio.play("success");
    },
    [draggedBand, bookedShows, onBookShow],
  );

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ backgroundColor: "#1a1a1a" }}
    >
      {/* Top Bar */}
      <div
        className="h-12 flex items-center justify-between px-4"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          borderBottom: "1px solid rgba(236, 72, 153, 0.3)",
        }}
      >
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold" style={{ color: "#ec4899" }}>
            BOOK SHOWS
          </h1>
          <div className="flex gap-4 text-sm">
            <span style={{ color: "#10b981" }}>Turn {turn}</span>
            <span style={{ color: "#fbbf24" }}>${money}</span>
            <span style={{ color: "#a855f7" }}>{reputation} REP</span>
          </div>
        </div>

        <motion.button
          className="px-6 py-1.5 rounded text-sm font-bold"
          style={{
            backgroundColor: bookedShows.size > 0 ? "#ec4899" : "#374151",
            color: bookedShows.size > 0 ? "#ffffff" : "#6b7280",
          }}
          whileHover={bookedShows.size > 0 ? { scale: 1.05 } : {}}
          whileTap={bookedShows.size > 0 ? { scale: 0.95 } : {}}
          disabled={bookedShows.size === 0}
        >
          EXECUTE ({bookedShows.size})
        </motion.button>
      </div>

      {/* Main Area - City Map */}
      <div className="flex-1 relative overflow-hidden">
        {/* City Background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom right, #2a2a2a, #1a1a1a, #2a2a2a)",
          }}
        >
          {/* Grid overlay */}
          <div
            className="absolute inset-0"
            style={{
              opacity: 0.2,
              backgroundImage: `
              linear-gradient(rgba(236,72,153,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(236,72,153,0.4) 1px, transparent 1px)
            `,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Venue Nodes on Map */}
        {venues.map((venue, index) => {
          const pos = getVenuePosition(venue.id, index);
          const isBooked = bookedShows.has(venue.id);
          const bookedBand = bookedShows.get(venue.id)?.[0];

          return (
            <motion.div
              key={venue.id}
              className="absolute"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              animate={{
                scale: hoveredVenue === venue.id ? 1.1 : 1,
              }}
            >
              <motion.div
                className="relative cursor-pointer"
                onClick={() => handleVenueClick(venue)}
                onMouseEnter={() => setHoveredVenue(venue.id)}
                onMouseLeave={() => setHoveredVenue(null)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setHoveredVenue(venue.id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleVenueDrop(venue);
                }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Venue Building Icon */}
                <div
                  className="w-20 h-20 rounded-lg flex items-center justify-center relative"
                  style={{
                    backgroundColor: isBooked
                      ? "rgba(16, 185, 129, 0.4)"
                      : "rgba(45, 45, 45, 0.95)",
                    border: `3px solid ${
                      isBooked
                        ? "#10b981"
                        : hoveredVenue === venue.id
                          ? "#ec4899"
                          : "rgba(236, 72, 153, 0.5)"
                    }`,
                    borderStyle: draggedBand && !isBooked ? "dashed" : "solid",
                    boxShadow:
                      hoveredVenue === venue.id
                        ? "0 0 30px rgba(236, 72, 153, 0.7)"
                        : isBooked
                          ? "0 0 20px rgba(16, 185, 129, 0.7)"
                          : "0 4px 8px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  <div className="text-3xl">
                    {venue.type === "BASEMENT"
                      ? "🏠"
                      : venue.type === "DIVE_BAR"
                        ? "🍺"
                        : venue.type === "UNDERGROUND"
                          ? "🎸"
                          : venue.type === "WAREHOUSE"
                            ? "🏭"
                            : "🎵"}
                  </div>
                </div>

                {/* Venue Label */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center">
                  <p
                    className="text-xs font-bold"
                    style={{
                      color: "#ffffff",
                      textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                    }}
                  >
                    {venue.name}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: isBooked ? "#10b981" : "#9ca3af" }}
                  >
                    {isBooked ? "✓ Booked" : `$${venue.rent}`}
                  </p>
                </div>

                {/* Booked Band Indicator */}
                {isBooked && bookedBand && (
                  <div className="absolute -top-2 -right-2 bg-green-500 rounded-full px-2 py-1">
                    <p className="text-xs text-white font-bold">!</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })}

        {/* Connection Lines */}
        <svg className="absolute inset-0 pointer-events-none">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Draw some connection lines between venues */}
          <line
            x1="15%"
            y1="20%"
            x2="40%"
            y2="35%"
            stroke="rgba(236,72,153,0.3)"
            strokeWidth="2"
            strokeDasharray="5,5"
            opacity="0.5"
          />
          <line
            x1="40%"
            y1="35%"
            x2="65%"
            y2="15%"
            stroke="rgba(236,72,153,0.3)"
            strokeWidth="2"
            strokeDasharray="5,5"
            opacity="0.5"
          />
          <line
            x1="40%"
            y1="35%"
            x2="20%"
            y2="55%"
            stroke="rgba(236,72,153,0.3)"
            strokeWidth="2"
            strokeDasharray="5,5"
            opacity="0.5"
          />
        </svg>
      </div>

      {/* Bottom Area - Band Hand */}
      <div
        className="h-32 p-2"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          borderTop: "1px solid rgba(236, 72, 153, 0.3)",
        }}
      >
        <div className="flex gap-2 h-full items-center justify-center">
          {bands.map((band) => {
            const isBooked = Array.from(bookedShows.values()).some((lineup) =>
              lineup.some((b) => b.id === band.id),
            );
            const isSelected = selectedBand?.id === band.id;

            return (
              <motion.div
                key={band.id}
                className="relative cursor-pointer"
                draggable={!isBooked}
                onDragStart={() => !isBooked && setDraggedBand(band)}
                onDragEnd={() => setDraggedBand(null)}
                onClick={() => !isBooked && handleBandSelect(band)}
                whileHover={!isBooked ? { y: -10 } : {}}
                whileTap={!isBooked ? { scale: 0.95 } : {}}
                animate={{
                  y: isSelected ? -20 : 0,
                  scale: isSelected ? 1.05 : 1,
                }}
              >
                <div
                  className="w-32 h-24 rounded-lg p-2 relative overflow-hidden"
                  style={{
                    backgroundColor: isBooked
                      ? "rgba(75, 75, 75, 0.5)"
                      : isSelected
                        ? "rgba(236, 72, 153, 0.4)"
                        : "rgba(30, 30, 30, 0.95)",
                    border: `2px solid ${
                      isSelected
                        ? "#ec4899"
                        : isBooked
                          ? "#4b5563"
                          : "rgba(236, 72, 153, 0.3)"
                    }`,
                    opacity: isBooked ? 0.5 : 1,
                    boxShadow: isSelected
                      ? "0 0 20px rgba(236, 72, 153, 0.5)"
                      : "none",
                  }}
                >
                  <h3 className="text-xs font-bold text-white mb-1 truncate">
                    {band.name}
                  </h3>
                  <p className="text-xs text-gray-400">{band.genre}</p>
                  <p className="text-xs text-gray-500">
                    Pop: {band.popularity}
                  </p>

                  {isBooked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="text-xs text-gray-400">BOOKED</span>
                    </div>
                  )}

                  {isSelected && !isBooked && (
                    <div className="absolute top-1 right-1">
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
          <p className="text-xs" style={{ color: "#6b7280" }}>
            Click to select • Drag to venue • Click venue to book
          </p>
        </div>
      </div>
    </div>
  );
};
