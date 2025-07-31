import { devLog } from './devLogger';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

interface UserProperties {
  totalShows?: number;
  favoriteGenre?: string;
  maxRoundReached?: number;
  totalPlayTime?: number;
  platform?: string;
}

class Analytics {
  private queue: AnalyticsEvent[] = [];
  private userId: string | null = null;
  private sessionId: string;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadUserId();
    this.flushQueue = this.flushQueue.bind(this);
    
    // Flush queue periodically
    if (typeof window !== 'undefined') {
      setInterval(this.flushQueue, 30000); // Every 30 seconds
      window.addEventListener('beforeunload', this.flushQueue);
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadUserId(): void {
    try {
      this.userId = localStorage.getItem('analytics_user_id');
      if (!this.userId) {
        this.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('analytics_user_id', this.userId);
      }
    } catch (error) {
      devLog.error('Failed to load user ID:', error);
    }
  }

  // Track a custom event
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        userId: this.userId,
        sessionId: this.sessionId,
        platform: this.getPlatform(),
        timestamp: Date.now()
      }
    };

    this.queue.push(event);
    devLog.log(`Analytics event: ${eventName}`, properties);

    // Send to analytics providers
    this.sendToProviders(event);
  }

  // Track screen/page views
  trackScreen(screenName: string, properties?: Record<string, any>): void {
    this.track('screen_view', {
      screen_name: screenName,
      ...properties
    });
  }

  // Track user properties
  setUserProperties(properties: UserProperties): void {
    if (!this.isEnabled) return;

    // Update local storage
    try {
      const existingProps = JSON.parse(localStorage.getItem('user_properties') || '{}');
      const updatedProps = { ...existingProps, ...properties };
      localStorage.setItem('user_properties', JSON.stringify(updatedProps));
    } catch (error) {
      devLog.error('Failed to save user properties:', error);
    }

    // Send to providers
    if (window.gtag) {
      window.gtag('set', { user_properties: properties });
    }
  }

  // Track timing events
  trackTiming(category: string, variable: string, time: number): void {
    this.track('timing_complete', {
      timing_category: category,
      timing_variable: variable,
      timing_time: time
    });
  }

  // Track errors
  trackError(error: Error, fatal: boolean = false): void {
    this.track('error', {
      error_message: error.message,
      error_stack: error.stack,
      error_fatal: fatal
    });
  }

  // Game-specific tracking methods
  trackGameStart(runType: string): void {
    this.track('game_start', {
      run_type: runType,
      starting_money: 500,
      starting_reputation: 10
    });
  }

  trackShowBooked(show: {
    venueType: string;
    bandGenre: string;
    ticketPrice: number;
    expectedAttendance: number;
  }): void {
    this.track('show_booked', show);
  }

  trackShowCompleted(result: {
    attendance: number;
    revenue: number;
    rating: string;
    synergiesTriggered: string[];
  }): void {
    this.track('show_completed', result);
  }

  trackRoundCompleted(round: number, stats: {
    money: number;
    reputation: number;
    fans: number;
    stress: number;
  }): void {
    this.track('round_completed', {
      round_number: round,
      ...stats
    });
  }

  trackGameOver(reason: string, finalStats: {
    roundsPlayed: number;
    totalShows: number;
    finalMoney: number;
    finalReputation: number;
    finalFans: number;
  }): void {
    this.track('game_over', {
      reason,
      ...finalStats
    });
  }

  trackPurchase(item: {
    type: string;
    name: string;
    cost: number;
  }): void {
    this.track('purchase', item);
  }

  trackAchievement(achievement: {
    id: string;
    name: string;
    description: string;
  }): void {
    this.track('achievement_unlocked', achievement);
  }

  // Private methods
  private getPlatform(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/android/.test(userAgent)) return 'android';
    if (/macintosh/.test(userAgent)) return 'macos';
    if (/windows/.test(userAgent)) return 'windows';
    if (/linux/.test(userAgent)) return 'linux';
    
    return 'web';
  }

  private sendToProviders(event: AnalyticsEvent): void {
    // Google Analytics 4
    if (window.gtag) {
      window.gtag('event', event.name, event.properties);
    }

    // Mixpanel
    if (window.mixpanel) {
      window.mixpanel.track(event.name, event.properties);
    }

    // Custom analytics endpoint
    if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
      this.sendToCustomEndpoint(event);
    }
  }

  private async sendToCustomEndpoint(event: AnalyticsEvent): Promise<void> {
    try {
      await fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [event],
          context: {
            app_version: import.meta.env.VITE_APP_VERSION || '1.0.0',
            environment: import.meta.env.MODE
          }
        })
      });
    } catch (error) {
      devLog.error('Failed to send analytics:', error);
    }
  }

  private async flushQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
      try {
        await fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT + '/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            events,
            context: {
              app_version: import.meta.env.VITE_APP_VERSION || '1.0.0',
              environment: import.meta.env.MODE
            }
          })
        });
      } catch (error) {
        // Re-queue events on failure
        this.queue.unshift(...events);
        devLog.error('Failed to flush analytics queue:', error);
      }
    }
  }

  // Control methods
  disable(): void {
    this.isEnabled = false;
    this.queue = [];
  }

  enable(): void {
    this.isEnabled = true;
  }

  reset(): void {
    this.queue = [];
    this.sessionId = this.generateSessionId();
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Type declarations for global analytics libraries
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    mixpanel?: {
      track: (event: string, properties?: any) => void;
      identify: (userId: string) => void;
      people: {
        set: (properties: any) => void;
      };
    };
  }
}