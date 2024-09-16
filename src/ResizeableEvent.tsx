import React, { useEffect, useRef } from 'react'

import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'

import './resizeable.css'

export function ResizeableEvent(props) {
  const {
    event,
    children,
    ganttRef,
  } = props

  const leftRef = useRef<HTMLDivElement>(null!)
  const rightRef = useRef<HTMLDivElement>(null!)

  useEffect(() => {
    return combine(
      draggable({
        element: leftRef.current,
        getInitialData: () => ({
          reason: 'resize-event',
          direction: 'left',
          event,
        }),
        onGenerateDragPreview({ nativeSetDragImage }) {
          disableNativeDragPreview({ nativeSetDragImage })
        },
      }),
      draggable({
        element: rightRef.current,
        getInitialData: () => ({
          reason: 'resize-event',
          direction: 'right',
          event,
        }),
        onGenerateDragPreview({ nativeSetDragImage }) {
          disableNativeDragPreview({ nativeSetDragImage })
        },
      }),
    )
  }, [event])

  return (
    <>
      <div
        ref={leftRef}
        data-role="resize-left"
        className="resizeable-resize"
        style={{ left: 0 }}
        onPointerDown={e => ganttRef.current.setPointerCapture(e.pointerId)}
      />
      {children}
      <div
        ref={rightRef}
        className="resizeable-resize"
        data-role="resize-right"
        style={{ right: 0 }}
        onPointerDown={e => ganttRef.current.setPointerCapture(e.pointerId)}
      />
    </>
  )
}

export default React.memo(ResizeableEvent)
