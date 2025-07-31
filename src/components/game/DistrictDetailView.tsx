import React, { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/stores/gameStore";
import { BaseSprite } from "../graphics/PixelArtSprites";
import { haptics } from "@/utils/mobile";

import { devLog, prodLog } from '../../utils/devLogger';
interface DistrictDetailViewProps {
  districtId: string;
  onLocationSelect?: (locationId: string) => void;
  selectedLocation?: string;
}

const DISTRICT_DATA = {
  eastside: {
    name: "Eastside",
    color: "#E91E63",
    description: "DIY venues & house shows",
    sprite: "coffee",
    jobs: ["☕ Barista", "🎨 Artist"],
    venueTypes: ["House Show", "DIY Space"],
  },
  downtown: {
    name: "Downtown",
    color: "#3498DB",
    description: "Corporate venues & clubs",
    sprite: "office",
    jobs: ["💼 Office Job", "🛍️ Retail"],
    venueTypes: ["Club", "Theater"],
  },
  industrial: {
    name: "Industrial",
    color: "#FF6F00",
    description: "Warehouses & underground spots",
    sprite: "warehouse",
    jobs: ["📦 Warehouse", "🏭 Factory"],
    venueTypes: ["Warehouse", "Underground"],
  },
  university: {
    name: "University",
    color: "#8B6914",
    description: "Student venues & cafes",
    sprite: "university",
    jobs: ["📚 TA", "☕ Barista"],
    venueTypes: ["Student Center", "Cafe"],
  },
};

// Pixel art sprites for district elements
const ELEMENT_SPRITES = {
  venue: [
    "  PPPPPP  ",
    " PWWWWWWP ",
    "PWWPPPPWWP",
    "PWPWWWWPWP",
    "PWPWWWWPWP",
    "PWPPPPPPWP",
    "PWWWWWWWWP",
    " PPPPPPPP ",
  ],
  job: [
    "  GGGGGG  ",
    " GWWWWWWG ",
    "GWWGGGGWWG",
    "GWGWWWWGWG",
    "GWGWWWWGWG",
    "GWGGGGGGWG",
    "GWWWWWWWWG",
    " GGGGGGGG ",
  ],
  building: [
    "BBBBBBBBBB",
    "BWWBWWBWWB",
    "BWWBWWBWWB",
    "BBBBBBBBBB",
    "BWWBWWBWWB",
    "BWWBWWBWWB",
    "BBBBBBBBBB",
    "BBDDDDDDBB",
  ],
};

export const DistrictDetailView: React.FC<DistrictDetailViewProps> = ({
  districtId,
  onLocationSelect,
  selectedLocation,
}) => {
  const { venues } = useGameStore();
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  const district = DISTRICT_DATA[districtId as keyof typeof DISTRICT_DATA];
  devLog.log(
    "DistrictDetailView - districtId:",
    districtId,
    "district:",
    district,
  );
  if (!district) {
    prodLog.error("District not found for ID:", districtId);
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        District not found: {districtId}
      </div>
    );
  }

  // Get venues in this district
  const districtVenues = venues.filter((v) => v.location?.id === districtId);

  const colorMap = {
    P: "#E91E63", // Pink
    G: "#4CAF50", // Green
    B: "#2196F3", // Blue
    W: "#ECEFF1", // White
    D: "#263238", // Dark
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-900 rounded-lg overflow-hidden">
      <div className="absolute top-0 left-0 bg-red-500 text-white p-2 z-50">
        DEBUG: DistrictDetailView rendered for {districtId}
      </div>
      {/* District background pattern */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: district.color + "10" }}
      >
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1"
              style={{
                backgroundColor: district.color,
                left: `${(i % 10) * 10}%`,
                top: `${Math.floor(i / 10) * 10}%`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative h-full flex flex-col p-4">
        {/* District Header */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold" style={{ color: district.color }}>
            {district.name} District
          </h2>
          <p className="text-xs text-gray-400 mt-1">{district.description}</p>
        </div>

        {/* District Grid */}
        <div className="flex-1 grid grid-cols-4 grid-rows-3 gap-4 p-4 bg-gray-800 bg-opacity-50 rounded-lg">
          {/* Central Building */}
          <motion.div
            className="col-span-2 row-span-2 col-start-2 row-start-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 10 }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <svg
                viewBox="0 0 40 32"
                className="w-full h-full"
                style={{ imageRendering: "pixelated" }}
              >
                <BaseSprite
                  data={ELEMENT_SPRITES.building}
                  pixelSize={4}
                  colorMap={colorMap}
                />
              </svg>
            </div>
            <div className="text-center mt-2">
              <span className="text-sm font-bold text-white">
                {district.name} Hub
              </span>
            </div>
          </motion.div>

          {/* Job Locations */}
          {district.jobs.map((job: string, i: number) => (
            <motion.div
              key={`job-${i}`}
              className="relative cursor-pointer"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ scale: 1.1 }}
              onHoverStart={() => setHoveredElement(`job-${i}`)}
              onHoverEnd={() => setHoveredElement(null)}
              onClick={() => {
                onLocationSelect?.(`job-${districtId}-${i}`);
                haptics.light();
              }}
            >
              <div className="w-full h-full p-2">
                <svg
                  viewBox="0 0 40 32"
                  className="w-full h-full"
                  style={{ imageRendering: "pixelated" }}
                >
                  <BaseSprite
                    data={ELEMENT_SPRITES.job}
                    pixelSize={4}
                    colorMap={colorMap}
                  />
                </svg>
              </div>
              <div className="absolute bottom-0 left-0 right-0 text-center">
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                  {job}
                </span>
              </div>
            </motion.div>
          ))}

          {/* Existing Venues */}
          {districtVenues.slice(0, 4).map((venue, i) => (
            <motion.div
              key={venue.id}
              className="relative cursor-pointer"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => {
                onLocationSelect?.(venue.id);
                haptics.light();
              }}
            >
              <div className="w-full h-full p-2">
                <svg
                  viewBox="0 0 40 32"
                  className="w-full h-full"
                  style={{ imageRendering: "pixelated" }}
                >
                  <BaseSprite
                    data={ELEMENT_SPRITES.venue}
                    pixelSize={4}
                    colorMap={colorMap}
                  />
                </svg>
              </div>
              <div className="absolute bottom-0 left-0 right-0 text-center">
                <span className="text-xs bg-pink-600 text-white px-2 py-1 rounded">
                  {venue.name}
                </span>
              </div>
              {selectedLocation === venue.id && (
                <div className="absolute inset-0 border-2 border-yellow-400 rounded animate-pulse" />
              )}
            </motion.div>
          ))}

          {/* Empty Slots for New Venues */}
          {Array.from({ length: Math.max(0, 2 - districtVenues.length) }).map(
            (_, i) => (
              <motion.div
                key={`empty-${i}`}
                className="relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <div className="w-full h-full border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-2xl">+</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 text-center">
                  <span className="text-xs text-gray-500">Build Venue</span>
                </div>
              </motion.div>
            ),
          )}
        </div>

        {/* District Stats */}
        <div className="mt-4 flex justify-center gap-8">
          <div className="text-center">
            <div className="text-xs text-gray-400">Venues</div>
            <div className="text-lg font-bold text-white">
              {districtVenues.length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Jobs</div>
            <div className="text-lg font-bold text-green-400">
              {district.jobs.length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Activity</div>
            <div
              className="text-lg font-bold"
              style={{ color: district.color }}
            >
              High
            </div>
          </div>
        </div>
      </div>

      {/* Hover Info */}
      {hoveredElement && (
        <motion.div
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 px-4 py-2 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-xs text-white">Click to select this location</p>
        </motion.div>
      )}
    </div>
  );
};
