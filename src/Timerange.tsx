import type { TimeRangeProps } from './types'

import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { dropTargetForExternal } from '@atlaskit/pragmatic-drag-and-drop/external/adapter'

import React, { useEffect, useLayoutEffect, useRef } from 'react'

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
    msPerPixel,
    resizeRow,
    width,
    schedulingThreeshold,
    children,
    gridLayout,
    events,
    eventHeight,
    timerangeProps,
  } = props

  const eventsByLevel = getEventsByLevel(events ?? [])
  const rowRef = useRef<HTMLDivElement>(null)

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
            current: { dropTargets },
          } = location
          const type = source.types.find((el: any) =>
            el.includes(getEventType()),
          )
          const target = dropTargets.find(
            (el: any) => el.data.location === 'row',
          )

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

            // TODO: implement external drop logic
            console.warn('external logic is not implemented')
          }
        }, 100),
        onDrop: debounceRAF(() => { }),
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
  }, [msPerPixel, startDate, resource])
  useLayoutEffect(() => {
    // initial resize based on resources
    const resourceElement = document.querySelector(`[data-resource="${resource.id}"]`)
    const rowElement = rowRef.current

    if (rowElement && resourceElement) {
      const resourceHeight = resourceElement.getBoundingClientRect().height
      const rowHeight = rowElement.getBoundingClientRect().height
      if (resourceHeight > rowHeight) {
        rowElement.style.minHeight = `${resourceHeight}px`
      } else {
        resourceElement.style.height = `${rowHeight}px`
      }
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        resizeRow(entry)
      }
    })
    const row = rowRef.current
    if (row) {
      observer.observe(row)
    }

    return () => {
      if (row) {
        observer.unobserve(row)
      }
    }
  }, [resizeRow, resource])

  return (
    <div
      {...(timerangeProps ?? {})}
      style={{
        ...(timerangeProps?.style ?? {}),
        width: '100%',
        rowGap: '8px',
        boxSizing: 'border-box',
        justifyContent: 'center',
        alignItems: 'center',
        display: gridLayout ? 'grid' : 'flex',
        ...(gridLayout
          ? {
              gridTemplateColumns: `repeat(${width / (schedulingThreeshold / msPerPixel)
              }, ${schedulingThreeshold / msPerPixel}px)`,
            }
          : {
              height: `${Math.max(eventsByLevel.length) * eventHeight
              + Math.max(eventsByLevel.length - 1) * 8
              }px`,
            }),
      }}
      ref={rowRef}
      data-timerange={resource.id}
    >
      {children({ eventsByLevel: eventsByLevel as any })}
    </div>
  )
}

export default React.memo(TimeRangeRow) as typeof TimeRangeRow
