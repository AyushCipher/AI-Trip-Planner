import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDispatch } from 'react-redux';
import { reorderStops } from '../store/itinerarySlice.js';
import StopCard from './StopCard.jsx';
import './DayCard.css';

// ── Sortable wrapper for each StopCard ──
function SortableStop({ stop, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <StopCard
        stop={stop}
        onRemove={onRemove}
        dragHandleProps={listeners}
      />
    </div>
  );
}

export default function DayCard({ day, onRemoveStop }) {
  const [expanded, setExpanded] = useState(true);
  const dispatch = useDispatch();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = day.stops.findIndex((s) => s.id === active.id);
    const newIndex = day.stops.findIndex((s) => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      dispatch(reorderStops({ dayId: day.id, oldIndex, newIndex }));
    }
  };

  const handleRemove = (stopId) => {
    onRemoveStop(day.id, stopId);
  };

  const stopIds = day.stops ? day.stops.map((s) => s.id) : [];

  return (
    <div className="day-card">
      <div
        className="day-card__header"
        onClick={toggleExpand}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpand();
          }
        }}
      >
        <div className="day-card__header-left">
          <div className="day-card__number">{day.dayNumber}</div>
          <h2 className="day-card__title">{day.title}</h2>
        </div>
        <div className="day-card__header-right">
          <span className="day-card__stop-count">
            {day.stops?.length || 0} stops
          </span>
          <span
            className={`day-card__chevron ${
              expanded ? 'day-card__chevron--expanded' : ''
            }`}
          >
            ▼
          </span>
        </div>
      </div>

      <div
        className={`day-card__content-wrapper ${
          expanded ? 'day-card__content-wrapper--expanded' : ''
        }`}
      >
        <div className="day-card__content">
          <div className="stops-list" data-day-id={day.id}>
            {!day.stops || day.stops.length === 0 ? (
              <p className="day-card__empty-msg">
                No stops planned for this day.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stopIds}
                  strategy={verticalListSortingStrategy}
                >
                  {day.stops.map((stop) => (
                    <SortableStop
                      key={stop.id}
                      stop={stop}
                      onRemove={handleRemove}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
