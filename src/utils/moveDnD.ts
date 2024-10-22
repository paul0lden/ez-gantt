import type { BaseEventPayload, ElementDragType } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types'
import type { MutableRefObject } from 'react'
import type { GanttEvent, GanttProps, GanttResource } from '../types'
import { useCallback, useState } from 'react'
import { isDragEventData, isDragTargetData } from './dragData'

interface MoveEventDnDProps {
  gridLayout: boolean
  threeshold: number
  msPerPixel: number
  dateRange: [number, number]
  handleEventDrop: (param: any[]) => void
  resources: Array<GanttResource<object>>
  dropResolutionMode: GanttProps<any, any>['dropResolutionMode']
  selectedEventsRef: MutableRefObject<Array<unknown>>
}

export function findDistance(
  resources: Array<GanttResource<object>>,
  initialResource: string,
  targetResource: string,
  currentResource: string,
): string {
  const initialResourceIdx = resources.findIndex(el => el.id === initialResource)
  const eventResourceIdx = resources.findIndex(el => el.id === targetResource)
  const idxDiff = -(initialResourceIdx - eventResourceIdx)
  const dragOverResourceIdx = resources.findIndex(el => el.id === currentResource)

  const newIdx = Math.min(Math.max(dragOverResourceIdx + idxDiff, 0), resources.length - 1)

  return resources[newIdx].id
}

type Placeholder = GanttEvent<{ placeholder: boolean }>

export function useMoveEventDnD({
  gridLayout,
  threeshold,
  msPerPixel,
  dateRange,
  handleEventDrop,
  resources,
  dropResolutionMode,
  selectedEventsRef,
}: MoveEventDnDProps): {
    dragHandler: (context: BaseEventPayload<ElementDragType>) => void
    dropHandler: (context: BaseEventPayload<ElementDragType>) => void
    placeholders: Placeholder[]
  } {
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([])
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

  const dragHandler = useCallback(({ source, location }: BaseEventPayload<ElementDragType>) => {
    const data = source.data

    if (!isDragEventData(data))
      return

    const {
      current: { input, dropTargets },
    } = location

    const {
      events,
      initialResource,
    } = data

    if (!events)
      return

    const drawData = []
    for (const event of events) {
      const {
        dragDiffX,
        width,
        id,
        height,
      } = event
      const target = dropTargets.find(el => el.data.location === 'row')

      if (!target)
        return
      const targetData = target.data

      if (!isDragTargetData(targetData))
        return

      const currentResource = targetData.id

      const resource = dropResolutionMode === 'single-resource'
        ? currentResource as string
        : findDistance(
          resources,
          initialResource,
          event.resource,
          currentResource as string,
        )

      if (!dragDiffX || !width || !target)
        return

      drawData.push({
        rowRelativeX: input.clientX - targetData.x - dragDiffX,
        width,
        id,
        height,
        resource,
      })
    }

    drawPlaceholder(drawData)
  }, [drawPlaceholder, dropResolutionMode, resources])

  const dropHandler = useCallback(({ source, location }: BaseEventPayload<ElementDragType>) => {
    const {
      current: { dropTargets, input },
    } = location
    const data = source.data

    if (!isDragEventData(data)) {
      return
    }

    const {
      events,
      initialResource,
    } = data
    if (!events)
      return

    const updatedEvents = []
    for (const { dragDiffX, width, ...event } of events) {
      const target = dropTargets.find(el => el.data.location === 'row')

      if (!dragDiffX || !width || !target)
        return
      if (!target)
        return
      const targetData = target.data

      if (!isDragTargetData(targetData))
        return

      const currentResource = target.data.id
      const resource = dropResolutionMode === 'single-resource'
        ? currentResource as string
        : findDistance(
          resources,
          initialResource,
          event.resource,
          currentResource as string,
        )

      const roundValue
        = Math.round(
          (input.clientX - targetData.x - dragDiffX)
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
        resource,
      })
    }

    selectedEventsRef.current = updatedEvents
    setPlaceholders([])
    handleEventDrop(updatedEvents)
  }, [
    dateRange,
    gridLayout,
    threeshold,
    msPerPixel,
    handleEventDrop,
    resources,
    dropResolutionMode,
    selectedEventsRef,
  ])

  return {
    dragHandler,
    dropHandler,
    placeholders,
  }
}
