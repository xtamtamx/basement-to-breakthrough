import React, { useMemo, useCallback } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useIsMobile } from '@utils/mobile';

interface VirtualizedCardGridProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  getItemKey: (item: T) => string;
  columnWidth?: number;
  rowHeight?: number;
  gap?: number;
  mobileColumns?: number;
  desktopColumns?: number;
  className?: string;
}

interface CellProps<T> {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    items: T[];
    renderCard: (item: T, index: number) => React.ReactNode;
    columns: number;
    gap: number;
  };
}

function Cell<T>({ columnIndex, rowIndex, style, data }: CellProps<T>) {
  const { items, renderCard, columns, gap } = data;
  const index = rowIndex * columns + columnIndex;
  
  if (index >= items.length) return null;
  
  const item = items[index];
  
  return (
    <div 
      style={{
        ...style,
        padding: gap / 2,
      }}
    >
      {renderCard(item, index)}
    </div>
  );
}

export function VirtualizedCardGrid<T>({
  items,
  renderCard,
  getItemKey,
  columnWidth = 300,
  rowHeight = 200,
  gap = 16,
  mobileColumns = 1,
  desktopColumns = 3,
  className = '',
}: VirtualizedCardGridProps<T>) {
  const isMobile = useIsMobile();
  
  // Calculate columns based on screen size
  const columns = isMobile ? mobileColumns : desktopColumns;
  
  // Calculate row count
  const rowCount = Math.ceil(items.length / columns);
  
  // Memoize grid data
  const gridData = useMemo(() => ({
    items,
    renderCard,
    columns,
    gap,
  }), [items, renderCard, columns, gap]);
  
  // Column width calculation
  const getColumnWidth = useCallback((index: number, width: number) => {
    return (width - gap) / columns;
  }, [columns, gap]);
  
  // Row height calculation
  const getRowHeight = useCallback(() => rowHeight + gap, [rowHeight, gap]);
  
  // Item key generation
  const itemKey = useCallback(({ columnIndex, rowIndex }: { columnIndex: number; rowIndex: number }) => {
    const index = rowIndex * columns + columnIndex;
    if (index >= items.length) return `empty-${rowIndex}-${columnIndex}`;
    return getItemKey(items[index]);
  }, [items, columns, getItemKey]);
  
  return (
    <div className={`w-full h-full ${className}`}>
      <AutoSizer>
        {({ height, width }) => (
          <Grid
            columnCount={columns}
            columnWidth={(index) => getColumnWidth(index, width)}
            height={height}
            rowCount={rowCount}
            rowHeight={getRowHeight}
            width={width}
            itemData={gridData}
            itemKey={itemKey}
            overscanRowCount={2}
            overscanColumnCount={1}
            className="custom-scrollbar"
          >
            {Cell as any}
          </Grid>
        )}
      </AutoSizer>
    </div>
  );
}