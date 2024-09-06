import React, { useRef } from 'react'

import './resizeable.css'

export function ResizeableEvent(props) {
  const {
    startDate,
    endDate,
    dateRange,
    tickWidthPixels,
    schedulingThreeshold,
    updateEvent,
    id,
    event,
    minWidth = 30,
    children,
  } = props

  const startWidth = (endDate - startDate) / tickWidthPixels
  const startX = Math.abs(dateRange[0] - startDate) / tickWidthPixels
  const element = useRef<Element | null>(null)
  const gridLayout = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })

  const pointerDownHandler = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.target.setPointerCapture(e.pointerId)

    element.current = document.querySelector(`[data-event-id="${id}"]`)
    gridLayout.current
      = (
        document.querySelector(
          `[data-timerange="${event.resource}"]`,
        ) as HTMLElement
      )?.style?.getPropertyValue('display') === 'grid'
    if (element.current) {
      const { x, y } = element.current.getBoundingClientRect()
      startPos.current = { x, y }
    }
  }

  const pointerMoveHandler = (e: PointerEvent, pos: 'left' | 'right') => {
    if (!element.current)
      return

    // if left update the start date
    if (pos === 'left') {
      const diff
        = Math.round(
          (e.clientX - startPos.current.x)
          / (schedulingThreeshold / tickWidthPixels),
        )
        * (schedulingThreeshold / tickWidthPixels)
      const newStartX = Math.min(startX + diff, startX + startWidth)
      const newWidth = Math.max(startWidth - diff, diff - startWidth)
      if (gridLayout.current) {
        element.current.style.gridColumnStart
          = newStartX / (schedulingThreeshold / tickWidthPixels) + 1
        element.current.style.gridColumnEnd
          = (newStartX + newWidth) / (schedulingThreeshold / tickWidthPixels) + 1
      }
      else {
        element.current.style.left = `${newStartX}px`
        element.current.style.width = `${newWidth}px`
      }
    }
    else {
      const diff
        = Math.round(
          (e.clientX - (startPos.current.x + startWidth))
          / (schedulingThreeshold / tickWidthPixels),
        )
        * (schedulingThreeshold / tickWidthPixels)
      const newStartX = Math.min(startX, startX + startWidth + diff)
      const newWidth = Math.max(startWidth + diff, -diff - startWidth)
      if (gridLayout.current) {
        element.current.style.gridColumnStart
          = newStartX / (schedulingThreeshold / tickWidthPixels) + 1
        element.current.style.gridColumnEnd
          = (newStartX + newWidth) / (schedulingThreeshold / tickWidthPixels) + 1
      }
      else {
        element.current.style.left = `${newStartX}px`
        element.current.style.width = `${newWidth}px`
      }
    }
  }

  const pointerUpHandler = (e, pos) => {
    e.preventDefault()
    e.stopPropagation()
    e.target.releasePointerCapture(e.pointerId)

    if (!element.current)
      return

    if (pos === 'left') {
      const diff
        = Math.round(
          (e.clientX - startPos.current.x)
          / (schedulingThreeshold / tickWidthPixels),
        )
        * (schedulingThreeshold / tickWidthPixels)
      const newStartX = Math.min(startX + diff, startX + startWidth)
      const newWidth = Math.max(startWidth - diff, diff - startWidth)

      const newStartDate = dateRange[0] + newStartX * tickWidthPixels
      const newEndDate = newWidth * tickWidthPixels + newStartDate

      updateEvent({ ...event, startDate: newStartDate, endDate: newEndDate })
    }
    else {
      const diff
        = Math.round(
          (e.clientX - (startPos.current.x + startWidth))
          / (schedulingThreeshold / tickWidthPixels),
        )
        * (schedulingThreeshold / tickWidthPixels)
      const newStartX = Math.min(startX, startX + startWidth + diff)
      const newWidth = Math.max(startWidth + diff, -diff - startWidth)

      const newStartDate = dateRange[0] + newStartX * tickWidthPixels
      const newEndDate = newWidth * tickWidthPixels + newStartDate

      updateEvent({ ...event, startDate: newStartDate, endDate: newEndDate })
    }

    element.current = null
  }

  return (
    <>
      <div
        data-role="resize-left"
        onPointerDown={pointerDownHandler}
        onPointerMove={e => pointerMoveHandler(e, 'left')}
        onPointerUp={e => pointerUpHandler(e, 'left')}
        className="resizeable-resize"
        style={{ left: 0 }}
      />
      {children}
      <div
        onPointerDown={pointerDownHandler}
        onPointerMove={e => pointerMoveHandler(e, 'right')}
        onPointerUp={e => pointerUpHandler(e, 'right')}
        className="resizeable-resize"
        data-role="resize-right"
        style={{ right: 0 }}
      />
    </>
  )
}

export default React.memo(ResizeableEvent)
