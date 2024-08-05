import React, { useEffect, useMemo, useRef } from "react";
import { Box, useTheme } from "@mui/material";

import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { autoScrollForExternal } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/external";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";

import type { GanttEvent, GanttProps } from "./types";
import { TimeRangeRow } from "./Timerange";

/**
 * Data driven gantt chart based on MUI
 */
export const Gantt = <EventT, ResourceT>(
  props: GanttProps<EventT, ResourceT>
) => {
  const {
    msPerPixel = 30 * 1000,
    events,
    resources,
    dateRange,
    slots,
    slotsProps,
    dateViewLevels,
    handleEventDrop,
  } = props;

  const ganttScrollContainer = useRef<HTMLElement>(null);
  const ganttHeaderScrollContainer = useRef<HTMLElement>(null);
  const resourceScrollContainer = useRef<HTMLElement>(null);

  const [startDate, endDate] = dateRange;
  const levelToDates = (
    level: {
      getNextTimestamp: (prev: number) => number;
      getLabel: (date: Date) => any;
    },
    [startDate, endDate]: [number, number]
  ) => {
    let stamp = startDate;
    const out = [stamp];
    const diffs: number[] = [];

    while (level.getNextTimestamp(stamp) < endDate) {
      const current = Math.min(endDate, level.getNextTimestamp(stamp));
      diffs.push(current - stamp);
      out.push(current);
      stamp = current;
    }

    diffs.push(
      Math.min(
        out[out.length - 1] - out[out.length - 2],
        endDate - out[out.length - 1]
      )
    );

    return out.map((timestamp, i) => ({
      date: new Date(timestamp),
      getLabel: level.getLabel,
      diff: diffs[i],
    }));
  };
  const dateViewLevelsRanges = dateViewLevels.map((level) =>
    levelToDates(level, dateRange)
  );
  const ganttWidth = (endDate - startDate) / msPerPixel;

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
      if (!out[event.resource]) {
        out[event.resource] = [];
      }
      out[event.resource].push(event);
    }

    return out;
  }, [events]);

  const resizeRow = (entry: ResizeObserverEntry) => {
    queueMicrotask(() => {
      const resizedId = (entry.target as HTMLElement).getAttribute(
        "data-resource"
      );
      const el = (resourceScrollContainer.current as HTMLElement).querySelector(
        `[data-resource="${resizedId}"]`
      );
      el?.setAttribute("style", `height: ${entry.contentRect.height}px`);
    });
  };

  const theme = useTheme();

  const drawLines = (level, color, width, msPerPixel, limit) => {
    let prevSize = 0;

    const outSizes = [];

    for (const { diff } of level) {
      prevSize += diff / msPerPixel;
      if (prevSize !== limit) {
        outSizes.push(prevSize);
      }
    }

    return outSizes.map(
      (size) =>
        `<line x1='${size}' y1='0' x2='${size}' y2='100%' stroke='${color}' stroke-width='${width}' />`
    );
  };

  const backgroundGrid = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${ganttWidth}' height='100%'>${dateViewLevelsRanges
    .flatMap((level, i) =>
      drawLines(
        level,
        dateViewLevels[i].color,
        dateViewLevels[i].width,
        msPerPixel,
        ganttWidth
      ).join("")
    )
    .join("")}</svg>")`;

  useEffect(() => {
    const element = ganttScrollContainer.current;

    if (!element) return;

    return combine(
      autoScrollForExternal({
        element,
      }),
      autoScrollForElements({
        element,
      })
    );
  }, []);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexFlow: "column",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "300px 8px auto",
          background: "#fafafa",
          borderTop: `2px solid ${theme.palette.grey[400]}`,
          boxShadow: "0 4px 8px -2px rgba(0,0,0,.15)",
        }}
      >
        <Box
          sx={{
            padding: 1,
          }}
        ></Box>
        <Box sx={{ background: "#ebebeb", cursor: "ew-resize" }} />
        <Box
          onScroll={handleganttHeaderScroll}
          ref={ganttHeaderScrollContainer}
          sx={{
            width: "100%",
            overflowX: "scroll",
            overflowY: "scroll",
            scrollbarHeight: "none",
            msOverflowStyle: "none",
            "::-webkit-scrollbar": {
              height: "none",
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
            {dateViewLevelsRanges.map((level, i) => (
              <Box
                key={i}
                sx={{
                  height: 1,
                  display: "grid",
                  gridTemplateColumns: `${level
                    .map(
                      ({ diff }) =>
                        `${Math.min(ganttWidth, diff / msPerPixel)}px`
                    )
                    .join(" ")}`,
                }}
              >
                {level.map(({ date, getLabel }) => (
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
                    {getLabel(date)}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "300px 8px auto",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <Box
          onScroll={handleResourceScroll}
          ref={resourceScrollContainer}
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "300px",
            height: "100%",
            overflow: "scroll",
            overflowX: "scroll",
            overflowY: "scroll",
            scrollbarWidth: "none",
            msOverflowStyle: "0px",
            "::-webkit-scrollbar": {
              width: "none",
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
            </Box>
          ))}
        </Box>
        <Box
          sx={{
            width: "8px",
            background: "#ebebeb",
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
              backgroundRepeat: "no-repeat",
              backgroundImage: backgroundGrid,
            }}
          >
            {resources.map((resource) => (
              <TimeRangeRow
                events={resourceEventsMap[resource.id] ?? []}
                dateRange={dateRange}
                resource={resource}
                tickWidthPixels={msPerPixel}
                key={resource.id}
                resizeRow={resizeRow}
                handleEventDrop={handleEventDrop}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
