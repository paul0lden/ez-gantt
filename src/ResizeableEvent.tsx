import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'

import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview'
import React, { useEffect, useRef } from 'react'

import classes from './resizeable.module.css'
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
        className={classes['resizeable-resize']}
        style={{ left: 0 }}
        onPointerDown={e => ganttRef.current.setPointerCapture(e.pointerId)}
      />
      {children}
      <div
        ref={rightRef}
        className={classes['resizeable-resize']}
        data-role="resize-right"
        style={{ right: 0 }}
        onPointerDown={e => ganttRef.current.setPointerCapture(e.pointerId)}
      />
    </>
  )
}

export default React.memo(ResizeableEvent)
