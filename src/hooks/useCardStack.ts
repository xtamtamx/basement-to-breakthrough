import { useState, useCallback, useMemo } from 'react';

export interface CardPosition {
  id: string;
  x: number;
  y: number;
  stackId?: string;
  stackIndex?: number;
}

export interface CardStack {
  id: string;
  cards: string[];
  x: number;
  y: number;
}

interface UseCardStackOptions {
  stackThreshold?: number; // Distance in pixels to trigger stacking
  stackOffset?: number; // Offset between stacked cards
  maxStackSize?: number;
}

export const useCardStack = (
  initialPositions: CardPosition[] = [],
  options: UseCardStackOptions = {}
) => {
  const {
    stackThreshold = 50,
    stackOffset = 5,
    maxStackSize = 5,
  } = options;

  const [positions, setPositions] = useState<CardPosition[]>(initialPositions);
  const [stacks, setStacks] = useState<Map<string, CardStack>>(new Map());

  // Get all cards in a specific stack
  const getStackCards = useCallback((stackId: string): CardPosition[] => {
    return positions.filter(pos => pos.stackId === stackId)
      .sort((a, b) => (a.stackIndex || 0) - (b.stackIndex || 0));
  }, [positions]);

  // Check if two positions are close enough to stack
  const canStack = useCallback((pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
    const distance = Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) + 
      Math.pow(pos1.y - pos2.y, 2)
    );
    return distance < stackThreshold;
  }, [stackThreshold]);

  // Find the nearest card or stack to a position
  const findNearestStackable = useCallback((
    cardId: string, 
    position: { x: number; y: number }
  ): { targetId: string; isStack: boolean } | null => {
    let nearest: { targetId: string; isStack: boolean; distance: number } | null = null;
    let minDistance = stackThreshold;

    // Check other cards
    positions.forEach(pos => {
      if (pos.id === cardId) return;
      
      const distance = Math.sqrt(
        Math.pow(position.x - pos.x, 2) + 
        Math.pow(position.y - pos.y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = { targetId: pos.id, isStack: false, distance };
      }
    });

    // Check stacks
    stacks.forEach(stack => {
      const distance = Math.sqrt(
        Math.pow(position.x - stack.x, 2) + 
        Math.pow(position.y - stack.y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = { targetId: stack.id, isStack: true, distance };
      }
    });

    return nearest ? { targetId: nearest.targetId, isStack: nearest.isStack } : null;
  }, [positions, stacks, stackThreshold]);

  // Update card position
  const updatePosition = useCallback((cardId: string, newPosition: { x: number; y: number }) => {
    setPositions(prev => prev.map(pos => 
      pos.id === cardId 
        ? { ...pos, x: newPosition.x, y: newPosition.y }
        : pos
    ));
  }, []);

  // Create a new stack from two cards
  const createStack = useCallback((card1Id: string, card2Id: string) => {
    const card1 = positions.find(p => p.id === card1Id);
    const card2 = positions.find(p => p.id === card2Id);
    
    if (!card1 || !card2) return;

    const stackId = `stack-${Date.now()}`;
    const stack: CardStack = {
      id: stackId,
      cards: [card1Id, card2Id],
      x: card2.x,
      y: card2.y,
    };

    setStacks(prev => new Map(prev).set(stackId, stack));
    
    setPositions(prev => prev.map(pos => {
      if (pos.id === card1Id) {
        return {
          ...pos,
          stackId,
          stackIndex: 1,
          x: card2.x,
          y: card2.y + stackOffset,
        };
      }
      if (pos.id === card2Id) {
        return {
          ...pos,
          stackId,
          stackIndex: 0,
        };
      }
      return pos;
    }));
  }, [positions, stackOffset]);

  // Add a card to an existing stack
  const addToStack = useCallback((cardId: string, stackId: string) => {
    const stack = stacks.get(stackId);
    if (!stack || stack.cards.length >= maxStackSize) return;

    const card = positions.find(p => p.id === cardId);
    if (!card) return;

    // Update stack
    setStacks(prev => {
      const newStacks = new Map(prev);
      const updatedStack = { ...stack, cards: [...stack.cards, cardId] };
      newStacks.set(stackId, updatedStack);
      return newStacks;
    });

    // Update card position
    setPositions(prev => prev.map(pos => {
      if (pos.id === cardId) {
        return {
          ...pos,
          stackId,
          stackIndex: stack.cards.length,
          x: stack.x,
          y: stack.y + (stack.cards.length * stackOffset),
        };
      }
      return pos;
    }));
  }, [stacks, positions, stackOffset, maxStackSize]);

  // Remove a card from a stack
  const removeFromStack = useCallback((cardId: string) => {
    const card = positions.find(p => p.id === cardId);
    if (!card || !card.stackId) return;

    const stack = stacks.get(card.stackId);
    if (!stack) return;

    const remainingCards = stack.cards.filter(id => id !== cardId);

    if (remainingCards.length === 1) {
      // Dissolve stack if only one card remains
      setStacks(prev => {
        const newStacks = new Map(prev);
        newStacks.delete(card.stackId!);
        return newStacks;
      });

      setPositions(prev => prev.map(pos => {
        if (pos.stackId === card.stackId) {
          return { ...pos, stackId: undefined, stackIndex: undefined };
        }
        return pos;
      }));
    } else {
      // Update stack
      setStacks(prev => {
        const newStacks = new Map(prev);
        newStacks.set(card.stackId!, { ...stack, cards: remainingCards });
        return newStacks;
      });

      // Reindex remaining cards
      setPositions(prev => prev.map(pos => {
        if (pos.stackId === card.stackId && pos.id !== cardId) {
          const newIndex = remainingCards.indexOf(pos.id);
          return {
            ...pos,
            stackIndex: newIndex,
            y: stack.y + (newIndex * stackOffset),
          };
        }
        if (pos.id === cardId) {
          return { ...pos, stackId: undefined, stackIndex: undefined };
        }
        return pos;
      }));
    }
  }, [positions, stacks, stackOffset]);

  // Handle card drop - auto-stack if near another card
  const handleCardDrop = useCallback((cardId: string, dropPosition: { x: number; y: number }) => {
    const nearest = findNearestStackable(cardId, dropPosition);
    
    if (nearest) {
      if (nearest.isStack) {
        addToStack(cardId, nearest.targetId);
      } else {
        createStack(cardId, nearest.targetId);
      }
    } else {
      updatePosition(cardId, dropPosition);
    }
  }, [findNearestStackable, addToStack, createStack, updatePosition]);

  // Fan out a stack for better visibility
  const fanStack = useCallback((stackId: string, fanDistance: number = 20) => {
    const stack = stacks.get(stackId);
    if (!stack) return;

    setPositions(prev => prev.map(pos => {
      if (pos.stackId === stackId && pos.stackIndex !== undefined) {
        return {
          ...pos,
          x: stack.x + (pos.stackIndex * fanDistance),
          y: stack.y + (pos.stackIndex * stackOffset),
        };
      }
      return pos;
    }));
  }, [stacks, stackOffset]);

  // Collapse a fanned stack
  const collapseStack = useCallback((stackId: string) => {
    const stack = stacks.get(stackId);
    if (!stack) return;

    setPositions(prev => prev.map(pos => {
      if (pos.stackId === stackId && pos.stackIndex !== undefined) {
        return {
          ...pos,
          x: stack.x,
          y: stack.y + (pos.stackIndex * stackOffset),
        };
      }
      return pos;
    }));
  }, [stacks, stackOffset]);

  return {
    positions,
    stacks: Array.from(stacks.values()),
    updatePosition,
    handleCardDrop,
    removeFromStack,
    fanStack,
    collapseStack,
    getStackCards,
  };
};