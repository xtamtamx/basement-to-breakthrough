import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CityMap,
  CameraState,
  MapTile,
  VenueData,
} from "@/components/map/MapTypes";
import { generateAdvancedCityMap } from "@/utils/mapGenerationAdvanced";
import { useGameStore } from "@/stores/gameStore";

interface MapStore {
  // Map data
  cityMap: CityMap | null;
  camera: CameraState;

  // UI state
  selectedTile: MapTile | null;
  hoveredTile: MapTile | null;
  activeVenues: string[];

  // Player state
  playerPosition: { x: number; y: number } | null;

  // Actions
  initializeMap: () => void;
  setCamera: (camera: Partial<CameraState>) => void;
  setCameraTarget: (x: number, y: number) => void;
  setSelectedTile: (tile: MapTile | null) => void;
  setHoveredTile: (tile: MapTile | null) => void;
  setPlayerPosition: (x: number, y: number) => void;
  addActiveVenue: (venueId: string) => void;
  removeActiveVenue: (venueId: string) => void;

  // Map updates
  updateTile: (x: number, y: number, updates: Partial<MapTile>) => void;
  refreshActiveVenues: () => void;
}

export const useMapStore = create<MapStore>()(
  persist(
    (set, get) => ({
      // Initial state
      cityMap: null,
      camera: {
        x: 320, // Center of a 20x15 map with 32px tiles
        y: 240,
        zoom: 1,
      },
      selectedTile: null,
      hoveredTile: null,
      activeVenues: [],
      playerPosition: null,

      // Initialize map
      initializeMap: async () => {
        // Get venues from game store
        const gameStore = useGameStore.getState();
        
        // Ensure initial game data is loaded
        if (gameStore.venues.length === 0) {
          await gameStore.loadInitialGameData();
        }
        
        const map = generateAdvancedCityMap(gameStore.venues);

        set({
          cityMap: map,
          // Center camera on map
          camera: {
            x: (map.width * map.tileSize) / 2,
            y: (map.height * map.tileSize) / 2,
            zoom: 0.8, // Start zoomed out to see whole city
          },
        });

        // Initial refresh of active venues
        setTimeout(() => {
          get().refreshActiveVenues();
        }, 0);
      },

      // Camera controls
      setCamera: (cameraUpdate) => {
        set((state) => ({
          camera: { ...state.camera, ...cameraUpdate },
        }));
      },

      setCameraTarget: (x, y) => {
        set((state) => ({
          camera: { ...state.camera, targetX: x, targetY: y },
        }));
      },

      // Selection
      setSelectedTile: (tile) => {
        set({ selectedTile: tile });
      },

      setHoveredTile: (tile) => {
        set({ hoveredTile: tile });
      },

      // Player
      setPlayerPosition: (x, y) => {
        set({ playerPosition: { x, y } });
      },

      // Active venues
      addActiveVenue: (venueId) => {
        set((state) => ({
          activeVenues: [...state.activeVenues, venueId],
        }));
      },

      removeActiveVenue: (venueId) => {
        set((state) => ({
          activeVenues: state.activeVenues.filter((id) => id !== venueId),
        }));
      },

      // Map updates
      updateTile: (x, y, updates) => {
        const { cityMap } = get();
        if (
          !cityMap ||
          x < 0 ||
          x >= cityMap.width ||
          y < 0 ||
          y >= cityMap.height
        )
          return;

        const newMap = { ...cityMap };
        newMap.tiles[y][x] = { ...newMap.tiles[y][x], ...updates };
        set({ cityMap: newMap });
      },

      // Refresh active venues based on game state
      refreshActiveVenues: () => {
        const { cityMap } = get();
        if (!cityMap) return;

        const gameStore = useGameStore.getState();
        const activeVenueIds: string[] = [];

        // Check scheduled shows to determine active venues
        const activeVenueSet = new Set<string>();
        gameStore.scheduledShows.forEach((show) => {
          if (show.round === gameStore.currentRound) {
            activeVenueSet.add(show.venueId);
          }
        });

        // Only update if there are changes
        let hasChanges = false;
        const newTiles = cityMap.tiles.map((row) =>
          row.map((tile) => {
            if (tile.type === "venue" && tile.data) {
              const venueData = tile.data as VenueData;
              const hasActiveShow = activeVenueSet.has(venueData.id);

              if (hasActiveShow) {
                activeVenueIds.push(venueData.id);
              }

              // Check if update needed
              if (
                tile.animated !== hasActiveShow ||
                tile.spriteId !==
                  (hasActiveShow ? "venue_active" : "venue_inactive") ||
                (venueData.hasActiveShow ?? false) !== hasActiveShow
              ) {
                hasChanges = true;

                return {
                  ...tile,
                  animated: hasActiveShow,
                  spriteId: hasActiveShow ? "venue_active" : "venue_inactive",
                  data: {
                    ...venueData,
                    hasActiveShow,
                  },
                };
              }
            }
            return tile;
          }),
        );

        // Only update state if there are actual changes
        if (hasChanges) {
          set({
            activeVenues: activeVenueIds,
            cityMap: { ...cityMap, tiles: newTiles },
          });
        } else {
          // Still update active venue list
          const currentActiveVenues = get().activeVenues;
          if (
            JSON.stringify(currentActiveVenues) !==
            JSON.stringify(activeVenueIds)
          ) {
            set({ activeVenues: activeVenueIds });
          }
        }
      },
    }),
    {
      name: "map-store",
      partialize: (state) => ({
        // Only persist camera position and player position
        camera: state.camera,
        playerPosition: state.playerPosition,
      }),
    },
  ),
);
