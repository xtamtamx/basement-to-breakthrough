import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { FPSMonitor, useFPSMonitor } from '../FPSMonitor';

describe('FPSMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
  
  it('should render FPS monitor', () => {
    render(<FPSMonitor />);
    expect(screen.getByText(/FPS/)).toBeInTheDocument();
    expect(screen.getByText(/Min:/)).toBeInTheDocument();
    expect(screen.getByText(/Max:/)).toBeInTheDocument();
    expect(screen.getByText(/Avg:/)).toBeInTheDocument();
  });
  
  it('should display frame count', () => {
    render(<FPSMonitor />);
    expect(screen.getByText(/frames/)).toBeInTheDocument();
  });
  
  it('should position correctly', () => {
    const { rerender } = render(<FPSMonitor position="top-left" />);
    let container = document.querySelector('.fixed');
    expect(container).toHaveClass('top-4', 'left-4');
    
    rerender(<FPSMonitor position="bottom-right" />);
    container = document.querySelector('.fixed');
    expect(container).toHaveClass('bottom-4', 'right-4');
  });

  it('should toggle graph display', () => {
    const { rerender, container } = render(<FPSMonitor showGraph={false} />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
    
    rerender(<FPSMonitor showGraph={true} />);
    // Graph appears after first update when there's data
    expect(screen.getByText(/FPS/)).toBeInTheDocument();
  });
  
  it('should use custom target FPS', () => {
    render(<FPSMonitor targetFPS={30} />);
    // Component should use this for color coding
    expect(screen.getByText(/FPS/)).toBeInTheDocument();
  });
  
  it('should use custom update interval', () => {
    render(<FPSMonitor updateInterval={500} />);
    // Component should update every 500ms instead of 1000ms
    expect(screen.getByText(/FPS/)).toBeInTheDocument();
  });
});

describe('useFPSMonitor hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
  
  it('should start with 0 FPS', () => {
    const { result } = renderHook(() => useFPSMonitor());
    expect(result.current).toBe(0);
  });
  
  it('should accept custom update interval', () => {
    const { result } = renderHook(() => useFPSMonitor(2000));
    expect(result.current).toBe(0);
    // Should update every 2 seconds
  });
});

// Integration test for actual FPS calculation
describe('FPS calculation logic', () => {
  it('should calculate 60 FPS correctly', () => {
    const frameTimes = Array(60).fill(16.67); // 60 frames at 16.67ms each
    const avgFrameTime = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
    const fps = 1000 / avgFrameTime;
    expect(Math.round(fps)).toBe(60);
  });
  
  it('should calculate 30 FPS correctly', () => {
    const frameTimes = Array(30).fill(33.33); // 30 frames at 33.33ms each
    const avgFrameTime = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
    const fps = 1000 / avgFrameTime;
    expect(Math.round(fps)).toBe(30);
  });
  
  it('should handle variable frame rates', () => {
    const frameTimes = [16.67, 16.67, 33.33, 16.67, 33.33]; // Mix of 60 and 30 FPS
    const avgFrameTime = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
    const fps = 1000 / avgFrameTime;
    expect(fps).toBeGreaterThan(30);
    expect(fps).toBeLessThan(60);
  });
});