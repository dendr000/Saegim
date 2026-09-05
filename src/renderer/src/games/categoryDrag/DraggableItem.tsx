import type { DragEvent } from 'react';

type DraggableItemProps = {
  id: string;
  label: string;
};

function DraggableItem({ id, label }: DraggableItemProps) {
  function handleDragStart(event: DragEvent<HTMLDivElement>): void {
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="stage-button"
      style={{ cursor: 'grab', display: 'inline-block', margin: '0.25rem' }}
    >
      {label}
    </div>
  );
}

export default DraggableItem;
