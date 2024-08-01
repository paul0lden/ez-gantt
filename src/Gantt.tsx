import React, { useEffect, useMemo, useRef } from "react";
import { Box, useTheme } from "@mui/material";

import type { GanttResource, GanttEvent, GanttProps } from "./Gantt.types";

type TimeRangeProps<EventT, ResourceT> = {
  events: GanttEvent<EventT>[];
  resource: GanttResource<ResourceT>;
  dateRange: [number, number];
  subTick: number;
  tickWidthPixels: number;
  resizeRow: (arg0: any) => any;
};

const TimeRangeRow = <EventT, ResourceT>(
  props: TimeRangeProps<EventT, ResourceT>
) => {
  const {
    resource,
    events,
    dateRange: [startDate],
    subTick,
    tickWidthPixels,
    resizeRow,
  } = props;
  const sortedEvents = events.sort((a, b) => a.startDate - b.startDate);

  const eventsByLevel: Array<typeof sortedEvents> = [];

  eventsByLevel.push([sortedEvents[0]]);

  const checkLevel = (level: number, entry: (typeof sortedEvents)[0]) => {
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

  const rowRef = useRef<HTMLElement>(null);

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      resizeRow(entry);
    }
  });

  useEffect(() => {
    if (rowRef.current) {
      resizeObserver.observe(rowRef.current);
    }

    return () => {
      if (rowRef.current) {
        resizeObserver.unobserve(rowRef.current);
      }
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
          data-resource={resource.id}
          sx={{
            width: "max-content",
            height: eventsByLevel.length * (eventHeight) + Math.max(0, eventsByLevel.length - 1) * 8,
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
                  <Box
                    sx={() => {
                      const startTimeDiff =
                        (new Date(event.startDate).valueOf() - startDate) /
                        1000 /
                        60;
                      const endTimeDiff =
                        (new Date(event.endDate).valueOf() - startDate) /
                        1000 /
                        60;

                      return {
                        background: 'red',
                        height: '100%',
                        borderRadius: 2,
                        overflow: 'hidden',
                        maxHeight: eventHeight,
                        left: `${(startTimeDiff / subTick) * tickWidthPixels}px`,
                        width: `${((endTimeDiff - startTimeDiff) / subTick) * tickWidthPixels}px`,
                        top: Math.max(i * (eventHeight + 8)),
                        position: "absolute",
                      };
                    }}
                    key={event.id}
                  >
                    {event.id} - {new Date(event.startDate).toLocaleString()}
                  </Box>
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

/**
 * Data driven gantt chart based on MUI
 */
export const Gantt = <EventT, ResourceT>(
  props: GanttProps<EventT, ResourceT>
) => {
  const { events, resources, dateRange, slots, slotsProps } = props;

  const ganttScrollContainer = useRef<HTMLElement>(null);
  const ganttHeaderScrollContainer = useRef<HTMLElement>(null);
  const resourceScrollContainer = useRef<HTMLElement>(null);

  const [startDate, endDate] = dateRange.map(
    (timestamp) => new Date(timestamp)
  );
  const tickWidthPixels = 115;
  const subTick = 60;
  const mainTick = 24 * 60;
  const schedulingThreeshold = 30;
  const threesholdRatio = subTick / schedulingThreeshold;
  const rowMinHeight = 64;
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
  const ganttWidth = subTicksPerTimeRange * tickWidthPixels;

  const handleganttScroll: React.UIEventHandler<HTMLElement> = (scroll) => {
    if (resourceScrollContainer.current) {
      resourceScrollContainer.current.scrollTop =
        scroll.currentTarget.scrollTop;
    }
    if (ganttHeaderScrollContainer.current) {
      ganttHeaderScrollContainer.current.scrollLeft =
        scroll.currentTarget.scrollLeft;
    }
  };
  const handleganttHeaderScroll: React.UIEventHandler<HTMLElement> = (
    scroll
  ) => {
    if (ganttScrollContainer.current) {
      ganttScrollContainer.current.scrollLeft = scroll.currentTarget.scrollLeft;
    }
  };
  const handleResourceScroll: React.UIEventHandler<HTMLElement> = (scroll) => {
    if (ganttScrollContainer.current) {
      ganttScrollContainer.current.scrollTop = scroll.currentTarget.scrollTop;
    }
  };

  const resourceEventsMap = useMemo(() => {
    const out: Record<string, GanttEvent<EventT>[]> = {};

    for (const event of events) {
      for (const resource of event.resources.values()) {
        if (!out[resource]) {
          out[resource] = [];
        }
        out[resource].push(event);
      }
    }

    return out;
  }, [events]);

  const resizeRow = (entry: ResizeObserverEntry) => {
    const resizedId = (entry.target as HTMLElement).getAttribute(
      "data-resource"
    );
    const el = (resourceScrollContainer.current as HTMLElement).querySelector(
      `[data-resource="${resizedId}"]`
    );

    console.log(el);
    console.log(entry.contentRect.height);
    el?.setAttribute("style", `height: ${entry.contentRect.height}px`);
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
        ></Box>
        <Box
          sx={{ width: "8px", background: "#ebebeb", cursor: "ew-resize" }}
        />
        <Box
          onScroll={handleganttHeaderScroll}
          ref={ganttHeaderScrollContainer}
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
              width: ganttWidth,
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
                    height: 40,
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
                height: 40,
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
                  {data.id}
                </Box>
              </Box>
              {/* <Box sx={{ width: 5, background: '#777', cursor: 'ew-resize' }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
                <Box sx={{ padding: 1.5 }}>gantt</Box>
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
          onScroll={handleganttScroll}
          ref={ganttScrollContainer}
          sx={{
            width: "100%",
            height: "100%",
            overflowX: "auto",
            position: "relative",
          }}
        >
          <Box
            sx={{
              width: ganttWidth,
              backgroundImage: `url("data:image/svg+xml;utf8,<svg width='${ganttWidth}' height='100%' xmlns='http://www.w3.org/2000/svg'>${Array.from(
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
            {resources.map((resource) => (
              <TimeRangeRow
                events={resourceEventsMap[resource.id]}
                dateRange={dateRange}
                resource={resource}
                subTick={subTick}
                tickWidthPixels={tickWidthPixels}
                key={resource.id}
                resizeRow={resizeRow}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
