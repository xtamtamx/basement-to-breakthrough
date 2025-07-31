import { useState, useEffect, useCallback } from "react";
import { Venue, VenueType } from "@game/types";
import { useGameStore } from "@stores/gameStore";

interface UseLazyLoadVenuesOptions {
  initialLoadCount?: number;
  loadMoreCount?: number;
  sortBy?: "capacity" | "rent" | "authenticity" | "name";
  filterBy?: {
    type?: VenueType;
    minCapacity?: number;
    maxCapacity?: number;
    maxRent?: number;
    districtId?: string;
    allowsAllAges?: boolean;
  };
}

export const useLazyLoadVenues = (options: UseLazyLoadVenuesOptions = {}) => {
  const {
    initialLoadCount = 4,
    loadMoreCount = 2,
    sortBy = "capacity",
    filterBy,
  } = options;

  const allVenues = useGameStore((state) => state.venues);
  const [displayedVenues, setDisplayedVenues] = useState<Venue[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Filter venues based on criteria
  const getFilteredVenues = useCallback(() => {
    let filtered = [...allVenues];

    if (filterBy) {
      if (filterBy.type) {
        filtered = filtered.filter((venue) => venue.type === filterBy.type);
      }
      if (filterBy.minCapacity !== undefined) {
        filtered = filtered.filter(
          (venue) => venue.capacity >= filterBy.minCapacity,
        );
      }
      if (filterBy.maxCapacity !== undefined) {
        filtered = filtered.filter(
          (venue) => venue.capacity <= filterBy.maxCapacity,
        );
      }
      if (filterBy.maxRent !== undefined) {
        filtered = filtered.filter((venue) => venue.rent <= filterBy.maxRent);
      }
      if (filterBy.districtId) {
        filtered = filtered.filter(
          (venue) => venue.location.id === filterBy.districtId,
        );
      }
      if (filterBy.allowsAllAges !== undefined) {
        filtered = filtered.filter(
          (venue) => venue.allowsAllAges === filterBy.allowsAllAges,
        );
      }
    }

    // Sort venues
    switch (sortBy) {
      case "capacity":
        filtered.sort((a, b) => a.capacity - b.capacity);
        break;
      case "rent":
        filtered.sort((a, b) => a.rent - b.rent);
        break;
      case "authenticity":
        filtered.sort((a, b) => b.authenticity - a.authenticity);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [allVenues, filterBy, sortBy]);

  // Initial load
  useEffect(() => {
    const filtered = getFilteredVenues();
    const initial = filtered.slice(0, initialLoadCount);
    setDisplayedVenues(initial);
    setHasMore(initial.length < filtered.length);
  }, [getFilteredVenues, initialLoadCount]);

  // Load more venues
  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);

    // Simulate async loading for better UX
    setTimeout(() => {
      const filtered = getFilteredVenues();
      const currentCount = displayedVenues.length;
      const nextVenues = filtered.slice(
        currentCount,
        currentCount + loadMoreCount,
      );

      if (nextVenues.length > 0) {
        setDisplayedVenues((prev) => [...prev, ...nextVenues]);
        setHasMore(currentCount + nextVenues.length < filtered.length);
      } else {
        setHasMore(false);
      }

      setIsLoading(false);
    }, 300);
  }, [
    displayedVenues.length,
    getFilteredVenues,
    hasMore,
    isLoading,
    loadMoreCount,
  ]);

  // Reset when filter changes
  const reset = useCallback(() => {
    const filtered = getFilteredVenues();
    const initial = filtered.slice(0, initialLoadCount);
    setDisplayedVenues(initial);
    setHasMore(initial.length < filtered.length);
  }, [getFilteredVenues, initialLoadCount]);

  // Get venue by ID (for quick access)
  const getVenueById = useCallback(
    (id: string) => {
      return allVenues.find((venue) => venue.id === id);
    },
    [allVenues],
  );

  return {
    venues: displayedVenues,
    loadMore,
    hasMore,
    isLoading,
    reset,
    totalCount: getFilteredVenues().length,
    getVenueById,
  };
};
