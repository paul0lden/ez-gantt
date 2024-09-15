import React, { useEffect, useRef } from 'react'

import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'

import './resizeable.css'
import type { DragLocationHistory } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types'

export function ResizeableEvent(props) {
  const {
    startDate,
    endDate,
    dateRange,
    tickWidthPixels,
    schedulingThreeshold,
    recalcRow,
    updateEvent,
    id,
    event,
    minWidth = 30,
    children,
  } = props

  const startWidth = (endDate - startDate) / tickWidthPixels
  const startX = Math.abs(dateRange[0] - startDate) / tickWidthPixels
  const element = useRef<HTMLElement>(null!)
  const gridLayout = useRef(false)
  const leftRef = useRef<HTMLDivElement>(null!)
  const rightRef = useRef<HTMLDivElement>(null!)

  const getProposedWidth = ({
    location,
    direction,
  }: {
    location: DragLocationHistory
    direction: 'left' | 'right'
  }) => {
    if (direction === 'left') {
      const date1
        = dateRange[0]
        + (Math.round((location.current.input.clientX
        - location.current.dropTargets[0].data.x) / (schedulingThreeshold / tickWidthPixels))
        * schedulingThreeshold)
      const date2 = endDate

      const newStartDate = Math.min(date1, date2)
      const newEndDate = Math.max(date1, date2)
      return { startDate: newStartDate, endDate: newEndDate }
    }
    else {
      const diffX
        = location.current.input.clientX
        - location.current.dropTargets[0].data.x
        + startWidth

      const newStartX = Math.min(startX, startX + startWidth + diffX)
      const newWidth = Math.max(startWidth + diffX, -diffX - startWidth)

      return { startDate: newStartX, endDate: newWidth }
    }
  }
  useEffect(() => {
    gridLayout.current
      = (
        document.querySelector(
          `[data-timerange="${event.resource}"]`,
        ) as HTMLElement
      )?.style?.getPropertyValue('display') === 'grid'
  }, [])

  useEffect(() => {
    return combine(
      draggable({
        element: leftRef.current,
        getInitialData: () => ({
          reason: 'resize-event',
        }),
        onDragStart: () => {
          element.current = document.querySelector(`[data-event-id="${id}"]`)!
        },
        onGenerateDragPreview({ nativeSetDragImage }) {
          disableNativeDragPreview({ nativeSetDragImage })
        },
        onDrag({ location }) {
          const { startDate, endDate } = getProposedWidth({
            location,
            direction: 'left',
          })

          if (!location.current.dropTargets[0])
            return

          updateEvent(
            {
              ...event,
              startDate,
              endDate,
            },
          )
        },
        onDrop: ({ location }) => {
          const { startDate, endDate } = getProposedWidth({
            location,
            direction: 'left',
          })
          recalcRow([])
          updateEvent({ ...event, startDate, endDate })
        },
      }),
      draggable({
        element: rightRef.current,
        onDragStart: () => {
          element.current = document.querySelector(`[data-event-id="${id}"]`)!
        },
        onGenerateDragPreview({ nativeSetDragImage }) {
          disableNativeDragPreview({ nativeSetDragImage })
        },
        onDrag({ location }) {
          const { startDate, endDate } = getProposedWidth({
            location,
            direction: 'right',
          })

          if (!location.current.dropTargets[0])
            return

          recalcRow([
            {
              ...event,
              startDate,
              endDate,
            },
          ])
        },
        onDrop: ({ location }) => {
          const { startDate, endDate } = getProposedWidth({
            location,
            direction: 'right',
          })
          recalcRow([])
          updateEvent({ ...event, startDate, endDate })
        },
      }),
    )
  }, [])

  return (
    <>
      <div
        ref={leftRef}
        data-role="resize-left"
        className="resizeable-resize"
        style={{ left: 0 }}
      />
      {children}
      <div
        ref={rightRef}
        className="resizeable-resize"
        data-role="resize-right"
        style={{ right: 0 }}
      />
    </>
  )
}

export default React.memo(ResizeableEvent)
