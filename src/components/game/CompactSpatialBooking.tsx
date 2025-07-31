import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Band, Venue, GamePhase } from "@game/types";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";
import { audio } from "@utils/audio";

interface CompactSpatialBookingProps {
  bands: Band[];
  venues: Venue[];
  onBookShow: (bands: Band[], venue: Venue) => void;
  phase: GamePhase;
  turn: number;
}

export const CompactSpatialBooking: React.FC<CompactSpatialBookingProps> = ({
  bands,
  venues,
  onBookShow,
  turn,
}) => {
  const { money, reputation } = useGameStore();
  const [draggedBand, setDraggedBand] = useState<Band | null>(null);
  const [selectedBands, setSelectedBands] = useState<Band[]>([]);
  const [hoveredVenue, setHoveredVenue] = useState<string | null>(null);
  const [bookedShows, setBookedShows] = useState<Map<string, Band[]>>(
    new Map(),
  );

  // Handle band selection
  const handleBandClick = useCallback((band: Band) => {
    setSelectedBands((prev) => {
      const isSelected = prev.some((b) => b.id === band.id);
      if (isSelected) {
        return prev.filter((b) => b.id !== band.id);
      } else {
        return [...prev, band];
      }
    });
    haptics.light();
  }, []);

  // Handle venue click - book selected bands
  const handleVenueClick = useCallback(
    (venue: Venue) => {
      if (selectedBands.length === 0) {
        haptics.error();
        return;
      }

      if (bookedShows.has(venue.id)) {
        haptics.error();
        return;
      }

      // Book the show
      onBookShow(selectedBands, venue);
      setBookedShows((prev) => new Map(prev).set(venue.id, selectedBands));
      setSelectedBands([]);
      haptics.success();
      audio.play("success");
    },
    [selectedBands, bookedShows, onBookShow],
  );

  // Handle drop on venue
  const handleVenueDrop = useCallback(
    (venue: Venue) => {
      if (!draggedBand) return;

      if (bookedShows.has(venue.id)) {
        haptics.error();
        return;
      }

      const lineup = selectedBands.includes(draggedBand)
        ? selectedBands
        : [draggedBand];

      onBookShow(lineup, venue);
      setBookedShows((prev) => new Map(prev).set(venue.id, lineup));
      setSelectedBands([]);
      setDraggedBand(null);
      haptics.success();
      audio.play("success");
    },
    [draggedBand, selectedBands, bookedShows, onBookShow],
  );

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ backgroundColor: "#0F0F0F" }}
    >
      {/* Header Bar */}
      <div
        className="h-16 flex items-center justify-between px-6"
        style={{
          backgroundColor: "rgba(30, 30, 30, 0.95)",
          borderBottom: "1px solid rgba(236, 72, 153, 0.3)",
        }}
      >
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold" style={{ color: "#ec4899" }}>
            BOOK SHOWS - TURN {turn}
          </h1>
          <div className="flex gap-4 text-sm">
            <span style={{ color: "#10b981" }}>${money}</span>
            <span style={{ color: "#f59e0b" }}>{reputation} REP</span>
          </div>
        </div>

        {selectedBands.length > 0 && (
          <div className="text-sm" style={{ color: "#fbbf24" }}>
            {selectedBands.length} band{selectedBands.length > 1 ? "s" : ""}{" "}
            selected
          </div>
        )}

        <motion.button
          className="px-6 py-2 rounded font-bold transition-all"
          style={{
            backgroundColor: bookedShows.size > 0 ? "#ec4899" : "#374151",
            color: bookedShows.size > 0 ? "#ffffff" : "#6b7280",
            cursor: bookedShows.size > 0 ? "pointer" : "not-allowed",
          }}
          whileHover={bookedShows.size > 0 ? { scale: 1.05 } : {}}
          whileTap={bookedShows.size > 0 ? { scale: 0.95 } : {}}
          disabled={bookedShows.size === 0}
        >
          EXECUTE ({bookedShows.size})
        </motion.button>
      </div>

      {/* Main Content - No Scroll */}
      <div className="flex-1 flex p-4 gap-4 overflow-hidden">
        {/* Left Panel - Venues (Compact Grid) */}
        <div className="w-1/2 flex flex-col">
          <h2 className="text-lg font-bold mb-3" style={{ color: "#ec4899" }}>
            VENUES
          </h2>

          <div className="grid grid-cols-2 gap-3 auto-rows-min">
            {venues.slice(0, 4).map((venue) => {
              const isBooked = bookedShows.has(venue.id);
              const bookedBands = bookedShows.get(venue.id) || [];

              return (
                <motion.div
                  key={venue.id}
                  className="p-3 rounded cursor-pointer relative"
                  style={{
                    backgroundColor: isBooked
                      ? "rgba(16, 185, 129, 0.2)"
                      : "rgba(45, 45, 45, 0.8)",
                    border: `2px solid ${isBooked ? "#10b981" : hoveredVenue === venue.id ? "#ec4899" : "rgba(219, 39, 119, 0.3)"}`,
                    borderStyle: draggedBand ? "dashed" : "solid",
                  }}
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <h3
                    className="font-bold text-sm mb-1"
                    style={{ color: "#ffffff" }}
                  >
                    {venue.name}
                  </h3>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>
                    Cap: {venue.capacity} | ${venue.rent}
                  </p>

                  {isBooked && (
                    <div className="mt-2 text-xs" style={{ color: "#10b981" }}>
                      ✓ {bookedBands.length} band
                      {bookedBands.length > 1 ? "s" : ""}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {venues.length > 4 && (
            <p className="text-xs mt-2" style={{ color: "#6b7280" }}>
              +{venues.length - 4} more venues available
            </p>
          )}
        </div>

        {/* Right Panel - Bands (Compact List) */}
        <div className="w-1/2 flex flex-col">
          <h2 className="text-lg font-bold mb-3" style={{ color: "#ec4899" }}>
            BANDS
          </h2>

          <div
            className="space-y-2 overflow-y-auto"
            style={{ maxHeight: "calc(100% - 40px)" }}
          >
            {bands.map((band) => {
              const isSelected = selectedBands.some((b) => b.id === band.id);
              const isBooked = Array.from(bookedShows.values()).some((lineup) =>
                lineup.some((b) => b.id === band.id),
              );

              return (
                <motion.div
                  key={band.id}
                  className="p-3 rounded cursor-pointer flex items-center justify-between"
                  style={{
                    backgroundColor: isBooked
                      ? "rgba(75, 75, 75, 0.5)"
                      : isSelected
                        ? "rgba(236, 72, 153, 0.3)"
                        : "rgba(45, 45, 45, 0.8)",
                    border: `1px solid ${isSelected ? "#ec4899" : "rgba(219, 39, 119, 0.3)"}`,
                    opacity: isBooked ? 0.5 : 1,
                  }}
                  onClick={() => !isBooked && handleBandClick(band)}
                  draggable={!isBooked}
                  onDragStart={() => setDraggedBand(band)}
                  onDragEnd={() => setDraggedBand(null)}
                  whileHover={!isBooked ? { x: 5 } : {}}
                  whileTap={!isBooked ? { scale: 0.98 } : {}}
                >
                  <div className="flex-1">
                    <h3
                      className="font-bold text-sm"
                      style={{ color: "#ffffff" }}
                    >
                      {band.name}
                    </h3>
                    <p className="text-xs" style={{ color: "#9ca3af" }}>
                      {band.genre} | Pop: {band.popularity}
                    </p>
                  </div>

                  {isBooked && (
                    <span className="text-xs" style={{ color: "#6b7280" }}>
                      BOOKED
                    </span>
                  )}
                  {isSelected && !isBooked && (
                    <span style={{ color: "#ec4899" }}>✓</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Instructions Bar */}
      <div
        className="h-10 flex items-center justify-center px-6"
        style={{
          backgroundColor: "rgba(30, 30, 30, 0.95)",
          borderTop: "1px solid rgba(236, 72, 153, 0.3)",
        }}
      >
        <p className="text-xs" style={{ color: "#9ca3af" }}>
          Click to select bands • Click venue to book • Drag bands to venues
        </p>
      </div>
    </div>
  );
};
