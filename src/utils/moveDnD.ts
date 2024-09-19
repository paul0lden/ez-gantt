import type { GanttEvent } from '../types'
import { useCallback, useState } from 'react'

interface MoveEventDnDProps {
  gridLayout: boolean
  threeshold: number
  msPerPixel: number
  dateRange: [number, number]
  handleEventDrop: (param: any[]) => void
}

export function useMoveEventDnD({
  gridLayout,
  threeshold,
  msPerPixel,
  dateRange,
  handleEventDrop,
}: MoveEventDnDProps) {
  const [placeholders, setPlaceholders] = useState<GanttEvent<{ placeholder: boolean }>[]>([])
  const drawPlaceholder = useCallback((
    events: {
      rowRelativeX: number
      width: number
      id: string
      height: number
      resource: string
    }[],
  ) => {
    const out = []

    for (const { rowRelativeX, width, id, height, resource } of events) {
      const roundValue
        = Math.round(rowRelativeX / (threeshold / msPerPixel))
        * (gridLayout ? 1 : threeshold / msPerPixel)

      out.push({
        id,
        startDate:
          dateRange[0]
          + roundValue * (gridLayout ? threeshold : msPerPixel),
        endDate:
          dateRange[0]
          + roundValue * (gridLayout ? threeshold : msPerPixel)
          + width * msPerPixel,
        placeholder: true,
        height,
        resource,
      })
    }

    setPlaceholders(out)
  }, [msPerPixel, dateRange, threeshold, gridLayout, setPlaceholders])

  const dragHandler = useCallback(({ source, location }) => {
    const {
      current: { input, dropTargets },
    } = location

    if (!source.data.events)
      return

    const drawData = []
    for (const {
      dragDiffX,
      width,
      id,
      height,
      resource,
    } of source.data.events) {
      const target = dropTargets.find(el => el.data.location === 'row')

      if (!dragDiffX || !width || !target)
        return

      drawData.push({
        rowRelativeX: input.clientX - target.data.x - dragDiffX,
        width,
        id,
        height,
        resource: target.data.id,
      })
    }

    drawPlaceholder(drawData)
  }, [drawPlaceholder])

  const dropHandler = useCallback(({ source, location }) => {
    const {
      current: { dropTargets, input },
    } = location
    const events = source.data.events
    if (!events)
      return

    const updatedEvents = []
    for (const { dragDiffX, width, ...event } of events) {
      const target = dropTargets.find(el => el.data.location === 'row')

      if (!dragDiffX || !width || !target)
        return

      const roundValue
        = Math.round(
          (input.clientX - target.data.x - dragDiffX)
          / (threeshold / msPerPixel),
        ) * (gridLayout ? 1 : threeshold / msPerPixel)

      updatedEvents.push({
        ...event,
        startDate:
          dateRange[0]
          + roundValue
          * (gridLayout ? threeshold : msPerPixel),
        endDate:
          dateRange[0]
          + roundValue
          * (gridLayout ? threeshold : msPerPixel)
          + width * msPerPixel,
        resource: target.data.id,
      })
    }

    setPlaceholders([])
    handleEventDrop(updatedEvents)
  }, [dateRange, gridLayout, threeshold, msPerPixel, handleEventDrop])

  return {
    dragHandler,
    dropHandler,
    placeholders,
  }
}
