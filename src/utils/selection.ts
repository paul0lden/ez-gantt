import type { Dispatch, RefObject, SetStateAction } from 'react'
import { useRef } from 'react'

import { arraysAreEqual } from './arrayEqual'
import { useAutoScroll } from './autoScroll'
import { debounceRAF } from './debounce'
import { DOMGeometricSearch } from './geometricSearch'
import { resizeDOMRect } from './resizeDOMRect'

interface SelectionProps {
  gantt: RefObject<HTMLDivElement>
  selectionRect: RefObject<HTMLDivElement>
  startDate: number
  msPerPixel: number
  selectedEvents: string[]
  setSelectedEvents: Dispatch<SetStateAction<string[]>>
}

export function useSelectionUtils({
  gantt,
  selectionRect,
  startDate,
  msPerPixel,
  selectedEvents,
  setSelectedEvents,
}: SelectionProps): {
    selectionRectStart: React.PointerEventHandler<HTMLElement>
    selectionRectEnd: React.PointerEventHandler<HTMLElement>
  } {
  const initialPosition = useRef({ x: 0, y: 0 })
  const initialMousePosition = useRef({ x: 0, y: 0 })
  const selectionData = useRef({
    startResource: null,
    startTimestamp: null,
  })
  const mouse = useRef({ x: 0, y: 0 })
  const cachedResult = useRef<Array<string>>([])

  const selectionThreshold = 5
  const hasMovedEnough = useRef(false)
  const selectionCache = useRef<string[]>([])

  const search = debounceRAF(() => {
    if (!gantt.current || !selectionRect.current)
      return
    const newResult = DOMGeometricSearch(gantt.current, selectionRect.current)
      .map(el => el.getAttribute('data-event-id'))
      .filter(el => typeof el === 'string')

    if (arraysAreEqual(newResult, cachedResult.current))
      return

    cachedResult.current = newResult
    setSelectedEvents([...selectionCache.current, ...newResult])
  })

  const { stopAutoScroll, startAutoScroll } = useAutoScroll({
    gantt,
    selectionRect,
    mouse,
    initialPosition,
    callback: search,
  })

  const selectionRectStart: React.PointerEventHandler<HTMLElement> = (event) => {
    let el: HTMLElement | null = event.target as HTMLElement

    if (event.button !== 0)
      return

    if (event.shiftKey) {
      selectionCache.current = selectedEvents
    }

    while (el && el.getAttribute('data-role') !== 'gantt') {
      if (el.getAttribute('data-role') === 'gantt-event')
        return
      el = el.parentElement
    }

    const element = gantt.current
    if (!element)
      return

    element.setPointerCapture(event.pointerId)

    initialMousePosition.current = {
      x: event.clientX,
      y: event.clientY,
    }

    const { x, y } = element.getBoundingClientRect()
    initialPosition.current = {
      x: event.clientX - x + element.scrollLeft,
      y: event.clientY - y + element.scrollTop,
    }

    selectionData.current = {
      startResource: event.target?.getAttribute('data-resource'),
      startTimestamp: startDate + initialPosition.current.x * msPerPixel,
    }

    hasMovedEnough.current = false

    element.onpointermove = (event) => {
      const { clientX, clientY } = event
      event.preventDefault()

      const moveX = Math.abs(clientX - initialMousePosition.current.x)
      const moveY = Math.abs(clientY - initialMousePosition.current.y)

      if (moveX > selectionThreshold || moveY > selectionThreshold) {
        hasMovedEnough.current = true
      }

      if (!hasMovedEnough.current)
        return

      if (!gantt.current || !selectionRect.current || !initialPosition.current)
        return

      search()

      const { x, y } = gantt.current.getBoundingClientRect()
      mouse.current = { x: clientX - x, y: clientY - y }

      startAutoScroll()

      selectionRect.current.style.opacity = '1'

      resizeDOMRect(selectionRect.current, initialPosition.current, {
        x: mouse.current.x + gantt.current.scrollLeft,
        y: mouse.current.y + gantt.current.scrollTop,
      })
    }
  }

  const selectionRectEnd: React.PointerEventHandler<HTMLElement> = (event) => {
    selectionCache.current = []
    if (!selectionRect.current || !gantt.current || event.button !== 0)
      return

    gantt.current.onpointermove = null
    gantt.current.releasePointerCapture(event.pointerId)
    selectionRect.current.style.opacity = '0'
    stopAutoScroll()

    if (!hasMovedEnough.current) {
      setSelectedEvents([])
    }
  }

  return {
    selectionRectStart,
    selectionRectEnd,
  }
}
