interface getTypeStringArgs {
  dataType: string
  metadata: string | string[]
}

export const EVENT_TYPE = 'application/vnd.ez-gantt-event'

export function getEventType(args?: getTypeStringArgs) {
  const { dataType, metadata } = args ?? {}
  return [EVENT_TYPE, dataType ?? [], metadata ?? []].flat().join('+')
}
