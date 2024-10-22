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

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import GanttElementWrapper from './Event'
import TimeRangeRow from './Timerange'
import { generateBackground, levelToDates } from './utils/background'

import { useMoveEventDnD } from './utils/moveDnD'

import { useResizeEventDnD } from './utils/resizeDnD'
import { syncScroll } from './utils/scrollSync'
import { useSelectionUtils } from './utils/selection'

/**
 * Data driven gantt chart
 */
function Gantt<EventT, ResourceT>(
  props: GanttProps<EventT, ResourceT>,
): React.ReactNode {
  const {
    msPerPixel = 30 * 1000,
    schedulingThreeshold = 30 * 60 * 1000,
    events,
    resources,
    dateRange,
    slots,
    slotsProps,
    dateViewLevels,
    updateEvent,
    handleEventDrop,
    gridLayout = true,
    dropResolutionMode = 'as-selected',
    getDragPreview,
    resourceWidth,
  } = props
  const { Placeholder, Resource, ResourceHeader, Event } = slots ?? {}
  const {
    placeholderProps,
    resourceProps,
    resourceHeaderProps,
    eventProps,
    headerProps,
    eventHeaderProps,
    splitterProps,
    timerangeProps,
  } = slotsProps ?? {}

  if (!Resource || !Event) {
    throw new Error('Requires Resource and Event slots!')
  }

  const [startDate, endDate] = dateRange

  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [isResizing, setResizing] = useState(false)
  const [initialWidth, setInitialWidth] = useState(resourceWidth?.start ?? 300)
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
  const ganttWidth = (endDate - startDate) / msPerPixel

  const getProposedWidth = useCallback(({
    initialWidth,
    location,
  }: {
    initialWidth: number
    location: DragLocationHistory
  }): number => {
    const diffX = location.current.input.clientX - location.initial.input.clientX
    const proposedWidth = initialWidth + diffX

    // ensure we don't go below the min or above the max allowed widths
    return Math.min(
      Math.max(resourceWidth?.min ?? 100, proposedWidth),
      resourceWidth?.max ?? 700,
    )
  }, [resourceWidth])
  const updateEventSelection = useCallback(
    (selection: React.SetStateAction<string[]>) => {
      selectedEventsRef.current
        = typeof selection === 'function'
          ? (selection(selectedEventsRef.current.map(el => el.id))
              .map(id => events.find(event => event.id === id) ?? [])
              .flat() as Array<GanttEvent<EventT>>)
          : (selection
              .map(id => events.find(event => event.id === id) ?? [])
              .flat() as Array<GanttEvent<EventT>>)
      setSelectedEvents(selection)
    },
    [events],
  )

  const { selectionRectEnd, selectionRectStart } = useSelectionUtils({
    gantt: ganttScrollContainer,
    selectionRect,
    startDate,
    msPerPixel,
    selectedEvents,
    setSelectedEvents: updateEventSelection,
  })
  const { dragHandler: resizeDragHandler, dropHanlder: resizeDropHandler }
    = useResizeEventDnD({
      updateEvent,
      threeshold: schedulingThreeshold,
      msPerPixel,
      dateRange,
    })
  const { dragHandler, dropHandler, placeholders } = useMoveEventDnD({
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
      e.preventDefault()
      e.stopPropagation()
      const id = e.currentTarget.getAttribute('data-event-id')
      if (!id)
        return
      if (e.shiftKey) {
        updateEventSelection(prev =>
          prev.includes(id)
            ? [...prev.filter(el => el !== id)]
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
    resourceRow.setAttribute('style', `height: ${entry.borderBoxSize[0].blockSize}px`)
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
            if (
              location.current.dropTargets.find(
                el => el.data.location === 'row',
              )
            ) {
              if (source.data.reason === 'resize-event') {
                resizeDragHandler({ location, source })
              }
              else if (source.data.reason === 'drag-event') {
                dragHandler({ source, location })
              }
            }
          },
          onDrop: ({ source, location }) => {
            draggedElements.current = []
            if (
              location.current.dropTargets.find(
                el => el.data.location === 'row',
              )
            ) {
              if (source.data.reason === 'resize-event') {
                resizeDropHandler({ location, source })
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
  }, [initialWidth, getProposedWidth])

  return (
    <div
      ref={wrapperRef}
      style={
        {
          'height': '100%',
          'display': 'flex',
          'flexFlow': 'column',
          'gridTemplateRows': 'auto 1fr',
          '--local-initial-width': `${initialWidth}px`,
        } as CSSProperties
      }
    >
      <div
        {...(headerProps ?? {})}
        style={{
          ...(headerProps?.style ?? {}),
          display: 'grid',
          gridTemplateColumns:
            'var(--local-resizing-width, var(--local-initial-width)) 8px auto',
        }}
      >
        {ResourceHeader ? <ResourceHeader /> : <div />}
        <div
          {...(splitterProps ?? {})}
          ref={headerDividerRef}
          style={{
            cursor: 'ew-resize',
            ...(splitterProps?.style ?? {}),
            pointerEvents: isResizing ? 'none' : 'unset',
          }}
        />
        <div
          {...(eventHeaderProps ?? {})}
          style={{
            ...(eventHeaderProps?.style ?? {}),
            width: '100%',
            transform: 'translate3d(0, 0, 0)',
            overflowX: 'scroll',
            overflowY: 'scroll',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          ref={ganttHeaderScrollContainer}
        >
          <div
            style={{

              height: '100%',
              display: 'flex',
              flexFlow: 'column',
              width: ganttWidth,
            }}
          >
            {dateViewLevelsRanges.map((level, i) => (
              <div
                key={`${i} - ${level.length}`}
                style={{
                  display: 'grid',
                  height: '100%',
                  gridTemplateColumns: `repeat(${level.length}, ${Math.min(ganttWidth, level[0].diff / msPerPixel)}px)`,
                }}
              >
                {level.map(({ date, renderCell }) => (
                  renderCell ? renderCell(date) : null
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          overflow: 'auto',
          gridTemplateColumns:
            'var(--local-resizing-width, var(--local-initial-width)) 8px auto',
        }}
      >
        <div
          style={{
            transform: 'translate3d(0, 0, 0)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            scrollbarGutter: 'stable',
          }}
          ref={resourceScrollContainer}
        >
          {resources.map(data => (
            <div {...resourceProps} data-resource={data.id} key={data.id}>
              <Resource {...data} />
            </div>
          ))}
        </div>
        <div
          {...splitterProps ?? {}}
          ref={dividerRef}
          style={{
            cursor: 'ew-resize',
            ...(splitterProps?.style ?? {}),
            pointerEvents: isResizing ? 'none' : 'unset',
          }}
        />
        <div
          ref={ganttScrollContainer}
          data-testid="gantt"
          data-role="gantt"
          style={{
            width: '100%',
            height: '100%',
            overflowX: 'scroll',
            position: 'relative',
            userSelect: 'none',
            pointerEvents: isResizing ? 'none' : 'unset',
          }}
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

              return (
                <TimeRangeRow<EventT, ResourceT>
                  dateRange={dateRange}
                  resource={resource}
                  events={resourceEventsMap[resource.id]}
                  msPerPixel={msPerPixel}
                  width={ganttWidth}
                  key={resource.id}
                  resizeRow={resizeRow}
                  schedulingThreeshold={schedulingThreeshold}
                  gridLayout={gridLayout}
                  timerangeProps={timerangeProps}
                >
                  {({ eventsByLevel }) => {
                    return eventsByLevel.map((level, i) =>
                      level.map((event) => {
                        return (
                          <GanttElementWrapper<EventT>
                            {...event}
                            placeholder={!!event.placeholder}
                            event={event}
                            ganttRef={ganttScrollContainer}
                            onClick={handleEventClick}
                            EventSlot={event.placeholder ? Placeholder : Event}
                            selected={selection?.includes(event)}
                            dateRange={dateRange}
                            level={i}
                            rowId={resource.id}
                            eventHeight={45}
                            msPerPixel={msPerPixel}
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
                  }}
                </TimeRangeRow>
              )
            })}
          </div>
          {isSelecting && (
            <div
              style={{
                pointerEvents: 'none',
                opacity: 0,
                background: 'rgba(125,125,125,0.2)',
                boxSizing: 'content-box',
                border: '2px solid aqua',
                position: 'absolute',
              }}
              ref={selectionRect}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default React.memo(Gantt) as typeof Gantt
