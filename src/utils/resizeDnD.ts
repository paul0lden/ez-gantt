import type { BaseEventPayload, DragLocationHistory, ElementDragType } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types'
import type { DateRangeValue, GanttEvent } from '../types'
import { useCallback } from 'react'
import { isResizeEventData } from './resizeDdata'

interface ProposedWidthProps {
  location: DragLocationHistory
  direction: 'left' | 'right'
  msPerPixel: number
  threeshold: number
  dateRange: [number, number]
  event: any
}

function getProposedWidth({
  location,
  direction,
  dateRange,
  threeshold,
  msPerPixel,
  event,
}: ProposedWidthProps): DateRangeValue {
  const timeRange = document.querySelector(
    `[data-timerange="${event.resource}"]`,
  )

  if (!timeRange)
    return { startDate: event.startDate, endDate: event.endDate }

  if (direction === 'left') {
    const date1
      = dateRange[0]
      + Math.round(
        (location.current.input.clientX
          - timeRange.getBoundingClientRect().x)
          / (threeshold / msPerPixel),
      )
      * threeshold
    const date2 = event.endDate

    const newStartDate = Math.min(date1, date2)
    const newEndDate = Math.max(date1, date2)
    return { startDate: newStartDate, endDate: newEndDate }
  }
  else {
    const date1
      = dateRange[0]
      + Math.round(
        (location.current.input.clientX
          - timeRange.getBoundingClientRect().x)
          / (threeshold / msPerPixel),
      )
      * threeshold
    const date2 = event.startDate

    const newStartDate = Math.min(date1, date2)
    const newEndDate = Math.max(date1, date2)
    return { startDate: newStartDate, endDate: newEndDate }
  }
}

interface ResizeEventDnDProps {
  dateRange: [number, number]
  msPerPixel: number
  threeshold: number
  updateEvent: (event: GanttEvent<object>) => void
}

export function useResizeEventDnD({
  dateRange,
  msPerPixel,
  threeshold,
  updateEvent,
}: ResizeEventDnDProps): {
    dropHanlder: (context: BaseEventPayload<ElementDragType>) => void
    dragHandler: (context: BaseEventPayload<ElementDragType>) => void
  } {
  const dragHandler = useCallback(({ location, source }: BaseEventPayload<ElementDragType>) => {
    const data = source.data

    if (!isResizeEventData(data))
      return

    const { direction, event } = data

    const { startDate, endDate } = getProposedWidth({
      location,
      direction,
      event,
      dateRange,
      msPerPixel,
      threeshold,
    })

    if (!location.current.dropTargets[0])
      return

    updateEvent({
      ...event,
      startDate,
      endDate,
    })
  }, [dateRange, msPerPixel, threeshold, updateEvent])
  const dropHanlder = useCallback(({ location, source }: BaseEventPayload<ElementDragType>) => {
    const data = source.data

    if (!isResizeEventData(data))
      return

    const { direction, event } = data
    const { startDate, endDate } = getProposedWidth({
      location,
      direction,
      event,
      dateRange,
      msPerPixel,
      threeshold,
    })
    updateEvent({ ...event, startDate, endDate })
  }, [dateRange, msPerPixel, threeshold, updateEvent])

  return { dropHanlder, dragHandler }
}
