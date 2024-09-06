import type { ReactEventHandler } from 'react'
import React, { useEffect, useRef, useState } from 'react'

import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source'
import { createRoot } from 'react-dom/client'
import { getEventType } from './defaults'

/**
 * Anything rendered inside of gantt should be movable within it
 * and the position should be calculated for it
 * Everything else belongs to the element logic itself (like rersizing)
 *
 */
function GanttElementWrapper(props: {
  onClick: ReactEventHandler<PointerEvent>
}) {
  const {
    onClick,
    event,
    schedulingThreeshold,
    EventSlot,
    eventProps,
    startDate,
    endDate,
    dateRange,
    level,
    eventHeight,
    tickWidthPixels,
    id,
    rowId,
    updateEvent,
    selected,
    gridLayout,
  } = props

  const [dragging, setDragging] = useState(false)

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current

    if (!element)
      return

    return draggable({
      element,
      getInitialData: (e) => {
        const dragDiffX = e.input.clientX - e.element.getBoundingClientRect().x
        return {
          startDate,
          endDate,
          id,
          rowId,
          height: e.element.getBoundingClientRect().height,
          dragDiffX,
          width: e.element.getBoundingClientRect().width,
          type: getEventType(),
        }
      },
      getInitialDataForExternal: (e) => {
        const dragDiffX = e.input.clientX - e.element.getBoundingClientRect().x
        return {
          [getEventType({
            dataType: 'json',
            metadata: [
              `${dragDiffX.toString()}`,
              `${e.element.getBoundingClientRect().width}`,
            ],
          })]: JSON.stringify({
            ...event,
            rowId,
          }),
        }
      },
      onDragStart() {
        setDragging(true)
      },
      onDrop() {
        setDragging(false)
      },
      onGenerateDragPreview: ({ source, location, nativeSetDragImage }) => {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: preserveOffsetOnSource({
            element,
            input: location.current.input,
          }),
          render({ container }) {
            const root = createRoot(container)
            root.render(
              <div
                style={{
                  height: `${element.getBoundingClientRect().height}px`,
                  width: `${element.getBoundingClientRect().width}px`,
                }}
              >
                <EventSlot
                  startDate={startDate}
                  endDate={endDate}
                  dateRange={dateRange}
                  level={level}
                  id={id}
                  eventHeight={eventHeight}
                  tickWidthPixels={tickWidthPixels}
                />
              </div>,
            )
            return () => root.unmount()
          },
        })
      },
    })
  }, [endDate, startDate, tickWidthPixels])

  if (dragging)
    return null

  return (
    <div
      data-role="gantt-event"
      data-event-id={id}
      className="gantt-event"
      ref={ref}
      onClick={onClick}
      style={{
        height: gridLayout ? 'fit-content' : '100%',
        position: gridLayout ? 'relative' : 'absolute',
        ...(gridLayout
          ? {
              gridColumnStart:
                (startDate - dateRange[0]) / schedulingThreeshold + 1,
              gridColumnEnd:
                (endDate - dateRange[0]) / schedulingThreeshold + 1,
              gridRowStart: level + 1,
              gridRowEnd: level + 2,
            }
          : {
              maxHeight: `${eventHeight}px`,
              left: `${(startDate - dateRange[0]) / tickWidthPixels}px`,
              width: `${
                (endDate - dateRange[0] - (startDate - dateRange[0]))
                / tickWidthPixels
              }px`,
              top: `${Math.max(level * (eventHeight + 8)) + 8}px`,
            }),
      }}
    >
      <EventSlot
        startDate={startDate}
        endDate={endDate}
        dateRange={dateRange}
        i={level}
        id={id}
        event={event}
        updateEvent={updateEvent}
        eventHeight={eventHeight}
        tickWidthPixels={tickWidthPixels}
        selected={selected}
        schedulingThreeshold={schedulingThreeshold}
        {...eventProps}
      />
    </div>
  )
}

export default React.memo(GanttElementWrapper)
