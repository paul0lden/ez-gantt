export const resizeDataKey = Symbol('DragData')

export type ResizeEventData = {
  startDate: number
  endDate: number
  id: string
  resource: string
  width: number
  height: number
  dragDiffX: number
  type: string
}

export type ResizeData = {
  [resizeDataKey]: true
  reason: string
  direction: 'left' | 'right'
  event: ResizeEventData
}

export function isResizeEventData(
  data: Record<string | symbol, unknown>,
): data is ResizeData {
  return Boolean(data[resizeDataKey])
}
