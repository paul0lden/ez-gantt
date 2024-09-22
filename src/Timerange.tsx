import type { TimeRangeProps } from './types'

import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { dropTargetForExternal } from '@atlaskit/pragmatic-drag-and-drop/external/adapter'

import React, { useEffect, useRef } from 'react'
import { getEventType } from './defaults'

import { debounce, debounceRAF } from './utils/debounce'
import { dragTargetDataKey } from './utils/dragData'
import { getEventsByLevel } from './utils/levels'

function TimeRangeRow<EventT, ResourceT>(
  props: TimeRangeProps<EventT, ResourceT>,
): React.ReactNode {
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
  } = props

  const eventsByLevel = getEventsByLevel(events ?? [])

  const rowRef = useRef<HTMLDivElement>(null)

  const eventHeight = 45
  const resizeObserver = useRef(new ResizeObserver((entries) => {
    for (const entry of entries) {
      resizeRow(entry)
    }
  }))

  useEffect(() => {
    const row = rowRef.current
    const observer = resizeObserver.current
    if (row) {
      observer.observe(row)
    }

    return () => {
      if (row) {
        observer.unobserve(row)
      }
    }
  }, [resizeObserver])
  useEffect(() => {
    const element = rowRef.current

    if (!element)
      return

    return combine(
      dropTargetForExternal({
        element,
        getData({ element }) {
          return {
            [dragTargetDataKey]: true,
            x: element.getBoundingClientRect().x,
            location: 'row',
            ...resource,
          }
        },
        canDrop: ({ source }) =>
          !!source.types.find(el => el.includes(getEventType())),
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

            // drawPlaceholder({
            //  rowRelativeX: input.clientX - diffX - data.x,
            //  width,
            //  height,
            // })
          }
        }, 100),
        onDrop: debounceRAF(() => {
        }),
      }),
      dropTargetForElements({
        element,
        getData({ element }) {
          return {
            [dragTargetDataKey]: true,
            x: element.getBoundingClientRect().x,
            location: 'row',
            ...resource,
          }
        },
      }),
    )
  }, [tickWidthPixels, startDate, resource])

  return (
    <div
      className="timerange-row"
      style={{
        minHeight: `${40}px`,
        display: gridLayout ? 'grid' : 'flex',
        ...(gridLayout
          ? {
              gridTemplateColumns: `repeat(${width / (schedulingThreeshold / tickWidthPixels)
              }, ${schedulingThreeshold / tickWidthPixels}px)`,
            }
          : {
              height: `${Math.max(
                eventsByLevel.length,
              )
              * eventHeight
              + Math.max(
                eventsByLevel.length - 1,
              )
              * 8
              }px`,
            }),
      }}
      ref={rowRef}
      data-timerange={resource.id}
    >
      {children({ eventsByLevel })}
    </div>
  )
}

export default React.memo(TimeRangeRow)
