import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@stores/gameStore";
import { CityDistrictView } from "./CityDistrictView";
import { walkerSystem } from "@game/mechanics/WalkerSystem";
import { Band, Venue, VenueType, Genre } from "@game/types";
import { haptics } from "@utils/mobile";
import { VenueUpgradeModal } from "@components/venue/VenueUpgradeModal";

// Demo initial venues
const initialVenues: Venue[] = [
  {
    id: "v1",
    name: "Jake's Basement",
    type: VenueType.BASEMENT,
    capacity: 30,
    acoustics: 45,
    authenticity: 100,
    atmosphere: 85,
    modifiers: [],
    location: {
      id: "eastside",
      name: "Eastside",
      sceneStrength: 80,
      gentrificationLevel: 30,
      policePresence: 20,
      rentMultiplier: 1,
      bounds: { x: 0, y: 0, width: 4, height: 4 },
      color: "#ec4899",
    },
    rent: 0,
    equipment: [],
    traits: [],
    allowsAllAges: true,
    hasBar: false,
    hasSecurity: false,
    isPermanent: true,
    bookingDifficulty: 2,
    gridPosition: { x: 1, y: 1 },
  },
  {
    id: "v2",
    name: "The Broken Bottle",
    type: VenueType.DIVE_BAR,
    capacity: 80,
    acoustics: 60,
    authenticity: 75,
    atmosphere: 70,
    modifiers: [],
    location: {
      id: "downtown",
      name: "Downtown",
      sceneStrength: 60,
      gentrificationLevel: 70,
      policePresence: 50,
      rentMultiplier: 1.5,
      bounds: { x: 4, y: 0, width: 4, height: 4 },
      color: "#3b82f6",
    },
    rent: 150,
    equipment: [],
    traits: [],
    allowsAllAges: false,
    hasBar: true,
    hasSecurity: true,
    isPermanent: true,
    bookingDifficulty: 4,
    gridPosition: { x: 5, y: 2 },
  },
  {
    id: "v3",
    name: "Warehouse 23",
    type: VenueType.WAREHOUSE,
    capacity: 150,
    acoustics: 50,
    authenticity: 90,
    atmosphere: 95,
    modifiers: [],
    location: {
      id: "industrial",
      name: "Industrial",
      sceneStrength: 70,
      gentrificationLevel: 20,
      policePresence: 60,
      rentMultiplier: 0.8,
      bounds: { x: 0, y: 4, width: 4, height: 4 },
      color: "#10b981",
    },
    rent: 300,
    equipment: [],
    traits: [],
    allowsAllAges: true,
    hasBar: false,
    hasSecurity: false,
    isPermanent: false,
    bookingDifficulty: 6,
    gridPosition: { x: 2, y: 6 },
  },
];

export const CityBuilderGameView: React.FC = () => {
  const { money, reputation, fans, venues, updateVenues } = useGameStore();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [bandHand, setBandHand] = useState<Band[]>([]);
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Initialize venues
  useEffect(() => {
    if (venues.length === 0) {
      updateVenues(initialVenues);
    }
  }, [venues, updateVenues]);

  // Update walker system
  useEffect(() => {
    const interval = setInterval(() => {
      walkerSystem.update(0.016); // 60fps
    }, 16);

    // Debug walker creation removed - walkers created through normal gameplay

    return () => clearInterval(interval);
  }, []);

  // Initialize band hand
  useEffect(() => {
    if (bandHand.length === 0) {
      // Generate some initial bands
      const initialBands: Band[] = [
        {
          id: "b1",
          name: "Basement Dwellers",
          isRealArtist: false,
          genre: Genre.PUNK,
          subgenres: ["hardcore"],
          traits: [],
          popularity: 15,
          authenticity: 95,
          energy: 85,
          technicalSkill: 60,
          technicalRequirements: [],
        },
        {
          id: "b2",
          name: "Death Magnetic",
          isRealArtist: false,
          genre: Genre.METAL,
          subgenres: ["doom"],
          traits: [],
          popularity: 45,
          authenticity: 75,
          energy: 70,
          technicalSkill: 85,
          technicalRequirements: [],
        },
        {
          id: "b3",
          name: "Riot Grrrl Revival",
          isRealArtist: false,
          genre: Genre.PUNK,
          subgenres: ["riot grrrl"],
          traits: [],
          popularity: 35,
          authenticity: 90,
          energy: 95,
          technicalSkill: 50,
          technicalRequirements: [],
        },
      ];
      setBandHand(initialBands);
    }
  }, [bandHand]);

  const handleVenueClick = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowBookingPanel(true);
    haptics.light();
  };

  const handleBookBand = (band: Band) => {
    if (selectedVenue && money >= 50) {
      // Deduct booking cost
      useGameStore.getState().addMoney(-50);

      // Create walker for band movement
      const fromVenue = venues[0]; // Start from first venue
      walkerSystem.createMusicianWalker(band, fromVenue, selectedVenue);

      // Create some fan walkers
      for (let i = 0; i < 5; i++) {
        const randomX = Math.floor(Math.random() * 8);
        const randomY = Math.floor(Math.random() * 8);
        walkerSystem.createFanWalker(randomX, randomY, selectedVenue);
      }

      haptics.success();
      setShowBookingPanel(false);
    }
  };

  const handlePlaceVenue = () => {
    setPlacingVenue(true);
    haptics.light();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
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
          backgroundColor: "#111",
          borderBottom: "2px solid #1f2937",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#ec4899",
            margin: 0,
          }}
        >
          BASEMENT TO BREAKTHROUGH
        </h1>
        <div
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "center",
          }}
        >
          <div style={{ color: "#10b981" }}>💰 ${money}</div>
          <div style={{ color: "#f59e0b" }}>⭐ {reputation}</div>
          <div style={{ color: "#ec4899" }}>👥 {fans}</div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          gap: "20px",
          padding: "20px",
          overflow: "hidden",
        }}
      >
        {/* City View */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CityDistrictView
            onVenueClick={handleVenueClick}
            onDistrictClick={() => {}}
          />

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <button
              onClick={handlePlaceVenue}
              style={{
                padding: "10px 20px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Build Venue
            </button>
            <button
              style={{
                padding: "10px 20px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Next Turn
            </button>
          </div>
        </div>

        {/* Band Hand */}
        <div
          style={{
            width: "300px",
            backgroundColor: "#111",
            border: "2px solid #1f2937",
            borderRadius: "8px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: "#ec4899",
              marginBottom: "16px",
            }}
          >
            Available Bands
          </h2>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              overflowY: "auto",
            }}
          >
            {bandHand.map((band) => (
              <motion.div
                key={band.id}
                style={{
                  backgroundColor: "#1f2937",
                  border: "2px solid #374151",
                  borderRadius: "4px",
                  padding: "12px",
                  cursor: "pointer",
                }}
                whileHover={{
                  scale: 1.02,
                  borderColor: "#ec4899",
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    color: "#fff",
                    marginBottom: "4px",
                  }}
                >
                  {band.name}
                </div>
                <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                  {band.genre} • Pop: {band.popularity} • Auth:{" "}
                  {band.authenticity}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Panel */}
      <AnimatePresence>
        {showBookingPanel && selectedVenue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
            }}
            onClick={() => setShowBookingPanel(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                backgroundColor: "#111",
                border: "2px solid #ec4899",
                borderRadius: "8px",
                padding: "24px",
                maxWidth: "400px",
                width: "90%",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#ec4899",
                  marginBottom: "16px",
                }}
              >
                Book Show at {selectedVenue.name}
              </h2>
              <div
                style={{
                  fontSize: "14px",
                  color: "#9ca3af",
                  marginBottom: "20px",
                }}
              >
                Capacity: {selectedVenue.capacity} • Authenticity:{" "}
                {selectedVenue.authenticity}
              </div>
              
              {/* Upgrade Button */}
              <button
                onClick={() => {
                  setShowUpgradeModal(true);
                  setShowBookingPanel(false);
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#8b5cf6",
                  color: "white",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  marginBottom: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#7c3aed";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#8b5cf6";
                }}
              >
                🔧 Manage Upgrades
              </button>
              
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {bandHand.map((band) => (
                  <button
                    key={band.id}
                    onClick={() => handleBookBand(band)}
                    style={{
                      padding: "12px",
                      backgroundColor: "#1f2937",
                      color: "white",
                      border: "2px solid #374151",
                      borderRadius: "4px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#ec4899";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#374151";
                    }}
                  >
                    <div style={{ fontWeight: "bold" }}>{band.name}</div>
                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                      Cost: $50 • Expected Draw:{" "}
                      {Math.floor(
                        (band.popularity * selectedVenue.capacity) / 100,
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Venue Upgrade Modal */}
      {selectedVenue && (
        <VenueUpgradeModal
          venue={selectedVenue}
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
};
