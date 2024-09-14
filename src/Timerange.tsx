import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { dropTargetForExternal } from '@atlaskit/pragmatic-drag-and-drop/external/adapter'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'

import { getEventType } from './defaults'
import { getEventsByLevel } from './utils/levels'

import type { TimeRangeProps } from './types'
import { debounce, debounceRAF } from './utils/debounce'

function TimeRangeRow<EventT, ResourceT>(
  props: TimeRangeProps<EventT, ResourceT>,
) {
  const {
    resource,
    dateRange: [startDate],
    tickWidthPixels,
    resizeRow,
    width,
    schedulingThreeshold,
    children,
    gridLayout,
    events,
    handleEventDrop,
    draggedElements,
  } = props

  // store temporary resize event to display the preview
  // before submiting final ressult to the client
  const [placeholderPos, setPlaceholderPos] = useState<
    Array<{
      id: string
      startDate: number
      endDate: number
      height: number
      placeholder: boolean
    }>
  >([])
  const [resizeEvent, setResizeEvent] = useState([])
  const eventsByLevel = useMemo(
    () =>
      getEventsByLevel([
        ...(events ?? []).filter(
          el => !draggedElements.current.includes(el.id) && resizeEvent?.[0]?.id !== el.id,
        ),
        ...placeholderPos,
        // ...resizeEvent,
      ]),
    [events, placeholderPos, resizeEvent],
  )

  const rowRef = useRef<HTMLDivElement>(null)

  const eventHeight = 45
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      resizeRow(entry)
    }
  })

  const drawPlaceholder = (
    events: {
      rowRelativeX: number
      width: number
      id: string
      height: number
    }[],
  ) => {
    const out = []

    for (const { rowRelativeX, width, id, height } of events) {
      const roundValue
        = Math.round(rowRelativeX / (schedulingThreeshold / tickWidthPixels))
        * (gridLayout ? 1 : schedulingThreeshold / tickWidthPixels)

      out.push({
        id,
        startDate:
          startDate
          + roundValue * (gridLayout ? schedulingThreeshold : tickWidthPixels),
        endDate:
          startDate
          + roundValue * (gridLayout ? schedulingThreeshold : tickWidthPixels)
          + width * tickWidthPixels,
        height,
        placeholder: true,
      })
    }

    setPlaceholderPos(out)
  }

  useEffect(() => {
    if (rowRef.current) {
      resizeObserver.observe(rowRef.current)
    }

    return () => {
      if (rowRef.current) {
        resizeObserver.unobserve(rowRef.current)
      }
    }
  }, [])
  useEffect(() => {
    const element = rowRef.current

    if (!element)
      return

    return combine(
      dropTargetForExternal({
        element,
        getData({ element }) {
          return {
            x: element.getBoundingClientRect().x,
            location: 'row',
          }
        },
        canDrop: ({ source }) =>
          !!source.types.find(el => el.includes(getEventType())),
        onDragLeave: debounceRAF(() => {
          setPlaceholderPos([])
        }),
        onDrag: debounce(({ location, source }) => {
          const {
            current: { input, dropTargets },
          } = location
          const type = source.types.find(el => el.includes(getEventType()))
          const target = dropTargets.find(el => el.data.location === 'row')

          if (type && target) {
            const diffX = Number(type.split('+')?.[2])
            if (!diffX || Number.isNaN(diffX))
              return

            const width = Number(type.split('+')?.[3])
            if (!width || Number.isNaN(width))
              return
            const height = Number(type.split('+')?.[4])
            if (!height || Number.isNaN(height))
              return

            const data: { x?: number } = target.data
            if (!data.x)
              return

            drawPlaceholder({
              rowRelativeX: input.clientX - diffX - data.x,
              width,
              height,
            })
          }
        }, 100),
        onDrop: debounceRAF(() => {
          setPlaceholderPos([])
        }),
      }),
      dropTargetForElements({
        element,
        getData({ element }) {
          return {
            x: element.getBoundingClientRect().x,
            location: 'row',
            ...resource,
          }
        },
        onDragLeave: debounce(() => {
          setPlaceholderPos([])
        }, 50),
        onDrop: debounce(({ source, location }) => {
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
                / (schedulingThreeshold / tickWidthPixels),
              ) * (gridLayout ? 1 : schedulingThreeshold / tickWidthPixels)

            updatedEvents.push({
              ...event,
              startDate:
                startDate
                + roundValue
                * (gridLayout ? schedulingThreeshold : tickWidthPixels),
              endDate:
                startDate
                + roundValue
                * (gridLayout ? schedulingThreeshold : tickWidthPixels)
                + width * tickWidthPixels,
              resource: target.data.id,
            })
          }

          handleEventDrop(updatedEvents)
          setPlaceholderPos([])
        }, 50),
        onDrag: debounce(({ location, source }) => {
          const {
            current: { input, dropTargets },
          } = location

          if (!source.data.events)
            return

          const drawData = []
          for (const { dragDiffX, width, id, height } of source.data.events) {
            const target = dropTargets.find(el => el.data.location === 'row')

            if (!dragDiffX || !width || !target)
              return

            drawData.push({
              rowRelativeX: input.clientX - target.data.x - dragDiffX,
              width,
              id,
              height,
            })
          }

          drawPlaceholder(drawData)
        }, 50),
      }),
    )
  }, [placeholderPos, tickWidthPixels, startDate])

  const recalcRow = useCallback(
    (events) => {
      // console.log(new Date(events?.[0]?.startDate))
      setResizeEvent(events)
    },
    [],
  )

  return (
    <div
      className="timerange-row"
      style={{
        minHeight: `${eventHeight}px`,
        display: gridLayout ? 'grid' : 'flex',
        ...(gridLayout
          ? {
              gridTemplateColumns: `repeat(${
                width / (schedulingThreeshold / tickWidthPixels)
              }, ${schedulingThreeshold / tickWidthPixels}px)`,
            }
          : {
              height: `${
                Math.max(
                  placeholderPos?.level ? placeholderPos.level + 1 : 0,
                  eventsByLevel.length,
                )
                * eventHeight
                + Math.max(
                  placeholderPos?.level ? placeholderPos.level : 0,
                  eventsByLevel.length - 1,
                )
                * 8
              }px`,
            }),
      }}
      ref={rowRef}
      data-timerange={resource.id}
    >
      {children({ eventsByLevel, recalcRow })}
    </div>
  )
}

export default React.memo(TimeRangeRow)
