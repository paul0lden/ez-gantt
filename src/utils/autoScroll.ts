import type { RefObject } from 'react'
import { useRef } from 'react'
import { resizeDOMRect } from './resizeDOMRect'

interface autoScrollProps {
  gantt: RefObject<HTMLElement>
  selectionRect: RefObject<HTMLElement>
  initialPosition: RefObject<{ x: number, y: number }>
  mouse: RefObject<{ x: number, y: number }>
  scrollSpeed?: number
  edgeThreshold?: number
  callback?: any
}

export function useAutoScroll({
  gantt,
  initialPosition,
  selectionRect,
  mouse,
  scrollSpeed = 20,
  edgeThreshold = 20,
  callback,
}: autoScrollProps): {
    startAutoScroll: () => void
    stopAutoScroll: () => void
  } {
  const scrollInterval = useRef<number | null>(null)

  function autoScroll(): void {
    const container = gantt.current
    if (
      !container
      || !selectionRect.current
      || !initialPosition.current
      || !mouse.current
    ) {
      return
    }

    const {
      scrollLeft,
      scrollTop,
      clientWidth,
      clientHeight,
      scrollWidth,
      scrollHeight,
    } = container

    let scrollX = 0
    let scrollY = 0

    const distanceToLeft = mouse.current.x
    const distanceToRight = clientWidth - mouse.current.x
    const distanceToTop = mouse.current.y
    const distanceToBottom = clientHeight - mouse.current.y

    if (distanceToLeft < edgeThreshold && scrollLeft > 0) {
      scrollX = -Math.min(scrollSpeed, scrollLeft) // Prevent over-scrolling
    }
    else if (
      distanceToRight < edgeThreshold
      && scrollLeft < scrollWidth - clientWidth
    ) {
      scrollX = Math.min(scrollSpeed, scrollWidth - clientWidth - scrollLeft)
    }

    if (distanceToTop < edgeThreshold && scrollTop > 0) {
      scrollY = -Math.min(scrollSpeed, scrollTop)
    }
    else if (
      distanceToBottom < edgeThreshold
      && scrollTop < scrollHeight - clientHeight
    ) {
      scrollY = Math.min(scrollSpeed, scrollHeight - clientHeight - scrollTop)
    }
    if (scrollX !== 0 || scrollY !== 0) {
      container.scrollBy(scrollX, scrollY)

      callback()

      resizeDOMRect(selectionRect.current, initialPosition.current, {
        x: mouse.current.x + container.scrollLeft,
        y: mouse.current.y + container.scrollTop,
      })
    }

    scrollInterval.current = requestAnimationFrame(autoScroll)
  }
  const startAutoScroll = (): void => {
    if (!scrollInterval.current) {
      scrollInterval.current = requestAnimationFrame(autoScroll)
    }
  }
  const stopAutoScroll = (): void => {
    if (scrollInterval.current) {
      cancelAnimationFrame(scrollInterval.current)
      scrollInterval.current = null
    }
  }

  return { startAutoScroll, stopAutoScroll }
}
