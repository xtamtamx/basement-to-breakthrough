# Town Art Asset Specifications

## Overview
We need professional-quality art assets for a town/city building view in a premium mobile game about building an underground music scene. The art should support a town that starts small (5-10 buildings) and grows to a bustling city (100+ buildings).

## Art Style Requirements

### Visual Style
- **Modern SimCity 2000 aesthetic** - Clean, readable, charming
- **NOT pixel art** - Should look professional and polished
- **Colorful and inviting** - Appeals to casual mobile gamers
- **Clear building identification** - Players should instantly recognize building types

### Technical Requirements
- **Format:** PNG with transparency
- **Perspective:** Isometric (2:1 ratio) or clean top-down
- **Base Tile Size:** 64x64 or 128x128 pixels
- **Color Depth:** 24-bit with alpha channel
- **Shadows:** Included in sprites or separate layer

## Required Assets

### 1. Terrain Tiles (64x64 base)
- Grass (3-5 variations for texture)
- Roads:
  - Straight (horizontal, vertical)
  - Corners (all 4 directions)
  - T-junctions (all 4 orientations)
  - 4-way intersection
  - Dead ends (all 4 directions)
- Sidewalks/paths (matching road pieces)
- Plaza/town square tiles (stone or brick)

### 2. Residential Buildings
Small Houses (64x64):
- 4-6 variations
- Different roof colors
- Small yards/gardens

Medium Houses (64x96):
- 3-4 variations
- Two-story appearance
- More detailed

Apartments (96x128):
- 2-3 variations
- 3-4 story buildings
- Urban appearance

### 3. Commercial Buildings
Small Shops (64x64):
- Coffee shop
- Record store
- Convenience store
- Bookstore
- 3-4 generic shops

Medium Stores (96x96):
- Department store
- Grocery store
- Electronics store

### 4. Music Venues (Critical for gameplay)
Basement Venue (64x64):
- Small, grungy appearance
- "Underground" vibe

Small Club (96x96):
- Neon signs
- Urban/edgy look

Music Hall (128x96):
- Theater/concert hall appearance
- Marquee sign area

Arena (128x128):
- Large venue
- Stadium-like appearance

### 5. Community Buildings
Town Hall (96x96):
- Official/government appearance
- Flag pole

Library (64x96):
- Classic architecture

Community Center (96x64):
- Modern, welcoming

### 6. Decorative Elements
Trees:
- 4-6 varieties
- Different sizes
- Seasonal variations (optional)

Parks:
- Fountain (64x64)
- Benches
- Flower beds
- Playground equipment

Street Elements:
- Street lights
- Traffic lights
- Bus stops
- Mailboxes
- Trash cans

### 7. UI Elements
- Building selection highlight
- Grid overlay tiles
- Zone indicators
- Construction/upgrade animations

## Building Variations

Each building type should have:
- **Age variations:** New, Established, Old (different wear/details)
- **Style variations:** 3-4 visual styles per type
- **State variations:** Normal, Active (lights on), Special Event

## Color Palette Guidelines

Primary Colors:
- Grass Green: #4CAF50
- Road Gray: #455A64
- Building Base: #F5F5F5
- Roof Red: #F44336
- Roof Blue: #2196F3
- Accent Orange: #FF9800 (for music venues)

## Animation Requirements (Optional but valuable)

Simple Animations:
- Smoke from chimneys
- Blinking venue signs
- Traffic lights changing
- Water fountain animation
- Tree sway

## Delivery Format

Organize assets in folders:
```
/sprites/
  /terrain/
    grass_01.png
    grass_02.png
    road_straight_h.png
    ...
  /buildings/
    /residential/
      house_small_01.png
      ...
    /commercial/
      shop_coffee.png
      ...
    /venues/
      venue_basement.png
      ...
  /decorations/
    tree_oak_01.png
    fountain.png
    ...
```

## Asset Naming Convention
`[category]_[type]_[variation].png`

Examples:
- `building_house_small_01.png`
- `terrain_road_corner_ne.png`
- `decoration_tree_pine_02.png`

## Mobile Optimization Notes

- Keep individual sprite file sizes under 100KB
- Use PNG-8 where transparency allows
- Avoid excessive detail that won't be visible on mobile
- Ensure high contrast for small screen visibility
- Test assets at 1x, 2x, and 3x scaling

## Reference Games
- SimCity BuildIt (mobile)
- Townscaper (aesthetic)
- Two Point Hospital (clarity)
- Stardew Valley (charm)