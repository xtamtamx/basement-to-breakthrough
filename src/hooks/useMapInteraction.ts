import { useCallback, useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useMapStore } from "@/stores/mapStore";
import { MapTile, VenueData, WorkplaceData } from "@/components/map/MapTypes";
import { haptics } from "@/utils/mobile";
import { Venue } from "@/game/types";

interface MapInteractionReturn {
  handleVenueClick: (venueData: VenueData) => void;
  handleWorkplaceClick: (workplaceData: WorkplaceData) => void;
  handleTileClick: (tile: MapTile) => void;
  selectedVenue: Venue | null;
  setSelectedVenue: (venue: Venue | null) => void;
  selectedWorkplace: WorkplaceData | null;
  setSelectedWorkplace: (workplace: WorkplaceData | null) => void;
}

export function useMapInteraction(): MapInteractionReturn {
  const { venues } = useGameStore();
  const { setSelectedTile } = useMapStore();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedWorkplace, setSelectedWorkplace] =
    useState<WorkplaceData | null>(null);

  const handleVenueClick = useCallback(
    (venueData: VenueData) => {
      // Find the full venue data from game store
      const venue = venues.find((v) => v.id === venueData.id);
      if (!venue) return;

      haptics.medium();
      setSelectedVenue(venue);
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

      if (tile.type === "venue") {
        handleVenueClick(tile.data as VenueData);
      } else if (tile.type === "workplace") {
        handleWorkplaceClick(tile.data as WorkplaceData);
      }
    },
    [setSelectedTile, handleVenueClick, handleWorkplaceClick],
  );

  return {
    handleVenueClick,
    handleWorkplaceClick,
    handleTileClick,
    selectedVenue,
    setSelectedVenue,
    selectedWorkplace,
    setSelectedWorkplace,
  };
}
