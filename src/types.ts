import type React from 'react'
import { MutableRefObject } from 'react'

interface DateRangeValue {
  startDate: number
  endDate: number
}

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
  [Property in keyof GanttSlotsProps<EventT, ResourceT>]:
  () => React.ReactElement<
    GanttSlotsProps<EventT, ResourceT>[Property]
  >;
}

interface DateViewLevel {
  getNextTimestamp: (prev: number) => number
  getLabel: (date: Date) => React.ReactNode
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
  getDragPreview: () => void
}

interface TimeRangeProps<EventT, ResourceT> {
  schedulingThreeshold: number
  events: GanttEvent<EventT>[]
  resource: GanttResource<ResourceT>
  dateRange: [number, number]
  msPerPixel: number
  resizeRow: (arg0: any) => any
  gridLayout: boolean
  width: number
  children: (arg0: {
    eventsByLevel: Array<Array<
      GanttEvent<EventT> & { placeholder?: boolean }
    >>
  }) => React.ReactNode
}

interface ElementWrapperProps<EventT> {
  event: GanttEvent<EventT>
  onClick: React.PointerEventHandler
  ganttRef: React.RefObject<HTMLDivElement>
  schedulingThreeshold: number
  msPerPixel: number
  level: number
  dateRange: [number, number]
  EventSlot: React.FunctionComponent<any>
  placeholder: boolean
  updateEvent: (event) => void
  selected: boolean
  gridLayout: boolean
  selectedEventsRef: React.MutableRefObject<any>
  getDragPreview: any
  draggedElements: any
  eventHeight: number

}

export type {
  DateRangeValue,
  ElementWrapperProps,
  GanttEvent,
  GanttProps,
  GanttResource,
  GanttSlots,
  GanttSlotsProps,
  TimeRangeProps,
}
