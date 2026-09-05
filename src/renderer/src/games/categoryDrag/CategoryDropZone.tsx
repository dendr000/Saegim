import { useState, type DragEvent } from 'react';
import DraggableItem from './DraggableItem';

type CategoryDropZoneProps = {
  label: string;
  items: { id: string; label: string }[];
  onDropItem: (itemId: string) => void;
};

function CategoryDropZone({ label, items, onDropItem }: CategoryDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragOver(true);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragOver(false);
    const itemId = event.dataTransfer.getData('text/plain');
    if (itemId) onDropItem(itemId);
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className="stage-panel"
      style={{
        minHeight: '90px',
        minWidth: '160px',
        display: 'inline-block',
        verticalAlign: 'top',
        margin: '0.25rem',
        opacity: isDragOver ? 0.7 : 1
      }}
    >
      <strong className="stage-text">{label}</strong>
      <div>
        {items.map((item) => (
          <DraggableItem key={item.id} id={item.id} label={item.label} />
        ))}
      </div>
    </div>
  );
}

export default CategoryDropZone;
