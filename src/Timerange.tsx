import React, { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import { dropTargetForExternal } from '@atlaskit/pragmatic-drag-and-drop/external/adapter'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import GanttElementWrapper from './Event'
import type { TimeRangeProps } from './types'
import { getEventType } from './defaults'
import { checkLevel } from './utils/levels'

function TimeRangeRow<EventT, ResourceT>(
  props: TimeRangeProps<EventT, ResourceT>,
) {
  const {
    Placeholder,
    placeholderProps = {},
    resource,
    dateRange: [startDate],
    tickWidthPixels,
    handleEventDrop,
    resizeRow,
    width,
    schedulingThreeshold,
    eventsByLevel,
    children,
    gridLayout,
  } = props

  // store temporary resize event to display the preview
  // before submiting final ressult to the client
  const [placeholderPos, setPlaceholderPos] = useState<{
    width: number
    x: number
    height: number
    level: number
  } | null>(null)

  const rowRef = useRef<HTMLDivElement>(null)

  const eventHeight = 45
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      resizeRow(entry)
    }
  })

  const drawPlaceholder = ({
    rowRelativeX,
    width,
    id,
    height,
  }: {
    rowRelativeX: number
    width: number
    id: string
    height: number
  }) => {
    const roundValue
      = Math.round(rowRelativeX / (schedulingThreeshold / tickWidthPixels))
      * (gridLayout ? 1 : schedulingThreeshold / tickWidthPixels)

    const level = checkLevel(
      {
        startDate:
          startDate
          + roundValue * (gridLayout ? schedulingThreeshold : tickWidthPixels),
        endDate:
          startDate
          + roundValue * (gridLayout ? schedulingThreeshold : tickWidthPixels)
          + width * tickWidthPixels,
      },
      eventsByLevel.map(subArray =>
        subArray.reduce(
          (acc, el) => [...acc, el.id === id ? [] : el].flat(),
          [],
        ),
      ),
      tickWidthPixels,
    )

    if (placeholderPos?.x !== roundValue || placeholderPos?.level !== level) {
      setPlaceholderPos({
        width:
          width / (gridLayout ? schedulingThreeshold / tickWidthPixels : 1),
        x: roundValue,
        height,
        level,
      })
    }
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
        onDragLeave() {
          setPlaceholderPos(null)
        },
        onDrag({ location, source }) {
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
        },
        onDrop({ source, location }) {
          setPlaceholderPos(null)
        },
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
        onDragLeave() {
          setPlaceholderPos(null)
        },
        onDrop({ source, location }) {
          const {
            current: { input, dropTargets },
          } = location
          const { dragDiffX, width, id } = source.data
          const target = dropTargets.find(el => el.data.location === 'row')

          if (!dragDiffX || !width || !target)
            return

          const roundValue
            = Math.round(
              (input.clientX - target.data.x - dragDiffX)
              / (schedulingThreeshold / tickWidthPixels),
            )
            * (schedulingThreeshold / tickWidthPixels)

          const start = startDate + roundValue * tickWidthPixels
          const end = start + width * tickWidthPixels

          handleEventDrop(source.data, location.current.dropTargets[0].data, {
            startDate: start,
            endDate: end,
          })
          setPlaceholderPos(null)
        },
        onDrag({ location, source }) {
          const {
            current: { input, dropTargets },
          } = location
          const { dragDiffX, width, id, height } = source.data

          const target = dropTargets.find(el => el.data.location === 'row')

          if (!dragDiffX || !width || !target)
            return

          drawPlaceholder({
            rowRelativeX: input.clientX - target.data.x - dragDiffX,
            width,
            id,
            height,
          })
        },
      }),
    )
  }, [placeholderPos, tickWidthPixels, startDate])

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
      {children}
      {placeholderPos && (
        <div
          style={
            gridLayout
              ? {
                  gridColumnStart: placeholderPos.x + 1,
                  gridColumnEnd: placeholderPos.x + placeholderPos.width + 1,
                  gridRowStart: placeholderPos.level + 1,
                  gridRowEnd: placeholderPos.level + 2,
                  height: `${placeholderPos.height}px`,
                }
              : {
                  position: 'absolute',
                  top: `${placeholderPos.level * eventHeight + placeholderPos.level * 8 + 8}px`,
                  height: `${eventHeight}px`,
                  width: `${placeholderPos.width}px`,

                  left: `${placeholderPos.x}px`,
                }
          }
        >
          <Placeholder {...placeholderProps} {...placeholderPos} />
        </div>
      )}
    </div>
  )
}

export default React.memo(TimeRangeRow)
