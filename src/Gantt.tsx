import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import { autoScrollForExternal } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/external'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { monitorForExternal } from '@atlaskit/pragmatic-drag-and-drop/external/adapter'
import {
  draggable,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview'
import { preventUnhandled } from '@atlaskit/pragmatic-drag-and-drop/prevent-unhandled'

import type { DragLocationHistory } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types'

import { generateBackground, levelToDates } from './utils/background'
import { useSelectionUtils } from './utils/selection'
import { syncScroll } from './utils/scrollSync'
import TimeRangeRow from './Timerange'
import GanttElementWrapper from './Event'

import type { GanttEvent, GanttProps } from './types'

import './gantt.css'
import { useResizeEventDnD } from './utils/resizeDnD'

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

// new event data model:
// - user can provide the date-range type and data based on that type
// - that allows to render multiple event on different level
// - user will still have the possiblity to controll the

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
  const [isDragging, setDragging] = useState(false)
  const [isResizing, setResizing] = useState(false)
  const [initialWidth, setInitialWidth] = useState(widths.start)

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
    [],
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
  const { dragHandler, dropHanlder } = useResizeEventDnD({
    updateEvent,
    threeshold: schedulingThreeshold,
    msPerPixel,
    dateRange,
  })

  const handleEventClick = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // e.stopPropagation()
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
    [],
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
    [dateViewLevels, startDate, endDate],
  )
  const resourceEventsMap = useMemo(() => {
    const out: Record<string, GanttEvent<EventT>[]> = {}

    for (const event of events) {
      if (!out[event.resource]) {
        out[event.resource] = []
      }
      out[event.resource].push(event)
    }

    return out
  }, [events])

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
            setDragging(false)
            draggedElements.current = []
          },
        }),
        monitorForElements({
          onDragStart: ({ source }) => {
            if (source.data.reason === 'resize-event') {
              console.log(pointerIdRef.current)
              ganttScrollContainer.current?.setPointerCapture(
                pointerIdRef.current,
              )
            }
          },
          onDrag: ({ source, location }) => {
            if (source.data.reason === 'resize-event') {
              console.log(
                ganttScrollContainer.current?.hasPointerCapture(
                  pointerIdRef.current,
                ),
              )
              dragHandler({ location, ...source.data })
            }
          },
          onDrop: ({ source, location }) => {
            setDragging(false)
            draggedElements.current = []
            if (source.data.reason === 'resize-event') {
              dropHanlder({ location, ...source.data })
              ganttScrollContainer.current?.releasePointerCapture(
                pointerIdRef.current,
              )
            }
          },
        }),
      )
      resourceCleanUp()
      dateRangeCleanup()
    }
  }, [])

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
            selectionRectStart(e)
          }}
          onPointerUp={(e) => {
            pointerIdRef.current = null
            selectionRectEnd(e)
          }}
        >
          <div
            style={{
              width: ganttWidth,
              backgroundRepeat: 'no-repeat',
              // backgroundImage: backgroundGrid,
            }}
          >
            {resources.map((resource) => {
              const list = useCallback(
                ({ eventsByLevel, recalcRow }) => {
                  return eventsByLevel.map((level, i) =>
                    level.map((event) => {
                      return event
                        ? (
                            <GanttElementWrapper
                              {...event}
                              event={event}
                              recalcRow={recalcRow}
                              ganttRef={ganttScrollContainer}
                              onClick={handleEventClick}
                              EventSlot={event.placeholder ? Placeholder : Event}
                              selected={resourceSelectionMap[resource.id]?.includes(
                                event,
                              )}
                              setDragging={setDragging}
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
                        : null
                    }),
                  )
                },
                [resourceSelectionMap[resource.id], isDragging],
              )

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
                  handleEventDrop={handleEventDrop}
                  gridLayout={gridLayout}
                  draggedElements={draggedElements}
                >
                  {list}
                </TimeRangeRow>
              )
            })}
          </div>
          <div className="select-rect" ref={selectionRect} />
        </div>
      </div>
    </div>
  )
}
