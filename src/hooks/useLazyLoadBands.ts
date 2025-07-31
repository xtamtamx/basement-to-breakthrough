import { useState, useEffect, useCallback } from "react";
import { Band } from "@game/types";
import { useGameStore } from "@stores/gameStore";

interface UseLazyLoadBandsOptions {
  initialLoadCount?: number;
  loadMoreCount?: number;
  sortBy?: "popularity" | "authenticity" | "name";
  filterBy?: {
    genre?: string;
    minPopularity?: number;
    maxPopularity?: number;
    isRealArtist?: boolean;
  };
}

export const useLazyLoadBands = (options: UseLazyLoadBandsOptions = {}) => {
  const {
    initialLoadCount = 6,
    loadMoreCount = 3,
    sortBy = "popularity",
    filterBy,
  } = options;

  const allBands = useGameStore((state) => state.allBands);
  const [displayedBands, setDisplayedBands] = useState<Band[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Filter bands based on criteria
  const getFilteredBands = useCallback(() => {
    let filtered = [...allBands];

    if (filterBy) {
      if (filterBy.genre) {
        filtered = filtered.filter((band) => band.genre === filterBy.genre);
      }
      if (filterBy.minPopularity !== undefined) {
        filtered = filtered.filter(
          (band) => band.popularity >= filterBy.minPopularity,
        );
      }
      if (filterBy.maxPopularity !== undefined) {
        filtered = filtered.filter(
          (band) => band.popularity <= filterBy.maxPopularity,
        );
      }
      if (filterBy.isRealArtist !== undefined) {
        filtered = filtered.filter(
          (band) => band.isRealArtist === filterBy.isRealArtist,
        );
      }
    }

    // Sort bands
    switch (sortBy) {
      case "popularity":
        filtered.sort((a, b) => b.popularity - a.popularity);
        break;
      case "authenticity":
        filtered.sort((a, b) => b.authenticity - a.authenticity);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [allBands, filterBy, sortBy]);

  // Initial load
  useEffect(() => {
    const filtered = getFilteredBands();
    const initial = filtered.slice(0, initialLoadCount);
    setDisplayedBands(initial);
    setHasMore(initial.length < filtered.length);
  }, [getFilteredBands, initialLoadCount]);

  // Load more bands
  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);

    // Simulate async loading for better UX
    setTimeout(() => {
      const filtered = getFilteredBands();
      const currentCount = displayedBands.length;
      const nextBands = filtered.slice(
        currentCount,
        currentCount + loadMoreCount,
      );

      if (nextBands.length > 0) {
        setDisplayedBands((prev) => [...prev, ...nextBands]);
        setHasMore(currentCount + nextBands.length < filtered.length);
      } else {
        setHasMore(false);
      }

      setIsLoading(false);
    }, 300);
  }, [
    displayedBands.length,
    getFilteredBands,
    hasMore,
    isLoading,
    loadMoreCount,
  ]);

  // Reset when filter changes
  const reset = useCallback(() => {
    const filtered = getFilteredBands();
    const initial = filtered.slice(0, initialLoadCount);
    setDisplayedBands(initial);
    setHasMore(initial.length < filtered.length);
  }, [getFilteredBands, initialLoadCount]);

  return {
    bands: displayedBands,
    loadMore,
    hasMore,
    isLoading,
    reset,
    totalCount: getFilteredBands().length,
  };
};
