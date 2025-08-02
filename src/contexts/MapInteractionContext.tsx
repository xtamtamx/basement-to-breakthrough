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
      console.log('handleVenueClick - venueData:', venueData);
      console.log('handleVenueClick - venues:', venues);
      const venue = venues.find((v) => v.id === venueData.id);
      console.log('handleVenueClick - found venue:', venue);
      if (!venue) {
        console.error('Venue not found for id:', venueData.id);
        return;
      }

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
      console.log('handleTileClick - tile:', tile);
      if (!tile.interactable || !tile.data) {
        console.log('Tile not interactable or no data');
        return;
      }

      setSelectedTile(tile);

      if (tile.type === "venue") {
        console.log('Venue tile clicked');
        handleVenueClick(tile.data as VenueData);
      } else if (tile.type === "workplace" && "jobType" in tile.data) {
        console.log('Workplace tile clicked');
        handleWorkplaceClick(tile.data as WorkplaceData);
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

