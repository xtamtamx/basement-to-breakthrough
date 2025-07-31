import React, { useState } from "react";
import { motion } from "framer-motion";
import { DistrictType } from "@/game/types/core";

interface DistrictInfo {
  type: DistrictType;
  name: string;
  sceneStrength: number;
  gentrificationLevel: number;
  policePresence: number;
  rentMultiplier: number;
  bounds: { x: number; y: number; width: number; height: number };
  color: string;
}

interface GrungyGhibliCityGridProps {
  onDistrictClick?: (districtId: string, districtInfo: DistrictInfo) => void;
  selectedDistrict?: string;
}

// Grungy Ghibli-style building sprites
const GHIBLI_BUILDINGS = {
  downtown: [
    "    ▄▄▄▄    ",
    "   ▐████▌   ",
    "  ▄██▀▀██▄  ",
    " ▐██░░░░██▌ ",
    "▄███▄██▄███▄",
    "████████████",
    "██░█░██░█░██",
    "████▄██▄████",
    "██░░░██░░░██",
    "████████████",
    "▀▀▀▀▀▀▀▀▀▀▀▀",
  ],
  warehouse: [
    "▄▄▄▄▄▄▄▄▄▄▄▄",
    "████████████",
    "██▀▀▀▀▀▀▀▀██",
    "██░░▄▄▄▄░░██",
    "██░██████░██",
    "██░██░░██░██",
    "██░██████░██",
    "██▄▄▄▄▄▄▄▄██",
    "████████████",
    " ▐█▌    ▐█▌ ",
    "  ▀      ▀  ",
  ],
  college: [
    "      ▲      ",
    "     ▄█▄     ",
    "    ▄███▄    ",
    "   ▐█████▌   ",
    "  ▄███████▄  ",
    " ████▀█▀████ ",
    "██████████████",
    "██░▄▄░██░▄▄░██",
    "██░██░██░██░██",
    "██████████████",
    "▀▀▀▀▀▀▀▀▀▀▀▀▀",
  ],
  residential: [
    "    ▄▄▄▄▄    ",
    "   ███████   ",
    "  ▐███████▌  ",
    " ▄█████████▄ ",
    "█████████████",
    "██░░█░░█░░███",
    "██████████████",
    "██░▄▄▄▄▄▄░███",
    "██░██░░██░███",
    "██████████████",
    "▀▀▀▀▀▀▀▀▀▀▀▀▀",
  ],
  arts: [
    "   ◆◆◆◆◆◆   ",
    "  ▐██████▌  ",
    " ▄████████▄ ",
    "████▀▀▀▀████",
    "███░░◯◯░░███",
    "████▄▄▄▄████",
    "██████████████",
    "██▓▓██▓▓██▓▓██",
    "██░░██░░██░░██",
    "██████████████",
    "▀▀▀▀▀▀▀▀▀▀▀▀▀",
  ],
};

// Overgrown vegetation sprites
const VEGETATION = [
  ["░", "▒", "░", "▒"],
  ["▒", "▓", "▒", "░"],
  ["░", "▒", "▓", "▒"],
  ["▒", "░", "▒", "░"],
];

const DISTRICTS = [
  {
    id: "downtown",
    type: "downtown" as DistrictType,
    name: "Downtown",
    color: "#3B82F6",
    x: 0,
    y: 0,
    width: 2,
    height: 1.5,
  },
  {
    id: "warehouse",
    type: "warehouse" as DistrictType,
    name: "Warehouse",
    color: "#EF4444",
    x: 2,
    y: 0,
    width: 2,
    height: 1.5,
  },
  {
    id: "college",
    type: "college" as DistrictType,
    name: "College",
    color: "#10B981",
    x: 0,
    y: 1.5,
    width: 1.5,
    height: 1.5,
  },
  {
    id: "residential",
    type: "residential" as DistrictType,
    name: "Residential",
    color: "#F59E0B",
    x: 1.5,
    y: 1.5,
    width: 1.5,
    height: 1.5,
  },
  {
    id: "arts",
    type: "arts" as DistrictType,
    name: "Arts",
    color: "#8B5CF6",
    x: 3,
    y: 1.5,
    width: 1,
    height: 1.5,
  },
];

export const GrungyGhibliCityGrid: React.FC<GrungyGhibliCityGridProps> = ({
  onDistrictClick,
  selectedDistrict,
}) => {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const cellSize = 60;
  const gridWidth = 4;
  const gridHeight = 3;

  const renderGhibliDistrict = (district: (typeof DISTRICTS)[0]) => {
    const building = GHIBLI_BUILDINGS[district.type];
    const elements = [];

    // Grungy background texture
    for (let y = 0; y < (district.height * cellSize) / 4; y += 4) {
      for (let x = 0; x < (district.width * cellSize) / 4; x += 4) {
        const veg = VEGETATION[Math.floor(Math.random() * VEGETATION.length)];
        veg.forEach((char, vy) => {
          [...char].forEach((c, vx) => {
            let color = "#000";
            let opacity = 0.1;

            switch (c) {
              case "░":
                color = "#2D5016";
                opacity = 0.2;
                break;
              case "▒":
                color = "#3F6212";
                opacity = 0.3;
                break;
              case "▓":
                color = "#65A30D";
                opacity = 0.2;
                break;
            }

            elements.push(
              <rect
                key={`veg-${x}-${y}-${vx}-${vy}`}
                x={district.x * cellSize + x * 4 + vx}
                y={district.y * cellSize + y * 4 + vy}
                width={1}
                height={1}
                fill={color}
                opacity={opacity}
              />,
            );
          });
        });
      }
    }

    // Main building with decay
    const buildingScale = 4;
    const buildingX =
      district.x * cellSize +
      (district.width * cellSize - building[0].length * buildingScale) / 2;
    const buildingY =
      district.y * cellSize +
      (district.height * cellSize - building.length * buildingScale) / 2;

    building.forEach((line, y) => {
      [...line].forEach((char, x) => {
        if (char === " ") return;

        let color = "#000000";
        let opacity = 1;

        // Color mapping with grungy palette
        switch (char) {
          case "█":
          case "▄":
          case "▀":
            color =
              district.type === "downtown"
                ? "#374151"
                : district.type === "warehouse"
                  ? "#7F1D1D"
                  : district.type === "college"
                    ? "#1E3A2E"
                    : district.type === "residential"
                      ? "#78350F"
                      : "#4C1D95";
            // Add rust/decay randomly
            if (Math.random() > 0.7) {
              color = "#8B4513";
              opacity = 0.8;
            }
            break;
          case "░":
            color = "#1F2937";
            opacity = 0.6;
            break;
          case "▒":
            color = "#374151";
            opacity = 0.7;
            break;
          case "▓":
            color = "#4B5563";
            opacity = 0.8;
            break;
          case "▐":
          case "▌":
            color = "#6B7280";
            break;
          case "▲":
            color = "#991B1B";
            opacity = 0.9;
            break;
          case "◆":
            color = "#7C3AED";
            opacity = 0.8;
            break;
          case "◯":
            color = "#FCD34D";
            opacity = 0.5;
            break;
          case "◙":
            color = "#F59E0B";
            opacity = 0.3;
            break;
          default:
            color = "#4B5563";
        }

        // Main pixel
        elements.push(
          <rect
            key={`building-${x}-${y}`}
            x={buildingX + x * buildingScale}
            y={buildingY + y * buildingScale}
            width={buildingScale}
            height={buildingScale}
            fill={color}
            opacity={opacity}
          />,
        );

        // Add grime/texture
        if (Math.random() > 0.8) {
          elements.push(
            <rect
              key={`grime-${x}-${y}`}
              x={buildingX + x * buildingScale + Math.random() * buildingScale}
              y={buildingY + y * buildingScale + Math.random() * buildingScale}
              width={1}
              height={1}
              fill="#8B7355"
              opacity={0.4}
            />,
          );
        }
      });
    });

    // Overgrown vines
    for (let i = 0; i < 3; i++) {
      const vineX =
        district.x * cellSize + Math.random() * district.width * cellSize;
      const vineStartY = district.y * cellSize;
      const vineHeight = Math.random() * district.height * cellSize * 0.7;

      elements.push(
        <path
          key={`vine-${i}`}
          d={`M ${vineX} ${vineStartY} Q ${vineX + Math.random() * 20 - 10} ${vineStartY + vineHeight / 2} ${vineX + Math.random() * 30 - 15} ${vineStartY + vineHeight}`}
          stroke="#2D5016"
          strokeWidth={2}
          fill="none"
          opacity={0.6}
        />,
      );
    }

    // Graffiti tags
    if (Math.random() > 0.5) {
      elements.push(
        <text
          key="graffiti"
          x={
            district.x * cellSize +
            Math.random() * district.width * cellSize * 0.8
          }
          y={district.y * cellSize + district.height * cellSize * 0.8}
          fontSize={8}
          fontFamily="monospace"
          fill={district.color}
          opacity={0.6}
          transform={`rotate(${Math.random() * 20 - 10} ${district.x * cellSize + (district.width * cellSize) / 2} ${district.y * cellSize + (district.height * cellSize) / 2})`}
        >
          {["PUNK", "DIY", "NOISE", "RESIST"][Math.floor(Math.random() * 4)]}
        </text>,
      );
    }

    return elements;
  };

  // Animated spirits/creatures
  const renderSpirits = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <motion.g
        key={`spirit-${i}`}
        initial={{ x: 0, y: 0 }}
        animate={{
          x: [0, Math.random() * 100 - 50, 0],
          y: [0, Math.random() * 50 - 25, 0],
        }}
        transition={{
          duration: 10 + Math.random() * 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 2,
        }}
      >
        <circle
          cx={Math.random() * gridWidth * cellSize}
          cy={Math.random() * gridHeight * cellSize}
          r={3}
          fill="#10B981"
          opacity={0.3}
        />
        <circle
          cx={Math.random() * gridWidth * cellSize}
          cy={Math.random() * gridHeight * cellSize}
          r={1}
          fill="#34D399"
          opacity={0.8}
        />
      </motion.g>
    ));
  };

  return (
    <div className="ghibli-city-container">
      <svg
        viewBox={`0 0 ${gridWidth * cellSize} ${gridHeight * cellSize}`}
        className="city-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Dark, moody background */}
        <defs>
          <radialGradient id="skyGradient">
            <stop offset="0%" stopColor="#1F2937" stopOpacity={1} />
            <stop offset="100%" stopColor="#000000" stopOpacity={1} />
          </radialGradient>

          <filter id="grunge">
            <feTurbulence
              baseFrequency="0.9"
              numOctaves="4"
              result="turbulence"
            />
            <feColorMatrix in="turbulence" type="saturate" values="0" />
          </filter>
        </defs>

        <rect
          width={gridWidth * cellSize}
          height={gridHeight * cellSize}
          fill="url(#skyGradient)"
        />

        {/* Grungy overlay */}
        <rect
          width={gridWidth * cellSize}
          height={gridHeight * cellSize}
          fill="#2D3748"
          opacity={0.3}
          filter="url(#grunge)"
        />

        {/* Cracked streets */}
        <g opacity={0.6}>
          <path
            d={`M ${cellSize * 2} 0 L ${cellSize * 2} ${gridHeight * cellSize}`}
            stroke="#1F2937"
            strokeWidth={12}
            fill="none"
          />
          <path
            d={`M 0 ${cellSize * 1.5} L ${gridWidth * cellSize} ${cellSize * 1.5}`}
            stroke="#1F2937"
            strokeWidth={12}
            fill="none"
          />

          {/* Street cracks */}
          {Array.from({ length: 20 }).map((_, i) => (
            <path
              key={`crack-${i}`}
              d={`M ${Math.random() * gridWidth * cellSize} ${Math.random() * gridHeight * cellSize} l ${Math.random() * 20 - 10} ${Math.random() * 20}`}
              stroke="#000"
              strokeWidth={0.5}
              opacity={0.5}
            />
          ))}
        </g>

        {/* Districts with Ghibli buildings */}
        {DISTRICTS.map((district) => {
          const isHovered = hoveredDistrict === district.id;
          const isSelected = selectedDistrict === district.id;

          return (
            <g key={district.id}>
              {/* Render Ghibli-style content */}
              {renderGhibliDistrict(district)}

              {/* Interactive overlay */}
              <motion.rect
                x={district.x * cellSize + 2}
                y={district.y * cellSize + 2}
                width={district.width * cellSize - 4}
                height={district.height * cellSize - 4}
                fill="transparent"
                stroke={district.color}
                strokeWidth={isSelected ? 3 : isHovered ? 2 : 0}
                strokeOpacity={isHovered || isSelected ? 0.6 : 0}
                rx={8}
                className="cursor-pointer"
                onClick={() =>
                  onDistrictClick?.(district.id, {
                    type: district.type,
                    name: district.name,
                    sceneStrength: 70,
                    gentrificationLevel: 30,
                    policePresence: 20,
                    rentMultiplier: 1,
                    bounds: {
                      x: district.x,
                      y: district.y,
                      width: district.width,
                      height: district.height,
                    },
                    color: district.color,
                  })
                }
                onMouseEnter={() => setHoveredDistrict(district.id)}
                onMouseLeave={() => setHoveredDistrict(null)}
              />

              {/* District label on worn sign */}
              <g
                transform={`translate(${district.x * cellSize + (district.width * cellSize) / 2}, ${district.y * cellSize + 15})`}
              >
                <rect
                  x={-30}
                  y={-10}
                  width={60}
                  height={20}
                  fill="#2D3748"
                  stroke="#4B5563"
                  strokeWidth={1}
                  rx={2}
                  opacity={0.8}
                />
                <text
                  x={0}
                  y={3}
                  textAnchor="middle"
                  fill="#D1D5DB"
                  fontSize={9}
                  fontFamily="monospace"
                  fontWeight="bold"
                  className="pointer-events-none select-none"
                >
                  {district.name}
                </text>
              </g>
            </g>
          );
        })}

        {/* Floating spirits */}
        {renderSpirits()}

        {/* Rain effect */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.line
            key={`rain-${i}`}
            x1={Math.random() * gridWidth * cellSize}
            y1={0}
            x2={Math.random() * gridWidth * cellSize}
            y2={5}
            stroke="#4B5563"
            strokeWidth={0.5}
            opacity={0.3}
            initial={{ y: -10 }}
            animate={{ y: gridHeight * cellSize + 10 }}
            transition={{
              duration: 1 + Math.random(),
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </svg>

      {/* Hover info */}
      {hoveredDistrict && (
        <motion.div
          className="district-info-popup"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {(() => {
            const district = DISTRICTS.find((d) => d.id === hoveredDistrict);
            return district ? (
              <>
                <h3>{district.name}</h3>
                <p>Overgrown • Abandoned • Alive</p>
              </>
            ) : null;
          })()}
        </motion.div>
      )}

      <style>{`
        .ghibli-city-container {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          box-sizing: border-box;
          background: #000;
        }
        
        .city-svg {
          width: 100%;
          height: 100%;
          max-width: 600px;
          max-height: 100%;
          display: block;
          margin: 0 auto;
          border: 3px solid #1F2937;
          box-shadow: 
            0 0 30px rgba(16, 185, 129, 0.2),
            inset 0 0 30px rgba(0, 0, 0, 0.5);
        }
        
        .district-info-popup {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(31, 41, 55, 0.95);
          border: 1px solid #374151;
          padding: 8px 16px;
          pointer-events: none;
          font-family: monospace;
          border-radius: 4px;
        }
        
        .district-info-popup h3 {
          margin: 0;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          color: #E5E7EB;
        }
        
        .district-info-popup p {
          margin: 2px 0 0 0;
          font-size: 10px;
          color: #9CA3AF;
        }
      `}</style>
    </div>
  );
};
