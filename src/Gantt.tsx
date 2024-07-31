import React, { useEffect, useMemo, useRef } from "react";
import { Box } from "@mui/material";
import { useTheme } from "@emotion/react";

const TimeRangeRow: React.FC<any> = ({
  resources,
  data,
  rowMinHeight,
  resourceEventsMap,
  startDate,
  endDate,
  subTick,
  tickWidthPixels,
  resizeRow,
}) => {
  const sortedEvents = (resourceEventsMap[data.id] ?? []).sort(
    (a, b) => a?.startDate > b?.startDate
  );

  const eventsByLevel = [];

  eventsByLevel.push([sortedEvents[0]]);

  const checkLevel = (level, entry) => {
    if (!eventsByLevel[level]) {
      eventsByLevel.push([entry]);
      return;
    }
    if (
      eventsByLevel[level][eventsByLevel[level].length - 1].endDate <
      entry.startDate
    ) {
      eventsByLevel[level].push(entry);
      return;
    }

    checkLevel(level + 1, entry);
  };

  for (let i = 1; i < sortedEvents.length; i += 1) {
    const event = sortedEvents[i];
    checkLevel(0, event);
  }

  const eventHeight = 45;

  const rowRef = useRef();

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      resizeRow(entry);
    }
  });

  useEffect(() => {
    resizeObserver.observe(rowRef.current);

    return () => {
      resizeObserver.unobserve(rowRef.current);
    };
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        // ':hover': {
        //   '& > .resource': {
        //     backgroundColor: 'rgba(0,0,0,.1)',
        //   },
        // },
      }}
    >
      <Box
        className="timeRange"
        sx={{
          width: "100%",
          overflow: "hidden",
          alignItems: "flex-start",
          borderBottom: "2px solid rgba(0,0,0,.2)",
          paddingBlock: 0.5,
        }}
      >
        <Box
          ref={rowRef}
          data-resource={data.id}
          sx={{
            width: "max-content",
            height: eventsByLevel.length * (eventHeight + 8),
            // height:  * eventHeight,
            display: "block",
            position: "relative",
            // gridTemplateColumns: `repeat(${
            //   subTicksPerTimeRange * threesholdRatio
            // }, ${tickWidthPixels / threesholdRatio}px)`,
          }}
        >
          {eventsByLevel.flatMap(
            (level, i) =>
              level?.flatMap((event) =>
                event ? (
                  <AssignmentEvent
                    sx={() => {
                      const startTimeDiff =
                        (new Date(event.startDate).valueOf() -
                          startDate.valueOf()) /
                        1000 /
                        60;
                      const endTimeDiff =
                        (new Date(event.endDate).valueOf() -
                          startDate.valueOf()) /
                        1000 /
                        60;

                      return {
                        left: `${(startTimeDiff / subTick) * tickWidthPixels}px`,
                        width: `${((endTimeDiff - startTimeDiff) / subTick) * tickWidthPixels}px`,
                        top: Math.max(i * (eventHeight + 8)),
                        position: "absolute",
                      };
                    }}
                    key={event.id}
                    event={event}
                    resources={resources}
                  />
                ) : (
                  ""
                )
              ) ?? []
          )}
        </Box>
      </Box>
    </Box>
  );
};

type GanttEvent<EventT> = {
  startDate: number;
  endDate: number;
  isLoading: number;
  id: string;
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

type ViewUnit = "hour" | "day" | "week" | "month" | "year";

type ViewPreset = {
  unit: ViewUnit;
};

type GanttSlotsProps<EventT, ResourceT> = {
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
  events: GanttEvent<EventT>;
  resources: GanttResource<ResourceT>;
  slots: GanttSlots<EventT, ResourceT>;
  slotsProps: GanttSlotsProps<EventT, ResourceT>;
  dateRange: [number, number];
}

/**
 * Data driven gantt chart based on MUI
 */
export const Gantt: <EventT, ResourceT>(
  props: GanttProps<EventT, ResourceT>
) => React.ReactElement<GanttProps<EventT, ResourceT>> = (props) => {
  const {
    events,
    resources,
    dateRange,
    resourceFilters,
    resourceSorting,
    handleFilterDateChange,
    handleNavigationChange,
    slots,
    slotsProps,
  } = props;

  const tickWidthPixels = 115;

  const subTick = 60;
  const mainTick = 24 * 60;

  const schedulingThreeshold = 30;

  const threesholdRatio = subTick / schedulingThreeshold;

  const rowMinHeight = 64;

  const viewPresets = [];

  const ganntScrollContainer = useRef(null);
  const ganntHeaderScrollContainer = useRef(null);
  const resourceScrollContainer = useRef(null);

  const startDate = filters.date[0];
  const endDate = filters.date[1];

  const subTicksPerTimeRange = Math.ceil(
    (endDate.valueOf() - startDate.valueOf()) / (subTick * 60 * 1000)
  );
  const mainTickPerTimeRange = Math.ceil(
    (endDate.valueOf() - startDate.valueOf()) / (mainTick * 60 * 1000)
  );

  const mainTickWidth = (mainTick / subTick) * tickWidthPixels;

  const subTickDates = Array.from(Array(subTicksPerTimeRange).keys()).map(
    (el) => new Date(startDate.valueOf() + el * subTick * 60 * 1000)
  );
  const mainTickDates = Array.from(Array(mainTickPerTimeRange).keys()).map(
    (el) => new Date(startDate.valueOf() + el * mainTick * 60 * 1000)
  );

  const ganntWidth = subTicksPerTimeRange * tickWidthPixels;

  const handleGanntScroll: React.UIEventHandler<HTMLDivElement> = (scroll) => {
    if (resourceScrollContainer.current) {
      resourceScrollContainer.current.scrollTop =
        scroll.currentTarget.scrollTop;
    }
    if (ganntHeaderScrollContainer.current) {
      ganntHeaderScrollContainer.current.scrollLeft =
        scroll.currentTarget.scrollLeft;
    }
  };
  const handleGanntHeaderScroll: React.UIEventHandler<HTMLDivElement> = (
    scroll
  ) => {
    if (ganntHeaderScrollContainer.current) {
      ganntScrollContainer.current.scrollLeft = scroll.currentTarget.scrollLeft;
    }
  };
  const handleResourceScroll: React.UIEventHandler<HTMLDivElement> = (
    scroll
  ) => {
    if (resourceScrollContainer.current) {
      ganntScrollContainer.current.scrollTop = scroll.currentTarget.scrollTop;
    }
  };

  const resourceEventsMap = useMemo(() => {
    const out: Record<string, SchedulerEvent[]> = {};

    for (const event of events) {
      if (out[event.leadId]) {
        out[event.leadId].push(event);
      } else {
        out[event.leadId] = [event];
      }

      for (const additionalUser of event?.additionalUserIds ?? []) {
        if (out[additionalUser]) {
          out[additionalUser].push(event);
        } else {
          out[additionalUser] = [event];
        }
      }
    }

    return out;
  }, [events]);

  const resizeRow = (entry) => {
    const resizedId = (entry.target as HTMLElement).getAttribute(
      "data-resource"
    );
    const el = (resourceScrollContainer.current as HTMLElement).querySelector(
      `[data-resource="${resizedId}"]`
    );

    console.log(el);
    console.log(entry.contentRect.height);

    el.style.height = `${entry.contentRect.height}px`;
  };

  const theme = useTheme();

  return (
    <Box sx={{ height: "100%", display: "flex", flexFlow: "column" }}>
      <Box
        sx={{
          display: "flex",
          background: "#fafafa",
          borderTop: `2px solid ${theme.palette.grey[400]}`,
          boxShadow: "0 4px 8px -2px rgba(0,0,0,.15)",
        }}
      >
        <Box
          sx={{
            minWidth: "250px",
            padding: 1,
          }}
        >
          <ResourceColumnHeader
            onCall={resourceFilters.onCall}
            inputValue={resourceFilters.input}
            shiftType={resourceFilters.shiftType}
            sorting={resourceSorting}
            onInputChange={() => {}}
            onFilterChange={() => {}}
            onSortingChange={() => {}}
            filterOnCall={() => {}}
          />
        </Box>
        <Box
          sx={{ width: "8px", background: "#ebebeb", cursor: "ew-resize" }}
        />
        <Box
          onScroll={handleGanntHeaderScroll}
          ref={ganntHeaderScrollContainer}
          sx={{
            width: "100%",
            overflowX: "scroll",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          <Box
            sx={{
              height: 1,
              width: ganntWidth,
              display: "flex",
              flexFlow: "column",
            }}
          >
            <Box
              sx={{
                height: 1,
                display: "grid",
                gridTemplateColumns: `repeat(${mainTickPerTimeRange}, ${mainTickWidth}px)`,
              }}
            >
              {mainTickDates.map((date) => (
                <Box
                  sx={{
                    width: 1,
                    height: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ":hover": {
                      background: "rgba(0, 0, 0, .05)",
                    },
                    cursor: "pointer",
                  }}
                  key={date.toISOString()}
                >
                  {date.toDateString()}
                </Box>
              ))}
            </Box>
            <Box
              sx={{
                height: 1,
                display: "grid",
                gridTemplateColumns: `repeat(${subTicksPerTimeRange}, ${tickWidthPixels}px)`,
              }}
            >
              {subTickDates.map((date) => (
                <Box
                  sx={{
                    width: 1,
                    height: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ":hover": {
                      background: "rgba(0, 0, 0, .05)",
                    },
                    cursor: "pointer",
                  }}
                  key={date.toISOString()}
                >
                  {date.getHours()}:{date.getMinutes()}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>
        <Box
          onScroll={handleResourceScroll}
          ref={resourceScrollContainer}
          sx={{
            display: "flex",
            flexDirection: "column",
            minWidth: "250px",
            height: "100%",
            overflowY: "scroll",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          {resources.map((data) => (
            <Box
              key={data.id}
              sx={{
                width: "100%",
                display: "flex",
                ":hover": {
                  "& > .resource": {
                    backgroundColor: "rgba(0,0,0,.1)",
                  },
                },
              }}
            >
              <Box
                className="resource"
                sx={{
                  paddingBlock: 0.5,
                  width: "100%",
                  alignItems: "flex-start",
                  borderBottom: "2px solid rgba(0,0,0,.2)",
                }}
              >
                <Box
                  data-resource={data.id}
                  sx={{
                    width: "max-content",
                    height: 45 + 8,
                    display: "flex",
                    marginInline: 1,
                  }}
                >
                  <UserInitialsInfoLine
                    resourceType={data.resourceType}
                    id={data.id}
                    icon={data.image}
                    firstName={data.firstName}
                    lastName={data.lastName}
                    role={data.professionName}
                    color={theme.palette.common.white}
                  />
                </Box>
              </Box>
              {/* <Box sx={{ width: 5, background: '#777', cursor: 'ew-resize' }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
                <Box sx={{ padding: 1.5 }}>Gannt</Box>
              </Box> */}
            </Box>
          ))}
        </Box>
        <Box
          sx={{
            width: "8px",
            height: "100%",
            backgroundColor: "#ebebeb",
            cursor: "ew-resize",
          }}
        />
        <Box
          onScroll={handleGanntScroll}
          ref={ganntScrollContainer}
          sx={{
            width: "100%",
            height: "100%",
            overflowX: "auto",
            position: "relative",
          }}
        >
          <Box
            sx={{
              width: ganntWidth,
              backgroundImage: `url("data:image/svg+xml;utf8,<svg width='${ganntWidth}' height='100%' xmlns='http://www.w3.org/2000/svg'>${Array.from(
                Array(subTicksPerTimeRange - 1).keys()
              ).map(
                (el) =>
                  `<line x1='${(el + 1) * tickWidthPixels}' y1='0' x2='${
                    (el + 1) * tickWidthPixels
                  }' y2='100%' stroke='%23eee' strokeWidth='2' />`
              )}${Array.from(Array(mainTickPerTimeRange).keys()).map(
                (el) =>
                  `<line x1='${(el + 1) * mainTickWidth}' y1='0' x2='${
                    (el + 1) * mainTickWidth
                  }' y2='100%' stroke='%23777' strokeWidth='3' />`
              )}</svg>")`,
            }}
          >
            {resources.map((data) => (
              <TimeRangeRow
                data={data}
                endDate={endDate}
                resourceEventsMap={resourceEventsMap}
                resources={resources}
                rowMinHeight={rowMinHeight}
                startDate={startDate}
                subTick={subTick}
                tickWidthPixels={tickWidthPixels}
                key={data.id}
                resizeRow={resizeRow}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
