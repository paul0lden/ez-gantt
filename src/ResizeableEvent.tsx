import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'

import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview'
import React, { useEffect, useRef } from 'react'

import { resizeDataKey } from './utils/resizeDdata'

export const ResizeableEvent: React.FC<any> = (props) => {
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
          [resizeDataKey]: true,
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
          [resizeDataKey]: true,
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
        style={{
          width: '12px',
          height: '100%',
          position: 'absolute',
          cursor: 'ew-resize',
          top: 0,
          left: 0,
        }}
        onPointerDown={e => ganttRef.current.setPointerCapture(e.pointerId)}
      />
      {children}
      <div
        ref={rightRef}
        data-role="resize-right"
        style={{
          width: '12px',
          height: '100%',
          position: 'absolute',
          cursor: 'ew-resize',
          top: 0,
          right: 0,
        }}
        onPointerDown={e => ganttRef.current.setPointerCapture(e.pointerId)}
      />
    </>
  )
}

export default React.memo(ResizeableEvent)
