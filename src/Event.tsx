import React, { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'

import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source'

import type { ReactEventHandler } from 'react'

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
    ganttRef,
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
    placeholder,
    rowId,
    updateEvent,
    selected,
    gridLayout,
    selectedEventsRef,
    getDragPreview,
    setDragging,
    draggedElements,
  } = props

  const ref = useRef<HTMLDivElement>(null)
  const events = useRef<HTMLElement[]>([])

  useEffect(() => {
    const element = ref.current

    if (!element)
      return

    return draggable({
      element,
      getInitialData: (e) => {
        const out = []

        const events = []
        for (const { id } of selectedEventsRef.current) {
          const event = ganttRef.current.querySelector(
            `[data-event-id="${id}"]`,
          ) as HTMLElement
          if (!event)
            continue
          events.push(event)
        }

        for (const event of events) {
          const id = event.getAttribute('data-event-id')
          const data = selectedEventsRef.current.find(el => el.id === id)
          const dragDiffX = e.input.clientX - event.getBoundingClientRect().x

          out.push({
            startDate: data.startDate,
            endDate: data.endDate,
            id,
            rowId: data.resource,
            width: event.getBoundingClientRect().width,
            height: event.getBoundingClientRect().height,
            dragDiffX,
            type: getEventType(),
          })
        }
        return { events: out }
      },
      getInitialDataForExternal: (e) => {
        const dragDiffX = e.input.clientX - e.element.getBoundingClientRect().x
        return {
          [getEventType({
            dataType: 'json',
            metadata: [
              `${dragDiffX.toString()}`,
              `${e.element.getBoundingClientRect().width}`,
              `${e.element.getBoundingClientRect().height}`,
            ],
          })]: JSON.stringify({
            ...event,
            rowId,
          }),
        }
      },
      onDragStart() {
        setDragging(true)
        const out = []
        const dragged = []
        for (const { id } of selectedEventsRef.current) {
          const event = ganttRef.current.querySelector(
            `[data-event-id="${id}"]`,
          ) as HTMLElement
          if (!event)
            continue
          out.push(event)
          dragged.push(id)
        }
        draggedElements.current = dragged
        events.current = out
      },
      onDrop() {
        events.current = []
      },
      onGenerateDragPreview: ({ location, nativeSetDragImage }) => {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: preserveOffsetOnSource({
            element,
            input: location.current.input,
          }),
          render({ container }) {
            const root = createRoot(container)
            root.render(getDragPreview
              ? (
                  <div
                    style={{
                      height: `auto`,
                      width: `auto`,
                      position: 'relative',
                    }}
                  >
                    {getDragPreview({
                      events: selectedEventsRef.current,
                      EventSlot,
                    })
                    //  map((el, i) => (
                    //  <div
                    //    style={{
                    //      marginTop: `-15px`,
                    //      marginLeft: `${i * 6}px`,
                    //      width: `${(el.endDate - el.startDate) / tickWidthPixels}px`,
                    //    }}
                    //    key={el.id}
                    //  >
                    //    <EventSlot
                    //      style={{
                    //        boxShadow: '0px 0px 20px black',
                    //      }}
                    //      startDate={el.startDate}
                    //      endDate={el.endDate}
                    //      dateRange={dateRange}
                    //      id={id}
                    //      eventHeight={eventHeight}
                    //      tickWidthPixels={tickWidthPixels}
                    //    />
                    //  </div>
                    // ))
                    }
                  </div>
                ) : <div>&nbsp;</div>,
            )
            return () => root.unmount()
          },
        })
      },
    })
  }, [endDate, startDate, tickWidthPixels])

  return (
    <div
      data-role={placeholder ? 'gantt-event-placeholder' : 'gantt-event'}
      data-event-id={placeholder ? undefined : id}
      data-event-placeholder-id={placeholder ? id : undefined}
      className="gantt-event"
      ref={ref}
      onPointerDown={selected ? () => {} : onClick}
      style={{
        height: gridLayout ? 'fit-content' : '100%',
        position: gridLayout ? 'relative' : 'absolute',
        ...(gridLayout
          ? {
              gridColumnStart:
                Math.max((startDate - dateRange[0]) / schedulingThreeshold + 1, 1),
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