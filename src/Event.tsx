import type { ElementWrapperProps } from './types'
import type { DragData } from './utils/dragData'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview'

import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source'

import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'

import React, { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { getEventType } from './defaults'
import classes from './gantt.module.css'
import { ResizeableEvent } from './ResizeableEvent'
import { dragDataKey } from './utils/dragData'

function GanttElementWrapper<EventT>(
  props: ElementWrapperProps<EventT>,
): React.ReactNode {
  const {
    onClick,
    event,
    ganttRef,
    schedulingThreeshold,
    EventSlot,
    eventProps,
    dateRange,
    level,
    eventHeight,
    msPerPixel,
    placeholder,
    updateEvent,
    selected,
    gridLayout,
    selectedEventsRef,
    getDragPreview,
    draggedElements,
  } = props

  const { id, startDate, endDate, resource } = event

  const ref = useRef<HTMLDivElement>(null)
  const events = useRef<HTMLElement[]>([])

  useEffect(() => {
    const element = ref.current

    if (!element)
      return

    return draggable({
      element,
      getInitialData: ({ input }): DragData | Record<string, unknown> => {
        const out = []

        const initialResource = event.resource

        for (const data of selectedEventsRef.current) {
          const { id } = data

          const eventElement = ganttRef.current?.querySelector(
            `[data-event-id="${id}"]`,
          ) as HTMLElement
          if (!eventElement)
            return {}
          const dragDiffX = input.clientX - eventElement.getBoundingClientRect().x

          out.push({
            startDate: data.startDate,
            endDate: data.endDate,
            id,
            resource: data.resource,
            width: eventElement.getBoundingClientRect().width,
            height: eventElement.getBoundingClientRect().height,
            dragDiffX,
            type: getEventType(),
          })
        }
        return {
          [dragDataKey]: true,
          events: out,
          reason: 'drag-event',
          initialResource,
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
              `${e.element.getBoundingClientRect().height}`,
            ],
          })]: JSON.stringify({
            ...event,
            resource,
          }),
        }
      },
      onDragStart() {
        const out = []
        const dragged = []
        for (const { id } of selectedEventsRef.current) {
          const event = ganttRef.current?.querySelector(
            `[data-event-id="${id}"]`,
          ) as HTMLElement
          if (!event)
            continue
          event.style.setProperty('display', 'none')
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
        if (!getDragPreview) {
          disableNativeDragPreview({ nativeSetDragImage })
        }
        else {
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
                  {getDragPreview({
                    events: selectedEventsRef.current,
                    EventSlot,
                    dateRange,
                    tickWidthPixels: msPerPixel,
                  })}
                </div>,
              )
              return () => root.unmount()
            },
          })
        }
      },
    })
  }, [
    endDate,
    startDate,
    msPerPixel,
    EventSlot,
    dateRange,
    draggedElements,
    event,
    ganttRef,
    getDragPreview,
    resource,
    selectedEventsRef,
  ])

  return (
    <div
      data-role={placeholder ? 'gantt-event-placeholder' : 'gantt-event'}
      data-event-id={placeholder ? undefined : id}
      data-event-placeholder-id={placeholder ? id : undefined}
      className={classes['gantt-event']}
      ref={ref}
      onPointerDown={selected ? () => { } : onClick}
      style={{
        height: gridLayout ? 'fit-content' : '100%',
        position: gridLayout ? 'relative' : 'absolute',
        ...(gridLayout
          ? {
              gridColumnStart: Math.max(
                (startDate - dateRange[0]) / schedulingThreeshold + 1,
                1,
              ),
              gridColumnEnd:
              (endDate - dateRange[0]) / schedulingThreeshold + 1,
              gridRowStart: level + 1,
              gridRowEnd: level + 2,
            }
          : {
              maxHeight: `${eventHeight}px`,
              left: `${(startDate - dateRange[0]) / msPerPixel}px`,
              width: `${(endDate - dateRange[0] - (startDate - dateRange[0]))
              / msPerPixel
              }px`,
              top: `${Math.max(level * (eventHeight + 8)) + 8}px`,
            }),
      }}
    >
      <ResizeableEvent
        schedulingThreeshold={schedulingThreeshold}
        startDate={startDate}
        endDate={endDate}
        event={event}
        tickWidthPixels={msPerPixel}
        id={id}
        dateRange={dateRange}
        updateEvent={updateEvent}
        ganttRef={ganttRef}
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
          tickWidthPixels={msPerPixel}
          selected={selected}
          schedulingThreeshold={schedulingThreeshold}
          {...eventProps}
        />
      </ResizeableEvent>
    </div>
  )
}

export default React.memo(GanttElementWrapper) as typeof GanttElementWrapper
