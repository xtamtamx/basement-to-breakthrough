import { Walker, WalkerType, WalkerState, Venue, Band } from '@game/types';
import { useGameStore } from '@stores/gameStore';

export class WalkerSystem {
  private walkers: Map<string, Walker> = new Map();
  private nextId = 1;
  private occupiedCells: Set<string> = new Set();
  
  // Get cell key for collision detection
  private getCellKey(x: number, y: number): string {
    return `${Math.floor(x)},${Math.floor(y)}`;
  }
  
  // Check if cell is occupied by another walker
  private isCellOccupied(x: number, y: number, excludeWalkerId?: string): boolean {
    const key = this.getCellKey(x, y);
    if (!this.occupiedCells.has(key)) return false;
    
    // Check if the cell is occupied by a different walker
    for (const [walkerId, walker] of this.walkers) {
      if (walkerId === excludeWalkerId) continue;
      if (this.getCellKey(walker.x, walker.y) === key) {
        return true;
      }
    }
    return false;
  }
  
  // A* pathfinding with obstacle avoidance
  private findPath(startX: number, startY: number, endX: number, endY: number, gridSize: number, excludeWalkerId?: string): { x: number; y: number }[] {
    const openSet: { x: number; y: number; f: number; g: number; h: number; parent?: { x: number; y: number } }[] = [];
    const closedSet = new Set<string>();
    
    const heuristic = (a: { x: number; y: number }, b: { x: number; y: number }) => 
      Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    
    openSet.push({ x: startX, y: startY, f: 0, g: 0, h: heuristic({ x: startX, y: startY }, { x: endX, y: endY }) });
    
    while (openSet.length > 0) {
      // Find node with lowest f score
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      
      if (current.x === endX && current.y === endY) {
        // Reconstruct path
        const path: { x: number; y: number }[] = [];
        let node: { x: number; y: number; parent?: { x: number; y: number; parent?: any } } = current;
        while (node.parent) {
          path.unshift({ x: node.x, y: node.y });
          node = node.parent;
        }
        return path;
      }
      
      closedSet.add(`${current.x},${current.y}`);
      
      // Check neighbors
      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 }
      ];
      
      for (const neighbor of neighbors) {
        if (neighbor.x < 0 || neighbor.x >= gridSize || neighbor.y < 0 || neighbor.y >= gridSize) continue;
        if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue;
        
        // Skip if cell is occupied by another walker
        if (this.isCellOccupied(neighbor.x, neighbor.y, excludeWalkerId)) continue;
        
        // Check if there's a venue blocking the path (venues occupy cells)
        const store = useGameStore.getState();
        const isBlocked = store.venues.some(venue => 
          venue.gridPosition && 
          venue.gridPosition.x === neighbor.x && 
          venue.gridPosition.y === neighbor.y &&
          !(neighbor.x === endX && neighbor.y === endY) // Allow destination venue
        );
        if (isBlocked) continue;
        
        const g = current.g + 1;
        const h = heuristic(neighbor, { x: endX, y: endY });
        const f = g + h;
        
        const existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
        if (!existingNode || g < existingNode.g) {
          if (existingNode) {
            existingNode.g = g;
            existingNode.f = f;
            existingNode.parent = current;
          } else {
            openSet.push({ ...neighbor, f, g, h, parent: current });
          }
        }
      }
    }
    
    return []; // No path found
  }
  
  createMusicianWalker(band: Band, fromVenue: Venue, toVenue: Venue): Walker {
    const id = `walker-${this.nextId++}`;
    const walker: Walker = {
      id,
      type: WalkerType.MUSICIAN,
      name: band.name,
      x: fromVenue.gridPosition?.x || 0,
      y: fromVenue.gridPosition?.y || 0,
      targetX: toVenue.gridPosition?.x || 0,
      targetY: toVenue.gridPosition?.y || 0,
      path: [],
      speed: 2, // 2 cells per second
      state: WalkerState.IDLE,
      data: { bandId: band.id, fromVenueId: fromVenue.id, toVenueId: toVenue.id }
    };
    
    // Calculate path
    walker.path = this.findPath(walker.x, walker.y, walker.targetX!, walker.targetY!, 8, id);
    if (walker.path.length > 0) {
      walker.state = WalkerState.WALKING;
    }
    
    this.walkers.set(id, walker);
    this.occupiedCells.add(this.getCellKey(walker.x, walker.y));
    return walker;
  }
  
  createFanWalker(fromX: number, fromY: number, toVenue: Venue): Walker {
    const id = `walker-${this.nextId++}`;
    const walker: Walker = {
      id,
      type: WalkerType.FAN,
      name: 'Fan',
      x: fromX,
      y: fromY,
      targetX: toVenue.gridPosition?.x || 0,
      targetY: toVenue.gridPosition?.y || 0,
      path: [],
      speed: 1.5,
      state: WalkerState.IDLE,
      data: { toVenueId: toVenue.id }
    };
    
    walker.path = this.findPath(walker.x, walker.y, walker.targetX!, walker.targetY!, 8, id);
    if (walker.path.length > 0) {
      walker.state = WalkerState.WALKING;
    }
    
    this.walkers.set(id, walker);
    this.occupiedCells.add(this.getCellKey(walker.x, walker.y));
    return walker;
  }
  
  createPromoterWalker(fromVenue: Venue, targetArea: { x: number; y: number }): Walker {
    const id = `walker-${this.nextId++}`;
    const walker: Walker = {
      id,
      type: WalkerType.PROMOTER,
      name: 'Promoter',
      x: fromVenue.gridPosition?.x || 0,
      y: fromVenue.gridPosition?.y || 0,
      targetX: targetArea.x,
      targetY: targetArea.y,
      path: [],
      speed: 1.2, // Promoters move slower, handing out flyers
      state: WalkerState.IDLE,
      data: { 
        promotionRadius: 2, 
        effectiveness: 0.7,
        fromVenueId: fromVenue.id 
      } as any
    };
    
    walker.path = this.findPath(walker.x, walker.y, walker.targetX!, walker.targetY!, 8, id);
    if (walker.path.length > 0) {
      walker.state = WalkerState.WALKING;
    }
    
    this.walkers.set(id, walker);
    this.occupiedCells.add(this.getCellKey(walker.x, walker.y));
    return walker;
  }
  
  createSupplierWalker(fromX: number, fromY: number, toVenue: Venue): Walker {
    const id = `walker-${this.nextId++}`;
    const walker: Walker = {
      id,
      type: WalkerType.SUPPLIER,
      name: 'Equipment Delivery',
      x: fromX,
      y: fromY,
      targetX: toVenue.gridPosition?.x || 0,
      targetY: toVenue.gridPosition?.y || 0,
      path: [],
      speed: 1.0, // Trucks move slower
      state: WalkerState.IDLE,
      data: { 
        toVenueId: toVenue.id,
        deliveryType: 'equipment'
      } as any
    };
    
    walker.path = this.findPath(walker.x, walker.y, walker.targetX!, walker.targetY!, 8, id);
    if (walker.path.length > 0) {
      walker.state = WalkerState.WALKING;
    }
    
    this.walkers.set(id, walker);
    this.occupiedCells.add(this.getCellKey(walker.x, walker.y));
    return walker;
  }
  
  update(deltaTime: number): void {
    const walkersArray = Array.from(this.walkers.values());
    
    // Clear occupied cells and rebuild
    this.occupiedCells.clear();
    
    walkersArray.forEach(walker => {
      if (walker.state === WalkerState.WALKING && walker.path.length > 0) {
        const oldCellKey = this.getCellKey(walker.x, walker.y);
        
        // Smooth speed with easing
        const baseSpeed = walker.speed * deltaTime;
        const distanceToEnd = walker.path.length;
        const speedMultiplier = distanceToEnd > 2 ? 1 : 0.5 + (distanceToEnd / 4); // Slow down near destination
        const speed = baseSpeed * speedMultiplier;
        
        const nextPoint = walker.path[0];
        
        const dx = nextPoint.x - walker.x;
        const dy = nextPoint.y - walker.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= speed) {
          // Reached waypoint
          walker.x = nextPoint.x;
          walker.y = nextPoint.y;
          walker.path.shift();
          
          if (walker.path.length === 0) {
            // Reached destination
            walker.state = WalkerState.AT_VENUE;
            walker.x = walker.targetX!;
            walker.y = walker.targetY!;
            this.handleArrival(walker);
          }
        } else {
          // Smooth movement with bezier curve interpolation
          const ratio = speed / distance;
          
          // Use easing function for smoother movement
          const easedRatio = this.easeInOutQuad(ratio);
          
          // Add slight curve to movement for more natural feel
          const curveAmount = 0.03 * Math.sin(Date.now() / 300 + walker.id.charCodeAt(0));
          
          walker.x += dx * easedRatio + curveAmount * -dy;
          walker.y += dy * easedRatio + curveAmount * dx;
          
          // Ensure walker doesn't overshoot grid bounds
          walker.x = Math.max(0, Math.min(7.99, walker.x));
          walker.y = Math.max(0, Math.min(7.99, walker.y));
        }
        
        // Check if walker is stuck and needs rerouting
        const newCellKey = this.getCellKey(walker.x, walker.y);
        if (oldCellKey === newCellKey && walker.path.length > 0) {
          walker.stuckCounter = (walker.stuckCounter || 0) + 1;
          
          // If stuck for too long, recalculate path
          if (walker.stuckCounter > 60) { // 1 second at 60fps
            walker.path = this.findPath(walker.x, walker.y, walker.targetX!, walker.targetY!, 8, walker.id);
            walker.stuckCounter = 0;
            
            // If no path found, remove walker
            if (walker.path.length === 0) {
              walker.state = WalkerState.LEAVING;
              this.removeWalker(walker.id);
            }
          }
        } else {
          walker.stuckCounter = 0;
        }
      }
      
      // Update occupied cells
      if (walker.state !== WalkerState.LEAVING) {
        this.occupiedCells.add(this.getCellKey(walker.x, walker.y));
      }
    });
    
    // Update game store
    const store = useGameStore.getState();
    store.updateWalkers(walkersArray);
  }
  
  private handleArrival(walker: Walker): void {
    switch (walker.type) {
      case WalkerType.MUSICIAN:
        // Musicians perform at venue
        setTimeout(() => {
          walker.state = WalkerState.PERFORMING;
          setTimeout(() => {
            walker.state = WalkerState.LEAVING;
            this.removeWalker(walker.id);
          }, 5000); // Perform for 5 seconds
        }, 1000); // Wait 1 second before performing
        break;
        
      case WalkerType.FAN:
        // Fans watch show then leave
        setTimeout(() => {
          walker.state = WalkerState.LEAVING;
          this.removeWalker(walker.id);
        }, 8000); // Stay for 8 seconds
        break;
        
      case WalkerType.PROMOTER:
        // Promoters hand out flyers then move to next area
        setTimeout(() => {
          // Increase awareness in the area
          const store = useGameStore.getState();
          const promoterData = walker.data as any;
          if (promoterData?.fromVenueId) {
            // TODO: Implement promotion effect on nearby districts
          }
          
          // Move to another random area
          const newX = Math.floor(Math.random() * 8);
          const newY = Math.floor(Math.random() * 8);
          walker.targetX = newX;
          walker.targetY = newY;
          walker.path = this.findPath(walker.x, walker.y, newX, newY, 8, walker.id);
          
          if (walker.path.length > 0) {
            walker.state = WalkerState.WALKING;
          } else {
            walker.state = WalkerState.LEAVING;
            this.removeWalker(walker.id);
          }
        }, 3000); // Promote for 3 seconds
        break;
        
      case WalkerType.SUPPLIER:
        // Deliver equipment then leave
        setTimeout(() => {
          const store = useGameStore.getState();
          const supplierData = walker.data as any;
          if (supplierData?.toVenueId) {
            // TODO: Add equipment to venue
          }
          
          walker.state = WalkerState.LEAVING;
          this.removeWalker(walker.id);
        }, 2000); // Deliver for 2 seconds
        break;
        
      default:
        // Default behavior - leave after a while
        setTimeout(() => {
          walker.state = WalkerState.LEAVING;
          this.removeWalker(walker.id);
        }, 5000);
        break;
    }
  }
  
  removeWalker(id: string): void {
    const walker = this.walkers.get(id);
    if (walker) {
      this.occupiedCells.delete(this.getCellKey(walker.x, walker.y));
    }
    this.walkers.delete(id);
  }
  
  getWalkers(): Walker[] {
    return Array.from(this.walkers.values());
  }
  
  // Easing function for smooth movement
  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
  
  // Spawn walkers based on show results
  spawnShowResultWalkers(venue: Venue, attendance: number, success: boolean): void {
    if (!venue.gridPosition) return;
    
    // Spawn fans based on attendance
    const fanCount = Math.min(Math.floor(attendance / 20), 10); // Max 10 fan walkers
    for (let i = 0; i < fanCount; i++) {
      setTimeout(() => {
        // Fans come from random edges of the map
        const side = Math.floor(Math.random() * 4);
        let fromX = 0, fromY = 0;
        
        switch (side) {
          case 0: // Top
            fromX = Math.floor(Math.random() * 8);
            fromY = 0;
            break;
          case 1: // Right
            fromX = 7;
            fromY = Math.floor(Math.random() * 8);
            break;
          case 2: // Bottom
            fromX = Math.floor(Math.random() * 8);
            fromY = 7;
            break;
          case 3: // Left
            fromX = 0;
            fromY = Math.floor(Math.random() * 8);
            break;
        }
        
        this.createFanWalker(fromX, fromY, venue);
      }, i * 200); // Stagger fan arrivals
    }
    
    // Spawn promoters for successful shows
    if (success && attendance > 50) {
      setTimeout(() => {
        // Send out 1-3 promoters to spread the word
        const promoterCount = Math.min(Math.floor(attendance / 100) + 1, 3);
        for (let i = 0; i < promoterCount; i++) {
          setTimeout(() => {
            const targetX = Math.floor(Math.random() * 8);
            const targetY = Math.floor(Math.random() * 8);
            this.createPromoterWalker(venue, { x: targetX, y: targetY });
          }, i * 500);
        }
      }, 2000); // Promoters leave after fans arrive
    }
    
    // Spawn suppliers for venues that need equipment
    if (venue.type === 'WAREHOUSE' || venue.type === 'THEATER') {
      setTimeout(() => {
        // Equipment delivery from edge of map
        const fromX = Math.random() > 0.5 ? 0 : 7;
        const fromY = Math.floor(Math.random() * 8);
        this.createSupplierWalker(fromX, fromY, venue);
      }, 5000); // Suppliers arrive later
    }
  }
  
  // Clear all walkers
  clearAllWalkers(): void {
    this.walkers.clear();
    this.occupiedCells.clear();
    const store = useGameStore.getState();
    store.updateWalkers([]);
  }
}

export const walkerSystem = new WalkerSystem();