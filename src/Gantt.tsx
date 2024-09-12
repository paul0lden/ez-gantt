import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import { autoScrollForExternal } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/external'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { monitorForExternal } from '@atlaskit/pragmatic-drag-and-drop/external/adapter'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'

import { generateBackground, levelToDates } from './utils/background'
import { useSelectionUtils } from './utils/selection'
import { syncScroll } from './utils/scrollSync'
import TimeRangeRow from './Timerange'
import GanttElementWrapper from './Event'

import type { GanttEvent, GanttProps } from './types'

import './gantt.css'

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
    resourceColumnDefaultWidth = 300,
    gridLayout = true,
    dropResolutionMode = 'as-selected',
  } = props

  const [startDate, endDate] = dateRange

  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [isDragging, setDragging] = useState(false)

  const selectionRect = useRef<HTMLDivElement>(null)
  const ganttScrollContainer = useRef<HTMLDivElement>(null)
  const ganttHeaderScrollContainer = useRef<HTMLDivElement>(null)
  const resourceScrollContainer = useRef<HTMLDivElement>(null)
  const selectedEventsRef = useRef<Array<GanttEvent<EventT>>>([])
  const draggedElements = useRef<any[]>([])

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

  const handleEventClick = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
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
          onDrop: () => {
            setDragging(false)
            draggedElements.current = []
          },
        }),
      )
      resourceCleanUp()
      dateRangeCleanup()
    }
  }, [])

  return (
    <div className="gantt-wrapper">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `${resourceColumnDefaultWidth}px 8px auto`,
        }}
      >
        <div></div>
        <div className="splitter" />
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
      <div
        className="grid overflow-auto"
        style={{
          gridTemplateColumns: `${resourceColumnDefaultWidth}px 8px auto`,
        }}
      >
        <div className="resource-wrapper" ref={resourceScrollContainer}>
          {resources.map(data => (
            <Resource key={data.id} {...data} />
          ))}
        </div>
        <div className="splitter" />
        <div
          ref={ganttScrollContainer}
          data-testid="gantt"
          data-role="gantt"
          className="gantt"
          onPointerDown={selectionRectStart}
          onPointerUp={selectionRectEnd}
        >
          <div
            style={{
              width: ganttWidth,
              backgroundRepeat: 'no-repeat',
              backgroundImage: backgroundGrid,
            }}
          >
            {resources.map((resource) => {
              const list = useCallback(
                (eventsByLevel) => {
                  return eventsByLevel.map((level, i) =>
                    level.map((event) => {
                      return event
                        ? (
                            <GanttElementWrapper
                              {...event}
                              event={event}
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
                              key={event.placeholder ? `${event.id}-placeholder` : event.id}
                              schedulingThreeshold={schedulingThreeshold}
                              updateEvent={updateEvent}
                              gridLayout={gridLayout}
                              selectedEventsRef={selectedEventsRef}
                              draggedElements={draggedElements}
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
