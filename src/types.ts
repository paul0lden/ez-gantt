import type React from 'react'
import type { ReactElement, ReactNode } from 'react'

type GanttEvent<EventT> = {
  startDate: number
  endDate: number
  id: string
  resource: string
} & EventT

type GanttResource<ResourceT> = {
  id: string
} & ResourceT

interface PlaceholderProps {
  width: number
  level: number
  x: number
}

interface GanttSlotsProps<EventT, ResourceT> {
  Event: GanttEvent<EventT>
  Resource: GanttResource<ResourceT>
  Placeholder: PlaceholderProps
  TimerangeHeader: any
  ResourceHeader: any
}

type GanttSlots<EventT, ResourceT> = {
  [Property in keyof GanttSlotsProps<EventT, ResourceT>]: () => ReactElement<
    GanttSlotsProps<EventT, ResourceT>[Property]
  >;
}

interface DateViewLevel {
  getNextTimestamp: (prev: number) => number
  getLabel: (date: Date) => ReactNode
  color?: string
  width?: number
}

interface GanttProps<EventT, ResourceT> {
  schedulingThreeshold: number
  msPerPixel: number
  dateViewLevels: DateViewLevel[]
  events: GanttEvent<EventT>[]
  resources: GanttResource<ResourceT>[]
  slots: GanttSlots<EventT, ResourceT>
  slotsProps?: GanttSlotsProps<EventT, ResourceT>
  dateRange: [number, number]
  handleEventDrop: (
    events: Array<GanttEvent<EventT>>,
  ) => void
  gridLayout: boolean
  dropResolutionMode: 'as-selected' | 'single-resource'
  updateEvent: () => any
  resourceColumnDefaultWidth: number
  getDragPreview: () => any
}

interface TimeRangeProps<EventT, ResourceT> {
  setSelectedEvents: (newState: string[] | ((prev: string[]) => string[])) => void
  schedulingThreeshold: number
  events: GanttEvent<EventT>[]
  resource: GanttResource<ResourceT>
  dateRange: [number, number]
  tickWidthPixels: number
  handleEventDrop: (
    event: GanttEvent<EventT>,
    resource: GanttResource<ResourceT>
  ) => void
  resizeRow: (arg0: any) => any
  Placeholder: React.ReactElement
  EventSlot: React.ReactElement
  placeholderProps: any
  eventProps: any
}

export type {
  GanttEvent,
  GanttProps,
  GanttResource,
  GanttSlots,
  GanttSlotsProps,
  TimeRangeProps,
}
