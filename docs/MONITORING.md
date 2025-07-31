# Monitoring & Analytics Guide

## Overview

DIY Indie Empire includes comprehensive monitoring and analytics to track performance, errors, and user behavior. This guide covers setup, integration, and best practices.

## Architecture

### Components

1. **Analytics** (`/src/utils/analytics.ts`)
   - User behavior tracking
   - Game-specific events
   - Custom metrics
   - Multi-provider support

2. **Error Monitoring** (`/src/utils/errorMonitoring.ts`)
   - Sentry integration
   - Error context enrichment
   - Performance tracing
   - Session replay

3. **Performance Monitoring** (`/src/utils/performanceMonitoring.ts`)
   - Core Web Vitals
   - Custom performance metrics
   - Resource timing
   - Memory usage tracking

## Setup

### 1. Environment Variables

```env
# Analytics
VITE_ANALYTICS_ID=your-google-analytics-id
VITE_MIXPANEL_TOKEN=your-mixpanel-token
VITE_ANALYTICS_ENDPOINT=https://your-custom-endpoint.com

# Error Monitoring
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_MONITORING=true
```

### 2. Provider Setup

#### Google Analytics 4

```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

#### Mixpanel

```html
<!-- Add to index.html -->
<script type="text/javascript">
  (function(f,b){if(!b.__SV){var e,g,i,h;window.mixpanel=b;b._i=[];b.init=function(e,f,c){...}}})
  (document,window.mixpanel||[]);
  mixpanel.init('YOUR_TOKEN');
</script>
```

### 3. Initialize in App

```typescript
// src/main.tsx
import { errorMonitoring } from '@/utils/errorMonitoring';
import { analytics } from '@/utils/analytics';
import { performanceMonitoring } from '@/utils/performanceMonitoring';

// Initialize error monitoring first
if (import.meta.env.PROD) {
  errorMonitoring.initialize();
}

// Track app initialization
analytics.track('app_initialized', {
  version: import.meta.env.VITE_APP_VERSION,
  platform: navigator.userAgent
});
```

## Analytics Integration

### Game Events

```typescript
// Track game start
analytics.trackGameStart('standard');

// Track show booking
analytics.trackShowBooked({
  venueType: venue.type,
  bandGenre: band.genre,
  ticketPrice: 10,
  expectedAttendance: 50
});

// Track show completion
analytics.trackShowCompleted({
  attendance: actualAttendance,
  revenue: totalRevenue,
  rating: showRating,
  synergiesTriggered: ['punk_basement', 'diy_ethos']
});

// Track round completion
analytics.trackRoundCompleted(currentRound, {
  money: gameState.money,
  reputation: gameState.reputation,
  fans: gameState.fans,
  stress: gameState.stress
});

// Track game over
analytics.trackGameOver('bankruptcy', {
  roundsPlayed: finalRound,
  totalShows: showCount,
  finalMoney: 0,
  finalReputation: gameState.reputation,
  finalFans: gameState.fans
});
```

### User Journey Events

```typescript
// Track screen views
analytics.trackScreen('main_menu');
analytics.trackScreen('game_board');
analytics.trackScreen('show_booking');

// Track user actions
analytics.track('button_clicked', {
  button_name: 'start_game',
  location: 'main_menu'
});

// Track purchases
analytics.trackPurchase({
  type: 'equipment',
  name: 'PA System',
  cost: 500
});

// Track achievements
analytics.trackAchievement({
  id: 'first_sellout',
  name: 'First Sellout Show',
  description: 'Book a show that sells out'
});
```

### User Properties

```typescript
// Set user properties for segmentation
analytics.setUserProperties({
  totalShows: 42,
  favoriteGenre: 'Punk',
  maxRoundReached: 15,
  totalPlayTime: 3600, // seconds
  platform: 'ios'
});
```

## Error Monitoring Integration

### Capturing Errors

```typescript
// Capture exceptions with context
try {
  await bookShow(show);
} catch (error) {
  errorMonitoring.captureException(error, {
    userId: currentUser.id,
    gameState: {
      round: currentRound,
      money: gameState.money,
      reputation: gameState.reputation
    },
    action: 'book_show',
    component: 'ShowBookingModal'
  });
}

// Track game-specific errors
errorMonitoring.trackGameError(
  new Error('Insufficient funds for venue'),
  {
    round: currentRound,
    action: 'venue_selection',
    venueId: venue.id,
    bandId: band.id
  }
);
```

### Breadcrumbs

```typescript
// Add breadcrumbs for context
errorMonitoring.addBreadcrumb({
  message: 'User selected venue',
  category: 'user_action',
  level: 'info',
  data: { venueId: venue.id, capacity: venue.capacity }
});

// Game state breadcrumbs
errorMonitoring.addBreadcrumb({
  message: 'Round started',
  category: 'game',
  level: 'info',
  data: { round: currentRound, money: gameState.money }
});
```

### User Context

```typescript
// Set user context for error reports
errorMonitoring.setUser({
  id: userId,
  username: playerName,
  email: userEmail // if available
});

// Set custom context
errorMonitoring.setContext('game_session', {
  sessionId: gameSessionId,
  difficulty: 'normal',
  modifiers: ['hardcore_mode']
});
```

## Performance Monitoring

### Measuring Operations

```typescript
// Measure synchronous operations
performanceMonitoring.startMeasure('render_city_map');
renderCityMap();
performanceMonitoring.endMeasure('render_city_map');

// Measure async operations
const bands = await performanceMonitoring.measureAsync(
  'load_band_data',
  async () => fetchBands(),
  { source: 'initial_load' }
);

// Track long tasks
performanceMonitoring.startMeasure('complex_calculation', {
  complexity: 'high',
  dataSize: 1000
});
// ... complex operation
const duration = performanceMonitoring.endMeasure('complex_calculation');
```

### Web Vitals

```typescript
// Get current vitals
const vitals = performanceMonitoring.getVitals();
console.log('LCP:', vitals.LCP, 'ms');
console.log('FID:', vitals.FID, 'ms');
console.log('CLS:', vitals.CLS);

// Monitor memory usage
const memory = performanceMonitoring.getMemoryUsage();
if (memory && memory.usedJSHeapSize > 50 * 1024 * 1024) {
  console.warn('High memory usage:', memory.usedJSHeapSize);
}

// Track frame rate
const fps = await performanceMonitoring.measureFrameRate(1000);
if (fps < 30) {
  analytics.track('low_frame_rate', { fps, screen: 'game_board' });
}
```

### Bundle Analysis

```typescript
// Analyze resource loading
const bundleStats = performanceMonitoring.analyzeBundleSizes();
console.log('Total bundle size:', bundleStats.totalSize);
console.log('By type:', bundleStats.byType);

// Track slow resources
const resources = performanceMonitoring.getResourceTimings();
resources
  .filter(r => r.duration > 1000)
  .forEach(r => {
    analytics.track('slow_resource_load', {
      url: r.name,
      duration: r.duration,
      size: r.transferSize
    });
  });
```

## React Integration

### Error Boundaries

```typescript
// Use Sentry error boundary
import { errorMonitoring } from '@/utils/errorMonitoring';

const ErrorBoundary = errorMonitoring.createErrorBoundary();

<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

### Component Profiling

```typescript
// Profile component performance
import { errorMonitoring } from '@/utils/errorMonitoring';

const ProfiledGameBoard = errorMonitoring.withProfiler(
  GameBoard,
  'GameBoard'
);

// Use in app
<ProfiledGameBoard />
```

### Custom Hooks

```typescript
// useAnalytics hook
export function useAnalytics() {
  const trackEvent = useCallback((event: string, props?: any) => {
    analytics.track(event, {
      ...props,
      component: 'GameComponent',
      timestamp: Date.now()
    });
  }, []);

  return { trackEvent };
}

// usePerformance hook
export function usePerformance(operationName: string) {
  useEffect(() => {
    performanceMonitoring.startMeasure(operationName);
    return () => {
      performanceMonitoring.endMeasure(operationName);
    };
  }, [operationName]);
}
```

## Best Practices

### 1. Event Naming Convention

```typescript
// Use snake_case for events
'game_started'      // ✅
'show_booked'       // ✅
'gameStarted'       // ❌
'GAME-STARTED'      // ❌

// Be descriptive but concise
'user_clicked_button'                    // ✅
'user_clicked_start_game_button_on_menu' // ❌ Too verbose
'clicked'                                // ❌ Too vague
```

### 2. Data Privacy

```typescript
// Never track sensitive information
analytics.track('user_login', {
  userId: user.id,        // ✅
  timestamp: Date.now()   // ✅
  // password: '...'     // ❌ Never!
  // email: '...'        // ❌ Only if consented
});

// Anonymize where appropriate
analytics.track('error_occurred', {
  errorType: 'network',
  // ip_address: '...'   // ❌
  country: 'US'          // ✅ Less specific
});
```

### 3. Performance Considerations

```typescript
// Batch events when possible
const events = [];
for (const item of items) {
  events.push({ name: 'item_processed', data: item });
}
// Send as batch instead of individual calls

// Debounce frequent events
const trackScroll = debounce(() => {
  analytics.track('user_scrolled', { depth: scrollDepth });
}, 1000);

// Sample high-frequency events
if (Math.random() < 0.1) { // 10% sampling
  analytics.track('frame_rendered', { fps: currentFPS });
}
```

### 4. Error Context

```typescript
// Always provide context for errors
try {
  await riskyOperation();
} catch (error) {
  errorMonitoring.captureException(error, {
    // What was the user doing?
    action: 'saving_game',
    // What was the app state?
    gameState: getCurrentGameState(),
    // Where did it happen?
    component: 'SaveGameModal',
    // Any other relevant info
    retryCount: attempts
  });
}
```

## Debugging

### Enable Debug Mode

```typescript
// In console
localStorage.setItem('debug_analytics', 'true');
localStorage.setItem('debug_monitoring', 'true');

// Check events in console
// All analytics events will be logged
```

### Verify Integration

```typescript
// Test analytics
analytics.track('test_event', { test: true });

// Test error monitoring
errorMonitoring.captureMessage('Test message', 'info');

// Test performance
performanceMonitoring.startMeasure('test');
setTimeout(() => {
  performanceMonitoring.endMeasure('test');
}, 100);
```

### Common Issues

1. **Events not appearing**
   - Check environment variables
   - Verify provider scripts loaded
   - Check browser console for errors
   - Ensure not blocked by ad blockers

2. **Performance impact**
   - Reduce event frequency
   - Use sampling for high-volume events
   - Batch events when possible
   - Lazy load monitoring libraries

3. **Data accuracy**
   - Verify event properties
   - Check timezone handling
   - Ensure unique user identification
   - Validate custom properties

## Dashboards & Reporting

### Key Metrics to Track

1. **User Engagement**
   - Daily/Monthly Active Users
   - Session Duration
   - Retention Rate
   - Churn Rate

2. **Game Metrics**
   - Average Rounds per Session
   - Most Popular Venues/Bands
   - Common Failure Points
   - Achievement Completion Rates

3. **Performance Metrics**
   - Page Load Time
   - Time to Interactive
   - Frame Rate Distribution
   - Memory Usage Patterns

4. **Error Metrics**
   - Error Rate by Type
   - Affected Users
   - Error Trends
   - Recovery Success Rate

### Custom Reports

```sql
-- Example: Show Success Rate by Genre
SELECT 
  band_genre,
  COUNT(*) as total_shows,
  AVG(CASE WHEN rating = 'great' THEN 1 ELSE 0 END) as success_rate
FROM show_completed_events
GROUP BY band_genre
ORDER BY success_rate DESC;

-- Example: User Progression Funnel
SELECT
  'Started Game' as stage,
  COUNT(DISTINCT user_id) as users
FROM game_started_events
UNION ALL
SELECT
  'Reached Round 5',
  COUNT(DISTINCT user_id)
FROM round_completed_events
WHERE round_number >= 5;
```

## GDPR & Privacy Compliance

### User Consent

```typescript
// Check for consent before tracking
if (hasUserConsent()) {
  analytics.enable();
  errorMonitoring.initialize();
} else {
  analytics.disable();
  // Still track anonymous, non-personal data if allowed
}

// Provide opt-out
function handleOptOut() {
  analytics.disable();
  errorMonitoring.setUser(null);
  localStorage.removeItem('analytics_user_id');
}
```

### Data Retention

- Configure retention policies in providers
- Implement data deletion on request
- Document what data is collected
- Provide data export functionality

## Resources

- [Google Analytics 4 Documentation](https://developers.google.com/analytics)
- [Mixpanel Documentation](https://developer.mixpanel.com/docs)
- [Sentry Documentation](https://docs.sentry.io/)
- [Web Vitals](https://web.dev/vitals/)
- [Performance Observer API](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)