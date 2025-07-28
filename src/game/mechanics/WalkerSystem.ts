import { Walker, WalkerType, WalkerState, Venue, Band } from '@game/types';
import { useGameStore } from '@stores/gameStore';

export class WalkerSystem {
  private walkers: Map<string, Walker> = new Map();
  private nextId = 1;
  
  // A* pathfinding
  private findPath(startX: number, startY: number, endX: number, endY: number, gridSize: number): { x: number; y: number }[] {
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
        let node: any = current;
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
    walker.path = this.findPath(walker.x, walker.y, walker.targetX!, walker.targetY!, 8);
    if (walker.path.length > 0) {
      walker.state = WalkerState.WALKING;
    }
    
    this.walkers.set(id, walker);
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
    
    walker.path = this.findPath(walker.x, walker.y, walker.targetX!, walker.targetY!, 8);
    if (walker.path.length > 0) {
      walker.state = WalkerState.WALKING;
    }
    
    this.walkers.set(id, walker);
    return walker;
  }
  
  update(deltaTime: number): void {
    const walkersArray = Array.from(this.walkers.values());
    
    walkersArray.forEach(walker => {
      if (walker.state === WalkerState.WALKING && walker.path.length > 0) {
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
          // Smooth movement with slight curve
          const ratio = speed / distance;
          
          // Add slight curve to movement for more natural feel
          const curveAmount = 0.05 * Math.sin(Date.now() / 500 + walker.id.charCodeAt(0));
          walker.x += dx * ratio + curveAmount * -dy * 0.02;
          walker.y += dy * ratio + curveAmount * dx * 0.02;
          
          // Ensure walker doesn't overshoot
          walker.x = Math.max(0, Math.min(7, walker.x));
          walker.y = Math.max(0, Math.min(7, walker.y));
        }
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
    }
  }
  
  removeWalker(id: string): void {
    this.walkers.delete(id);
  }
  
  getWalkers(): Walker[] {
    return Array.from(this.walkers.values());
  }
}

export const walkerSystem = new WalkerSystem();