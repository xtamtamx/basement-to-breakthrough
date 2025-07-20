import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export const TestDragDrop: React.FC = () => {
  const handleDragEnd = (result: any) => {
    console.log('Test drag result:', result);
  };

  return (
    <div className="p-4">
      <h2 className="pixel-text mb-4">DRAG TEST</h2>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="test-drop">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="bg-gray-800 p-4 min-h-[200px]"
            >
              <Draggable draggableId="test-1" index={0}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`bg-blue-500 p-4 mb-2 ${snapshot.isDragging ? 'opacity-50' : ''}`}
                  >
                    DRAG ME
                  </div>
                )}
              </Draggable>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};