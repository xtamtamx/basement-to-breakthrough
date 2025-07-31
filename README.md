# DIY Indie Empire 🎸

A premium mobile-first PWA roguelike underground music scene builder. Think Balatro's synergy discovery + SimCity's infrastructure + authentic punk/metal scene management.

## 🎮 Game Overview

Build and manage the underground music scene from basement shows to legendary festivals. Book bands, manage venues, discover powerful synergies, and navigate the complex politics of the music underground.

### Core Gameplay Loop

1. **Book Shows**: Match bands to venues while considering capacity, genre fit, and scene politics
2. **Build Your Scene**: Progress from DIY basements to legendary underground venues
3. **Manage Resources**: Balance money, reputation, stress, and connections
4. **Discover Synergies**: Unlock powerful band/venue combinations through experimentation
5. **Navigate Politics**: Handle faction relationships and band drama
6. **Evolve Your Empire**: Unlock new bands, venues, and equipment as you grow

### Key Features

- **JRPG-Style City Map**: Explore a pixel art city with interactive venues and workplaces
- **Synergy Discovery System**: Hidden combinations revealed through gameplay
- **Authentic Scene Management**: Real underground music culture mechanics
- **Venue Upgrade System**: Improve your venues with sound systems, bars, and more
- **Dynamic Job System**: Work day jobs to fund your music empire
- **Faction Relationships**: Navigate between DIY purists, corporate interests, and more
- **Show Booking Interface**: Strategic planning with multiple factors to consider
- **Mobile-First Design**: Built for touchscreens with haptic feedback

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Build for mobile platforms
npm run build:mobile

# Add mobile platforms
npm run cap:add:ios      # Add iOS support
npm run cap:add:android  # Add Android support

# Open in native IDEs
npm run cap:open:ios     # Open in Xcode
npm run cap:open:android # Open in Android Studio
```

## 📱 Platform Support

- **Web**: Modern browsers with PWA support
- **iOS**: Via Capacitor (requires Xcode 14+)
- **Android**: Via Capacitor (requires Android Studio)
- **Desktop**: PWA installation on Windows/macOS/Linux

### Mobile Requirements
- iOS 13.0+ for native app
- Android 5.0+ (API 21+) for native app
- Touch-optimized with 44px minimum touch targets
- Supports both portrait and landscape orientations

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (mobile-first design system)
- **State Management**: Zustand with persistence
- **Storage**: IndexedDB (via idb) for save games
- **Animation**: Framer Motion for smooth transitions
- **Canvas**: HTML5 Canvas for pixel art city rendering
- **PWA**: Vite PWA Plugin for offline play
- **Native**: Capacitor for iOS/Android builds
- **Touch**: Unified pointer events with haptic feedback

## 🎯 Development Progress

### ✅ Completed Systems
- City generation with district-based layout
- Interactive JRPG-style pixel art map
- Venue and workplace placement system
- Show booking interface with band/venue matching
- Building info modals with upgrade systems
- Touch controls with pan, zoom, and tap
- Synergy discovery tracking system
- Save/load game persistence
- Mobile-responsive UI throughout

### 🚧 In Progress
- Multi-show booking capability
- District-specific gameplay mechanics
- Festival end-game content
- Gentrification pressure system
- Emergent cultural movements
- Real artist integration system

### 📋 Planned Features
- Music samples via Web Audio API
- Procedural band generation
- Tour management system
- Equipment crafting
- Rival promoter AI
- Achievement system
- Cloud save sync

## 🚧 Current Status

The game is in **active development** with core systems implemented. The city exploration, venue management, and show booking mechanics are fully functional. Content expansion and gameplay balancing are ongoing.

## 🎸 Game Content

### Venues
- **Basement**: 30 capacity, high authenticity, free to use
- **Garage**: 45 capacity, intimate setting, cheap rent
- **Dive Bar**: 80 capacity, has bar, age restricted
- **DIY Space**: 100 capacity, artist-friendly, all ages
- **Warehouse**: 150 capacity, temporary, police risk
- **Underground Club**: 120 capacity, legendary status

### Band Genres
- Punk (hardcore, riot grrrl, crust, street)
- Metal (doom, black, death, progressive)
- Hardcore (youth crew, metalcore)
- Experimental (noise, avant-garde)

### Resources
- **Money**: Book shows, upgrade venues, survive
- **Reputation**: Unlock better bands and venues
- **Fans**: Build your audience base
- **Stress**: Manage burnout from overwork
- **Connections**: Network within the scene

---

Built with ❤️ for the underground music scene
