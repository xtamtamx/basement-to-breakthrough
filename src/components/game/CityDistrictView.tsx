import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@stores/gameStore";
import { District, Venue, VenueType } from "@game/types";
import { haptics } from "@utils/mobile";
import { WalkerSprite } from "./WalkerSprite";

interface CityDistrictViewProps {
  onVenueClick: (venue: Venue) => void;
  onDistrictClick: (district: District) => void;
  onEmptyCellClick?: (x: number, y: number, district: District) => void;
  placingMode?: boolean;
  zoomedDistrict?: District | null;
}

// Grid-based city layout
const GRID_SIZE = 8;
const CELL_SIZE = 45;

export const CityDistrictView: React.FC<CityDistrictViewProps> = ({
  onVenueClick,
  onDistrictClick,
  onEmptyCellClick,
  placingMode = false,
  zoomedDistrict,
}) => {
  const { districts, venues, walkers, scheduledShows } = useGameStore();
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
  } | null>(null);
  // Calculate grid bounds based on zoom
  const gridBounds = zoomedDistrict
    ? zoomedDistrict.bounds
    : { x: 0, y: 0, width: GRID_SIZE, height: GRID_SIZE };

  const effectiveCellSize = zoomedDistrict ? 80 : CELL_SIZE;

  const handleCellClick = (x: number, y: number) => {
    const venue = venues.find(
      (v) => v.gridPosition?.x === x && v.gridPosition?.y === y,
    );
    if (venue) {
      haptics.light();
      onVenueClick(venue);
    } else {
      // Check which district this cell belongs to
      const district = districts.find(
        (d) =>
          x >= d.bounds.x &&
          x < d.bounds.x + d.bounds.width &&
          y >= d.bounds.y &&
          y < d.bounds.y + d.bounds.height,
      );
      if (district) {
        haptics.light();
        if (placingMode && onEmptyCellClick) {
          onEmptyCellClick(x, y, district);
        } else {
          onDistrictClick(district);
        }
      }
    }
  };

  // Filter districts to show
  const visibleDistricts = zoomedDistrict ? [zoomedDistrict] : districts;

  return (
    <div className="city-district-wrapper">
      <div
        className="city-district-view"
        style={{
          width: `${gridBounds.width * effectiveCellSize}px`,
          height: `${gridBounds.height * effectiveCellSize}px`,
        }}
      >
        {/* District backgrounds */}
        {visibleDistricts.map((district) => {
          const relativeX = district.bounds.x - gridBounds.x;
          const relativeY = district.bounds.y - gridBounds.y;

          return (
            <motion.div
              key={district.id}
              className="district-zone"
              style={{
                left: relativeX * effectiveCellSize,
                top: relativeY * effectiveCellSize,
                width: district.bounds.width * effectiveCellSize,
                height: district.bounds.height * effectiveCellSize,
                backgroundColor: district.color + "15",
                borderColor: district.color + "40",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 * district.bounds.x }}
            >
              <div className="district-label" style={{ color: district.color }}>
                {district.name}
              </div>
            </motion.div>
          );
        })}

        {/* Grid overlay */}
        <div className="grid-overlay" />

        {/* Venues */}
        {venues
          .filter((venue) => {
            if (!venue.gridPosition || !zoomedDistrict) return true;
            return (
              venue.gridPosition.x >= gridBounds.x &&
              venue.gridPosition.x < gridBounds.x + gridBounds.width &&
              venue.gridPosition.y >= gridBounds.y &&
              venue.gridPosition.y < gridBounds.y + gridBounds.height
            );
          })
          .map((venue) => {
            if (!venue.gridPosition) return null;
            const relativeX = venue.gridPosition.x - gridBounds.x;
            const relativeY = venue.gridPosition.y - gridBounds.y;

            return (
              <motion.div
                key={venue.id}
                className="venue-marker"
                style={{
                  left: relativeX * effectiveCellSize + 4,
                  top: relativeY * effectiveCellSize + 4,
                  width: effectiveCellSize - 8,
                  height: effectiveCellSize - 8,
                  zIndex: venue.gridPosition.y * 10 + venue.gridPosition.x,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  delay: 0.05 * (venue.gridPosition.x + venue.gridPosition.y),
                }}
                whileHover={{ scale: 1.1, rotateZ: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  handleCellClick(venue.gridPosition!.x, venue.gridPosition!.y)
                }
                title={venue.name}
              >
                <div className="venue-content">
                  <div className="venue-icon">
                    {venue.type === VenueType.BASEMENT && "🏠"}
                    {venue.type === VenueType.DIVE_BAR && "🍺"}
                    {venue.type === VenueType.WAREHOUSE && "🏭"}
                    {venue.type === VenueType.UNDERGROUND && "🎸"}
                    {venue.type === VenueType.THEATER && "🎭"}
                    {venue.type === VenueType.GARAGE && "🚗"}
                    {venue.type === VenueType.DIY_SPACE && "🎨"}
                  </div>
                  <div className="venue-name">{venue.name}</div>
                </div>
                {venue.upgrades && venue.upgrades.length > 0 && (
                  <div className="venue-upgrades">
                    <span className="upgrade-count">
                      {venue.upgrades.length}
                    </span>
                  </div>
                )}
                {/* Show indicator */}
                {scheduledShows.some((show) => show.venueId === venue.id) && (
                  <motion.div
                    className="show-indicator"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    🎫
                  </motion.div>
                )}
              </motion.div>
            );
          })}

        {/* Walker sprites */}
        <div className="walker-layer">
          {walkers.map((walker) => (
            <WalkerSprite
              key={walker.id}
              walker={walker}
              cellSize={effectiveCellSize}
              gridBounds={gridBounds}
            />
          ))}
        </div>

        {/* Hover indicator */}
        <AnimatePresence>
          {hoveredCell && (
            <motion.div
              className="hover-indicator"
              style={{
                left: (hoveredCell.x - gridBounds.x) * effectiveCellSize,
                top: (hoveredCell.y - gridBounds.y) * effectiveCellSize,
                width: effectiveCellSize,
                height: effectiveCellSize,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.1 }}
            />
          )}
        </AnimatePresence>

        {/* Click detection grid */}
        <div
          className="click-grid"
          style={{
            gridTemplateColumns: `repeat(${gridBounds.width}, 1fr)`,
            gridTemplateRows: `repeat(${gridBounds.height}, 1fr)`,
          }}
          onMouseLeave={() => setHoveredCell(null)}
        >
          {Array.from({ length: gridBounds.width * gridBounds.height }).map(
            (_, index) => {
              const localX = index % gridBounds.width;
              const localY = Math.floor(index / gridBounds.width);
              const globalX = localX + gridBounds.x;
              const globalY = localY + gridBounds.y;

              return (
                <div
                  key={index}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() =>
                    setHoveredCell({ x: globalX, y: globalY })
                  }
                  onClick={() => handleCellClick(globalX, globalY)}
                />
              );
            },
          )}
        </div>
      </div>

      <style>{`
        .city-district-wrapper {
          padding: ${zoomedDistrict ? "30px" : "15px"};
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .city-district-view {
          position: relative;
          margin: 0 auto;
          background: linear-gradient(135deg, #0a0a0a 0%, #111111 100%);
          border: 2px solid ${placingMode ? "var(--punk-magenta)" : "var(--border-default)"};
          border-radius: 12px;
          overflow: visible;
          box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          cursor: ${placingMode ? "crosshair" : "default"};
          transition: all var(--transition-base);
        }

        .district-zone {
          position: absolute;
          border: 2px solid;
          border-radius: 12px;
          pointer-events: none;
          backdrop-filter: blur(1px);
          box-sizing: border-box;
        }

        .district-label {
          position: absolute;
          top: 8px;
          left: 8px;
          right: 8px;
          font-size: ${zoomedDistrict ? "14px" : "11px"};
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
          opacity: ${zoomedDistrict ? 1 : 0.8};
          pointer-events: none;
          z-index: 1;
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.05) 0, rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent ${effectiveCellSize}px),
            repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0, rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent ${effectiveCellSize}px);
          pointer-events: none;
        }

        .venue-marker {
          position: absolute;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .venue-content {
          width: 100%;
          height: 100%;
          background: var(--bg-secondary);
          border: 2px solid var(--border-default);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          padding: 4px;
          position: relative;
          overflow: hidden;
        }

        .venue-marker:hover .venue-content {
          background: var(--bg-hover);
          border-color: var(--punk-magenta);
          box-shadow: 0 0 16px rgba(236, 72, 153, 0.4);
        }

        .venue-icon {
          font-size: ${zoomedDistrict ? "36px" : "18px"};
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        }

        .venue-name {
          font-size: ${zoomedDistrict ? "14px" : "9px"};
          color: var(--text-secondary);
          text-align: center;
          font-weight: 600;
          line-height: 1;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: ${zoomedDistrict ? "normal" : "nowrap"};
          padding: 0 ${zoomedDistrict ? "8px" : "2px"};
        }

        .venue-marker:hover .venue-name {
          color: var(--text-primary);
        }

        .venue-upgrades {
          position: absolute;
          top: 2px;
          right: 2px;
        }

        .upgrade-count {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--info-purple);
          color: white;
          font-size: 10px;
          font-weight: 700;
          box-shadow: 0 0 4px rgba(139, 92, 246, 0.8);
        }

        .show-indicator {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 20px;
          height: 20px;
          background: var(--punk-magenta);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          box-shadow: 0 0 8px rgba(236, 72, 153, 0.6);
          border: 2px solid var(--bg-primary);
        }

        .walker-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 50;
        }

        .hover-indicator {
          position: absolute;
          border: 2px solid var(--punk-magenta);
          border-radius: 8px;
          pointer-events: none;
          box-shadow: 
            0 0 20px rgba(236, 72, 153, 0.5),
            inset 0 0 20px rgba(236, 72, 153, 0.1);
        }

        .click-grid {
          position: absolute;
          inset: 0;
          display: grid;
        }

      `}</style>
    </div>
  );
};
