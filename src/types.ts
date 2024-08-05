import type { ReactNode } from "react";

type GanttEvent<EventT> = {
  startDate: number;
  endDate: number;
  id: string;
  resource: string;
} & EventT;

type GanttResource<ResourceT> = {
  // in case we are rendering tree the user should be able to define the rendering behavior
  // with the link to multiple resource
  //
  // we need to provide the API to extend the view modes of the resources
  // to allow user render the rows in the scheduler dynamically
  //
  // we need to use this API to create views like tree and so on
  //
  // what tree-like resource structure implements ? :
  //    - change the amount of rendered rows on specific event
  //    - modify the displayed resource rows ( attaching more data )
  //
  // it should be capable of providing additional props into the renderers of additional resource and event rows
  //
  id: string;
} & ResourceT;

type GanttSlotsProps<EventT = {}, ResourceT = {}> = {
  Event: GanttEvent<EventT>;
  Resource: GanttResource<ResourceT>;
  TimerangeHeader: any;
  ResourceHeader: any;
};

type GanttSlots<EventT, ResourceT> = {
  [Property in keyof GanttSlotsProps<EventT, ResourceT>]: GanttSlotsProps<
    EventT,
    ResourceT
  >[Property];
};

type DateViewLevel = {
  getNextTimestamp: (prev: number) => number;
  getLabel: (date: Date) => ReactNode;
  color?: string;
  width?: number;
};

interface GanttProps<EventT, ResourceT> {
  msPerPixel: number;
  dateViewLevels: DateViewLevel[];
  events: GanttEvent<EventT>[];
  resources: GanttResource<ResourceT>[];
  slots?: GanttSlots<EventT, ResourceT>;
  slotsProps?: GanttSlotsProps<EventT, ResourceT>;
  dateRange: [number, number];
  handleEventDrop: (
    event: GanttEvent<EventT>,
    resource: GanttResource<ResourceT>
  ) => void;
}

type TimeRangeProps<EventT, ResourceT> = {
  events: GanttEvent<EventT>[];
  resource: GanttResource<ResourceT>;
  dateRange: [number, number];
  tickWidthPixels: number;
  handleEventDrop: (
    event: GanttEvent<EventT>,
    resource: GanttResource<ResourceT>
  ) => void;
  resizeRow: (arg0: any) => any;
};

export type {
  GanttSlots,
  GanttSlotsProps,
  GanttProps,
  GanttEvent,
  GanttResource,
  TimeRangeProps,
};
