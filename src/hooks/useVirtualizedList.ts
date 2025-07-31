import { useState, useCallback, useMemo } from 'react';

interface UseVirtualizedListOptions {
  pageSize?: number;
  initialFilter?: string;
  initialSort?: 'asc' | 'desc';
  sortKey?: string;
}

export function useVirtualizedList<T>(
  items: T[],
  options: UseVirtualizedListOptions = {}
) {
  const { 
    pageSize = 50,
    initialFilter = '',
    initialSort = 'asc',
    sortKey = 'id'
  } = options;
  
  const [filter, setFilter] = useState(initialFilter);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSort);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  
  // Filter items
  const filteredItems = useMemo(() => {
    if (!filter) return items;
    
    const lowerFilter = filter.toLowerCase();
    return items.filter(item => {
      // Search in all string properties
      return Object.values(item as Record<string, unknown>).some(value => 
        typeof value === 'string' && 
        value.toLowerCase().includes(lowerFilter)
      );
    });
  }, [items, filter]);
  
  // Sort items
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    sorted.sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortKey];
      const bValue = (b as Record<string, unknown>)[sortKey];
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    });
    return sorted;
  }, [filteredItems, sortKey, sortOrder]);
  
  // Get visible items
  const visibleItems = useMemo(() => {
    return sortedItems.slice(0, visibleCount);
  }, [sortedItems, visibleCount]);
  
  // Load more items
  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + pageSize, sortedItems.length));
  }, [pageSize, sortedItems.length]);
  
  // Reset visible count when filter changes
  const updateFilter = useCallback((newFilter: string) => {
    setFilter(newFilter);
    setVisibleCount(pageSize);
  }, [pageSize]);
  
  // Toggle sort order
  const toggleSort = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);
  
  return {
    items: visibleItems,
    totalItems: sortedItems.length,
    filter,
    setFilter: updateFilter,
    sortOrder,
    toggleSort,
    loadMore,
    hasMore: visibleCount < sortedItems.length,
    isFiltered: filter.length > 0,
  };
}