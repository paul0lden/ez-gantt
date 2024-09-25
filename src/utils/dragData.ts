import type { GanttResource } from '../types'

export const dragDataKey = Symbol('DragData')

export type DragEventData = {
  startDate: number
  endDate: number
  id: string
  resource: string
  width: number
  height: number
  dragDiffX: number
  type: string
}

export type DragData = {
  [dragDataKey]: true
  reason: string
  initialResource: string
  events: DragEventData[]
}

export function isDragEventData(
  data: Record<string | symbol, unknown>,
): data is DragData {
  return Boolean(data[dragDataKey])
}

export const dragTargetDataKey = Symbol('DragTargetData')

export type DragTargetData = {
  [dragTargetDataKey]: true
  x: number
  location: string
} & GanttResource<unknown>

export function isDragTargetData(
  data: Record<string | symbol, unknown>,
): data is DragTargetData {
  return Boolean(data[dragTargetDataKey])
}
