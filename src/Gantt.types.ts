type GanttEvent<EventT> = {
  startDate: number;
  endDate: number;
  id: string;
  resources: Set<string>;
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

interface GanttProps<EventT, ResourceT> {
  events: GanttEvent<EventT>[];
  resources: GanttResource<ResourceT>[];
  slots?: GanttSlots<EventT, ResourceT>;
  slotsProps?: GanttSlotsProps<EventT, ResourceT>;
  dateRange: [number, number];
}

export type {
  GanttSlots,
  GanttSlotsProps,
  GanttProps,
  GanttEvent,
  GanttResource,
};
