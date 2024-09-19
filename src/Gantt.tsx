import type { DragLocationHistory } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types'
import type { CSSProperties } from 'react'

import type { GanttEvent, GanttProps } from './types'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview'
import { monitorForExternal } from '@atlaskit/pragmatic-drag-and-drop/external/adapter'
import { preventUnhandled } from '@atlaskit/pragmatic-drag-and-drop/prevent-unhandled'
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'

import { autoScrollForExternal } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/external'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GanttElementWrapper from './Event'
import TimeRangeRow from './Timerange'
import { generateBackground, levelToDates } from './utils/background'
import { useMoveEventDnD } from './utils/moveDnD'

import { useResizeEventDnD } from './utils/resizeDnD'

import { syncScroll } from './utils/scrollSync'
import { useSelectionUtils } from './utils/selection'
import './gantt.css'

const widths = {
  start: 300,
  min: 100,
  max: 700,
}

function getProposedWidth({
  initialWidth,
  location,
}: {
  initialWidth: number
  location: DragLocationHistory
}): number {
  const diffX = location.current.input.clientX - location.initial.input.clientX
  const proposedWidth = initialWidth + diffX

  // ensure we don't go below the min or above the max allowed widths
  return Math.min(Math.max(widths.min, proposedWidth), widths.max)
}

/**
 * Data driven gantt chart
 */
export function Gantt<EventT, ResourceT>(props: GanttProps<EventT, ResourceT>) {
  const {
    msPerPixel = 30 * 1000,
    schedulingThreeshold = 30 * 60 * 1000,
    events,
    resources,
    dateRange,
    slots: { Placeholder, Resource, Event },
    slotsProps: { placeholderProps, resourceProps, eventProps } = {},
    dateViewLevels,
    updateEvent,
    handleEventDrop,
    gridLayout = true,
    dropResolutionMode = 'as-selected',
    getDragPreview,
  } = props

  const [startDate, endDate] = dateRange

  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [isResizing, setResizing] = useState(false)
  const [initialWidth, setInitialWidth] = useState(widths.start)
  const [isSelecting, setSelecting] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null!)
  const selectionRect = useRef<HTMLDivElement>(null)
  const ganttScrollContainer = useRef<HTMLDivElement>(null)
  const ganttHeaderScrollContainer = useRef<HTMLDivElement>(null)
  const resourceScrollContainer = useRef<HTMLDivElement>(null)
  const dividerRef = useRef<HTMLDivElement>(null!)
  const headerDividerRef = useRef<HTMLDivElement>(null!)
  const selectedEventsRef = useRef<Array<GanttEvent<EventT>>>([])
  const draggedElements = useRef<any[]>([])
  const pointerIdRef = useRef<number | null>(null)

  const updateEventSelection = useCallback(
    (selection: React.SetStateAction<string[]>) => {
      selectedEventsRef.current
        = typeof selection === 'function'
          ? selection(selectedEventsRef.current.map(el => el.id))
            .map(id => events.find(event => event.id === id) ?? [])
            .flat()
          : selection
            .map(id => events.find(event => event.id === id) ?? [])
            .flat()
      setSelectedEvents(selection)
    },
    [events],
  )

  const ganttWidth = (endDate - startDate) / msPerPixel
  const { selectionRectEnd, selectionRectStart } = useSelectionUtils({
    gantt: ganttScrollContainer,
    selectionRect,
    startDate,
    msPerPixel,
    selectedEvents,
    setSelectedEvents: updateEventSelection,
  })
  const {
    dragHandler: resizeDragHandler,
    dropHanlder: resizeDropHandler,
  } = useResizeEventDnD({
    updateEvent,
    threeshold: schedulingThreeshold,
    msPerPixel,
    dateRange,
  })
  const {
    dragHandler,
    dropHandler,
    placeholders,
  } = useMoveEventDnD({
    gridLayout,
    dateRange,
    handleEventDrop,
    threeshold: schedulingThreeshold,
    msPerPixel,
    resources,
    dropResolutionMode,
    selectedEventsRef,
  })

  const handleEventClick = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const id = e.currentTarget.getAttribute('data-event-id')
      if (!id)
        return
      if (e.shiftKey) {
        updateEventSelection(prev =>
          prev.includes(id)
            ? [...prev.splice(prev.indexOf(id), 1)]
            : [...prev, id],
        )
      }
      else {
        updateEventSelection([id])
      }
    },
    [updateEventSelection],
  )

  const dateViewLevelsRanges = useMemo(
    () =>
      dateViewLevels.map(level => levelToDates(level, [startDate, endDate])),
    [dateViewLevels, startDate, endDate],
  )
  const backgroundGrid = useMemo(
    () =>
      generateBackground(
        dateViewLevelsRanges,
        ganttWidth,
        msPerPixel,
        dateViewLevels,
      ),
    [dateViewLevels, dateViewLevelsRanges, ganttWidth, msPerPixel],
  )
  const resourceEventsMap = useMemo(() => {
    const out: Record<string, GanttEvent<EventT>[]> = {}

    for (const event of events) {
      if (placeholders.find(el => el.id === event.id))
        continue
      if (!out[event.resource]) {
        out[event.resource] = []
      }
      out[event.resource].push(event)
    }

    for (const placeholder of placeholders) {
      if (!out[placeholder.resource]) {
        out[placeholder.resource] = []
      }
      out[placeholder.resource].push(placeholder as any)
    }

    return out
  }, [events, placeholders])

  const resourceSelectionMap = useMemo(() => {
    const out: Record<string, GanttEvent<EventT>[]> = {}

    for (const event of events.filter(el => selectedEvents.includes(el.id))) {
      if (!out[event.resource]) {
        out[event.resource] = []
      }
      out[event.resource].push(event)
    }

    return out
  }, [events, selectedEvents])

  const resizeRow = useCallback((entry: ResizeObserverEntry) => {
    const resizedId = entry.target.getAttribute('data-timerange')
    const resourceContainer = resourceScrollContainer.current

    if (!resourceContainer)
      return

    const resourceRow = resourceContainer.querySelector(
      `[data-resource="${resizedId}"]`,
    )
    if (!resourceRow)
      return
    resourceRow.setAttribute('style', `height: ${entry.contentRect.height}px`)
  }, [])

  useEffect(() => {
    const element = ganttScrollContainer.current
    if (
      !element
      || !ganttHeaderScrollContainer.current
      || !resourceScrollContainer.current
    ) {
      return
    }

    const dateRangeCleanup = syncScroll(
      ganttScrollContainer.current,
      ganttHeaderScrollContainer.current,
      { horizontal: true, vertical: false },
    )
    const resourceCleanUp = syncScroll(
      ganttScrollContainer.current,
      resourceScrollContainer.current,
      { horizontal: false, vertical: true },
    )

    return () => {
      combine(
        autoScrollForExternal({
          element,
          getConfiguration: () => ({ maxScrollSpeed: 'fast' }),
        }),
        autoScrollForElements({
          element,
          getConfiguration: () => ({ maxScrollSpeed: 'fast' }),
        }),
        monitorForExternal({
          onDrop: () => {
            draggedElements.current = []
          },
        }),
        monitorForElements({
          onDrag: ({ source, location }) => {
            if (location.current.dropTargets.find(el => el.data.location === 'row')) {
              if (source.data.reason === 'resize-event') {
                resizeDragHandler({ location, ...source.data })
              }
              else if (source.data.reason === 'drag-event') {
                dragHandler({ source, location })
              }
            }
          },
          onDrop: ({ source, location }) => {
            draggedElements.current = []
            if (location.current.dropTargets.find(el => el.data.location === 'row')) {
              if (source.data.reason === 'resize-event') {
                resizeDropHandler({ location, ...source.data })
              }
              else if (source.data.reason === 'drag-event') {
                dropHandler({ source, location })
              }
            }
          },
        }),
      )
      resourceCleanUp()
      dateRangeCleanup()
    }
  }, [resizeDragHandler, resizeDropHandler, dragHandler, dropHandler])

  useEffect(() => {
    return combine(
      draggable({
        element: dividerRef.current,
        onGenerateDragPreview({ nativeSetDragImage }) {
          disableNativeDragPreview({ nativeSetDragImage })

          preventUnhandled.start()
        },
        onDragStart() {
          setResizing(true)
        },
        onDrag({ location }) {
          getProposedWidth({ initialWidth, location })

          wrapperRef.current.style.setProperty(
            '--local-resizing-width',
            `${getProposedWidth({ initialWidth, location })}px`,
          )
        },
        onDrop({ location }) {
          preventUnhandled.stop()
          setResizing(false)

          setInitialWidth(getProposedWidth({ initialWidth, location }))
          wrapperRef.current.style.removeProperty('--local-resizing-width')
        },
      }),
      draggable({
        element: headerDividerRef.current,
        onGenerateDragPreview({ nativeSetDragImage }) {
          disableNativeDragPreview({ nativeSetDragImage })

          preventUnhandled.start()
        },
        onDragStart() {
          setResizing(true)
        },
        onDrag({ location }) {
          getProposedWidth({ initialWidth, location })

          wrapperRef.current.style.setProperty(
            '--local-resizing-width',
            `${getProposedWidth({ initialWidth, location })}px`,
          )
        },
        onDrop({ location }) {
          preventUnhandled.stop()
          setResizing(false)

          setInitialWidth(getProposedWidth({ initialWidth, location }))
          wrapperRef.current.style.removeProperty('--local-resizing-width')
        },
      }),
    )
  }, [initialWidth])

  return (
    <div
      ref={wrapperRef}
      className="gantt-wrapper"
      style={
        {
          '--local-initial-width': `${initialWidth}px`,
        } as CSSProperties
      }
    >
      <div className="grid content-container">
        <div></div>
        <div
          ref={headerDividerRef}
          className={['splitter', isResizing ? 'disable-pointer' : []]
            .flat()
            .join(' ')}
        />
        <div className="gantt-header" ref={ganttHeaderScrollContainer}>
          <div
            className="date-area"
            style={{
              width: ganttWidth,
            }}
          >
            {dateViewLevelsRanges.map((level, i) => (
              <div
                key={i}
                className="grid h-full"
                style={{
                  gridTemplateColumns: `${level
                    .map(
                      ({ diff }) =>
                        `${Math.min(ganttWidth, diff / msPerPixel)}px`,
                    )
                    .join(' ')}`,
                }}
              >
                {level.map(({ date, getLabel }) => (
                  <div className="date-cell" key={date.toISOString()}>
                    {getLabel(date)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid overflow-auto content-container">
        <div className="resource-wrapper" ref={resourceScrollContainer}>
          {resources.map(data => (
            <Resource key={data.id} {...data} />
          ))}
        </div>
        <div
          ref={dividerRef}
          className={['splitter', isResizing ? 'disable-pointer' : []]
            .flat()
            .join(' ')}
        />
        <div
          ref={ganttScrollContainer}
          data-testid="gantt"
          data-role="gantt"
          className={['gantt', isResizing ? 'disable-pointer' : []]
            .flat()
            .join(' ')}
          onPointerDown={(e) => {
            pointerIdRef.current = e.pointerId
            setSelecting(true)
            selectionRectStart(e)
          }}
          onPointerUp={(e) => {
            pointerIdRef.current = null
            setSelecting(false)
            selectionRectEnd(e)
          }}
        >
          <div
            style={{
              width: ganttWidth,
              backgroundRepeat: 'no-repeat',
              backgroundImage: backgroundGrid,
            }}
          >
            {resources.map((resource) => {
              const selection = resourceSelectionMap[resource.id]
              const list
                = ({ eventsByLevel, recalcRow }) => {
                  return eventsByLevel.map((level, i) =>
                    level.map((event) => {
                      return (
                        <GanttElementWrapper
                          {...event}
                          placeholder={event.placeholder}
                          event={event}
                          recalcRow={recalcRow}
                          ganttRef={ganttScrollContainer}
                          onClick={handleEventClick}
                          EventSlot={event.placeholder ? Placeholder : Event}
                          selected={selection?.includes(
                            event,
                          )}
                          dateRange={dateRange}
                          level={i}
                          rowId={resource.id}
                          eventHeight={45}
                          tickWidthPixels={msPerPixel}
                          key={
                            event.placeholder
                              ? `${event.id}-placeholder`
                              : event.id
                          }
                          schedulingThreeshold={schedulingThreeshold}
                          updateEvent={updateEvent}
                          gridLayout={gridLayout}
                          selectedEventsRef={selectedEventsRef}
                          draggedElements={draggedElements}
                          getDragPreview={getDragPreview}
                        />
                      )
                    }),
                  )
                }

              return (
                <TimeRangeRow
                  Placeholder={Placeholder}
                  dateRange={dateRange}
                  resource={resource}
                  events={resourceEventsMap[resource.id]}
                  tickWidthPixels={msPerPixel}
                  width={ganttWidth}
                  key={resource.id}
                  resizeRow={resizeRow}
                  schedulingThreeshold={schedulingThreeshold}
                  gridLayout={gridLayout}
                >
                  {list}
                </TimeRangeRow>
              )
            })}
          </div>
          {
            isSelecting
            && <div className="select-rect" ref={selectionRect} />
          }
        </div>
      </div>
    </div>
  )
}
