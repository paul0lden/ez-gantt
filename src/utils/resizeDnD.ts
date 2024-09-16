import type { DragLocationHistory } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types'

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
}: ProposedWidthProps) {
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

export function useResizeEventDnD({
  dateRange,
  msPerPixel,
  threeshold,
  updateEvent,
}) {
  const dragHandler = ({ location, direction, event }) => {
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
  }
  const dropHanlder = ({ location, direction, event }) => {
    const { startDate, endDate } = getProposedWidth({
      location,
      direction,
      event,
      dateRange,
      msPerPixel,
      threeshold,
    })
    updateEvent({ ...event, startDate, endDate })
  }

  return { dropHanlder, dragHandler }
}
