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
    rowId,
    updateEvent,
    selected,
    gridLayout,
    selectedEventsRef,
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

        for (const event of events.current) {
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
        const out = []
        for (const { id } of selectedEventsRef.current) {
          const event = ganttRef.current.querySelector(
            `[data-event-id="${id}"]`,
          ) as HTMLElement
          if (!event)
            continue
          out.push(event)
          event.style.setProperty('display', 'none')
        }
        events.current = out
      },
      onDrop() {
        for (const event of events.current) {
          event.style.setProperty('display', 'unset')
        }
        events.current = []
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
                  height: `auto`,
                  width: `auto`,
                  position: 'relative',
                }}
              >
                {selectedEventsRef.current.map((el, i) => (
                  <div
                    style={{
                      marginTop: `-15px`,
                      marginLeft: `${i * 6}px`,
                      width: `${(el.endDate - el.startDate) / tickWidthPixels}px`,
                    }}
                    key={el.id}
                  >
                    <EventSlot
                      style={{
                        boxShadow: '0px 0px 20px black',
                      }}
                      startDate={el.startDate}
                      endDate={el.endDate}
                      dateRange={dateRange}
                      id={id}
                      eventHeight={eventHeight}
                      tickWidthPixels={tickWidthPixels}
                    />
                  </div>
                ))}
              </div>,
            )
            return () => root.unmount()
          },
        })
      },
    })
  }, [endDate, startDate, tickWidthPixels])

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
