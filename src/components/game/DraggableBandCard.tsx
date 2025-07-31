import React, { useState } from "react";
import { Band } from "@game/types";
import { useDraggable } from "@hooks/useDraggable";
import { useDragContext } from "@contexts/DragContext";

interface DraggableBandCardProps {
  band: Band;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
}

export const DraggableBandCard: React.FC<DraggableBandCardProps> = ({
  band,
  position = { x: 0, y: 0 },
  onPositionChange,
}) => {
  const { setDraggedItem, handleDragMove, handleDrop } = useDragContext();
  const [isHovered, setIsHovered] = useState(false);

  const { ref, isDragging, bind } = useDraggable(band.id, {
    onDragStart: () => {
      setDraggedItem(band, "band");
    },
    onDragMove: (pos) => {
      handleDragMove(pos.x, pos.y);
    },
    onDragEnd: (pos) => {
      const dropped = handleDrop(pos.x, pos.y);
      if (!dropped && onPositionChange) {
        onPositionChange(pos);
      }
    },
  });

  const getPopularityBars = (popularity: number) => {
    const bars = Math.ceil(popularity / 20);
    return "▮".repeat(bars) + "▯".repeat(5 - bars);
  };

  return (
    <div
      ref={ref}
      {...bind}
      className={`
        absolute w-48 bg-metal-900 rounded-lg p-3 border-2
        ${isDragging ? "border-punk-500 shadow-2xl scale-105 opacity-90" : "border-metal-700"}
        ${isHovered ? "border-punk-600" : ""}
        transition-all duration-200
        cursor-grab active:cursor-grabbing
      `}
      style={{
        left: position.x,
        top: position.y,
        transform: isDragging ? "rotate(3deg)" : "rotate(0deg)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Real Artist Badge */}
      {band.isRealArtist && (
        <div className="absolute -top-2 -right-2 bg-punk-600 text-white text-xs px-2 py-1 rounded-full">
          REAL
        </div>
      )}

      {/* Band Info */}
      <div className="space-y-2">
        <h3 className="font-bold text-sm truncate">{band.name}</h3>

        <div className="flex items-center gap-2 text-xs text-metal-300">
          <span className="uppercase">{band.genre}</span>
          {band.hometown && (
            <>
              <span>•</span>
              <span className="truncate">{band.hometown}</span>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div>
            <span className="text-metal-500">POP:</span>
            <span className="ml-1 font-mono">
              {getPopularityBars(band.popularity)}
            </span>
          </div>
          <div>
            <span className="text-metal-500">AUTH:</span>
            <span className="ml-1 text-punk-400">{band.authenticity}%</span>
          </div>
        </div>

        {/* Traits */}
        {band.traits.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {band.traits.slice(0, 2).map((trait) => (
              <span
                key={trait.id}
                className="text-xs bg-metal-800 px-2 py-0.5 rounded-full"
              >
                {trait.name}
              </span>
            ))}
            {band.traits.length > 2 && (
              <span className="text-xs text-metal-500">
                +{band.traits.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
