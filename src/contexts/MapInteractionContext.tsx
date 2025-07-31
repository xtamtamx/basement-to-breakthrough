import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Venue } from "@/game/types";
import { MapTile, VenueData, WorkplaceData } from "@/components/map/MapTypes";
import { useGameStore } from "@/stores/gameStore";
import { useMapStore } from "@/stores/mapStore";
import { haptics } from "@/utils/mobile";
import { tutorialManager } from "@/game/mechanics/TutorialSystem";

interface MapInteractionContextType {
  selectedVenue: Venue | null;
  setSelectedVenue: (venue: Venue | null) => void;
  selectedWorkplace: WorkplaceData | null;
  setSelectedWorkplace: (workplace: WorkplaceData | null) => void;
  handleTileClick: (tile: MapTile) => void;
}

export const MapInteractionContext = createContext<
  MapInteractionContextType | undefined
>(undefined);

export const MapInteractionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { venues } = useGameStore();
  const { setSelectedTile } = useMapStore();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedWorkplace, setSelectedWorkplace] =
    useState<WorkplaceData | null>(null);

  const handleVenueClick = useCallback(
    (venueData: VenueData) => {
      const venue = venues.find((v) => v.id === venueData.id);
      if (!venue) return;

      haptics.medium();
      setSelectedVenue(venue);

      // Trigger tutorial action
      tutorialManager.completeAction("CLICK_VENUE");
    },
    [venues],
  );

  const handleWorkplaceClick = useCallback((workplaceData: WorkplaceData) => {
    haptics.medium();
    setSelectedWorkplace(workplaceData);
  }, []);

  const handleTileClick = useCallback(
    (tile: MapTile) => {
      if (!tile.interactable || !tile.data) return;

      setSelectedTile(tile);

      if (tile.type === "venue" && "venue" in tile.data) {
        handleVenueClick(tile.data);
      } else if (tile.type === "workplace" && "jobId" in tile.data) {
        handleWorkplaceClick(tile.data);
      }
    },
    [setSelectedTile, handleVenueClick, handleWorkplaceClick],
  );

  return (
    <MapInteractionContext.Provider
      value={{
        selectedVenue,
        setSelectedVenue,
        selectedWorkplace,
        setSelectedWorkplace,
        handleTileClick,
      }}
    >
      {children}
    </MapInteractionContext.Provider>
  );
};

export const useMapInteraction = () => {
  const context = useContext(MapInteractionContext);
  if (!context) {
    throw new Error('useMapInteraction must be used within MapInteractionProvider');
  }
  return context;
};

