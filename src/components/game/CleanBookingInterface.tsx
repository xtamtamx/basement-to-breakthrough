import React, { useState } from "react";
import { Band, Venue, GamePhase } from "@game/types";
import { useGameStore } from "@stores/gameStore";
import { haptics } from "@utils/mobile";

interface CleanBookingInterfaceProps {
  bands: Band[];
  venues: Venue[];
  onBookShow: (bands: Band[], venue: Venue) => void;
  phase: GamePhase;
  turn: number;
}

export const CleanBookingInterface: React.FC<CleanBookingInterfaceProps> = ({
  bands,
  venues,
  onBookShow,
  turn,
}) => {
  const { money, reputation } = useGameStore();
  const [selectedBand, setSelectedBand] = useState<Band | null>(null);
  const [bookedShows, setBookedShows] = useState<Map<string, Band>>(new Map());

  const handleVenueClick = (venue: Venue) => {
    if (!selectedBand || bookedShows.has(venue.id)) return;

    onBookShow([selectedBand], venue);
    setBookedShows((prev) => new Map(prev).set(venue.id, selectedBand));
    setSelectedBand(null);
    haptics.success();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: "60px",
          backgroundColor: "#1a1a1a",
          borderBottom: "2px solid #ec4899",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
          <h1 style={{ color: "#ec4899", fontSize: "24px", margin: 0 }}>
            BOOK SHOWS
          </h1>
          <span style={{ color: "#10b981" }}>Turn {turn}</span>
          <span style={{ color: "#fbbf24" }}>${money}</span>
          <span style={{ color: "#a855f7" }}>{reputation} REP</span>
        </div>
        <button
          onClick={() => bookedShows.size > 0 && haptics.success()}
          style={{
            padding: "10px 20px",
            backgroundColor: bookedShows.size > 0 ? "#ec4899" : "#374151",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            cursor: bookedShows.size > 0 ? "pointer" : "not-allowed",
          }}
        >
          EXECUTE ({bookedShows.size})
        </button>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          gap: "20px",
          padding: "20px",
          minHeight: 0,
        }}
      >
        {/* Venues Panel */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#1a1a1a",
            borderRadius: "8px",
            padding: "20px",
            border: "1px solid #333",
          }}
        >
          <h2 style={{ color: "#ec4899", marginBottom: "20px" }}>VENUES</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "15px",
            }}
          >
            {venues.map((venue) => {
              const isBooked = bookedShows.has(venue.id);
              return (
                <div
                  key={venue.id}
                  onClick={() => handleVenueClick(venue)}
                  style={{
                    padding: "15px",
                    backgroundColor: isBooked ? "#065f46" : "#2d2d2d",
                    border: `2px solid ${isBooked ? "#10b981" : "#ec4899"}`,
                    borderRadius: "8px",
                    cursor: isBooked ? "default" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <h3
                    style={{
                      color: "white",
                      margin: "0 0 5px 0",
                      fontSize: "16px",
                    }}
                  >
                    {venue.name}
                  </h3>
                  <p style={{ color: "#9ca3af", margin: 0, fontSize: "14px" }}>
                    {isBooked
                      ? "BOOKED"
                      : `Cap: ${venue.capacity} | $${venue.rent}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bands Panel */}
        <div
          style={{
            width: "300px",
            backgroundColor: "#1a1a1a",
            borderRadius: "8px",
            padding: "20px",
            border: "1px solid #333",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h2 style={{ color: "#ec4899", marginBottom: "20px" }}>BANDS</h2>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              overflowY: "auto",
            }}
          >
            {bands.map((band) => {
              const isBooked = Array.from(bookedShows.values()).some(
                (b) => b.id === band.id,
              );
              const isSelected = selectedBand?.id === band.id;

              return (
                <div
                  key={band.id}
                  onClick={() => !isBooked && setSelectedBand(band)}
                  style={{
                    padding: "12px",
                    backgroundColor: isBooked
                      ? "#374151"
                      : isSelected
                        ? "#7c2d12"
                        : "#2d2d2d",
                    border: `2px solid ${isSelected ? "#ec4899" : "transparent"}`,
                    borderRadius: "6px",
                    cursor: isBooked ? "default" : "pointer",
                    opacity: isBooked ? 0.5 : 1,
                    transition: "all 0.2s",
                  }}
                >
                  <h4
                    style={{
                      color: "white",
                      margin: "0 0 3px 0",
                      fontSize: "14px",
                    }}
                  >
                    {band.name}
                  </h4>
                  <p style={{ color: "#9ca3af", margin: 0, fontSize: "12px" }}>
                    {band.genre} | Pop: {band.popularity}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          height: "40px",
          backgroundColor: "#1a1a1a",
          borderTop: "1px solid #333",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        Select a band, then click a venue to book
      </div>
    </div>
  );
};
