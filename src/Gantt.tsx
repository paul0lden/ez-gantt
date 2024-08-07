import React, { useEffect, useMemo, useRef, useState } from "react";
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
    schedulingThreeshold = 30 * 60 * 1000,
    events,
    resources,
    dateRange,
    slots,
    slotsProps,
    dateViewLevels,
    handleEventDrop,
  } = props;

  const { Resource, Event, Placeholder } = slots;

  const ganttScrollContainer = useRef<HTMLElement>(null);
  const ganttHeaderScrollContainer = useRef<HTMLElement>(null);
  const resourceScrollContainer = useRef<HTMLElement>(null);

  const [selection, setSelection] = useState([]);

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

  const selectRect = useRef<HTMLElement>(null);

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
            overflowX: "scroll",
            overflowY: "scroll",
            scrollbarGutter: "stable",
            "::-webkit-scrollbar": {
              width: "0px",
            },
          }}
        >
          {resources.map((data) => (
            <Resource key={data.id} {...data} />
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
          data-role="gantt"
          sx={{
            width: "100%",
            height: "100%",
            overflowX: "auto",
            position: "relative",
            userSelect: "none",
          }}
          onPointerDown={(event) => {
            let el: HTMLElement | null = event.target as HTMLElement;

            while (el && el.getAttribute("data-role") !== "gantt") {
              if (el.getAttribute("data-role") === "gantt-event") return;
              el = el.parentElement;
            }

            const element = ganttScrollContainer.current;
            if (!element) return;

            element.setPointerCapture(event.pointerId);
            const { x, y } = element.getBoundingClientRect();
            const data = {
              rectStartX: event.clientX - x + element.scrollLeft,
              rectStartY: event.clientY - y + element.scrollTop,
              elementStartX: x - element.scrollLeft,
              elementStartY: y - element.scrollTop,
            };

            element.onpointermove = (event) => {
              const { clientY, clientX } = event;

              if (!ganttScrollContainer.current || !selectRect.current) return;

              const gantt = ganttScrollContainer.current;

              const endX =
                clientX - gantt.getBoundingClientRect().x + gantt.scrollLeft;
              const endY =
                clientY - gantt.getBoundingClientRect().y + gantt.scrollTop;

              selectRect.current.style.display = "unset";

              selectRect.current.style.left = `${Math.min(
                data.rectStartX as number,
                endX
              )}px`;
              selectRect.current.style.top = `${Math.min(
                data.rectStartY as number,
                endY
              )}px`;
              selectRect.current.style.width = `${Math.abs(
                (data.rectStartX as number) - endX
              )}px`;
              selectRect.current.style.height = `${Math.abs(
                (data.rectStartY as number) - endY
              )}px`;
            };
          }}
          onPointerUp={(event) => {
            if (!selectRect.current || !ganttScrollContainer.current) return;
            ganttScrollContainer.current.onpointermove = null;
            ganttScrollContainer.current.releasePointerCapture(event.pointerId);
            selectRect.current.style.display = "none";
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
                EventSlot={Event}
                Placeholder={Placeholder}
                events={resourceEventsMap[resource.id] ?? []}
                dateRange={dateRange}
                resource={resource}
                tickWidthPixels={msPerPixel}
                key={resource.id}
                resizeRow={resizeRow}
                schedulingThreeshold={schedulingThreeshold}
                handleEventDrop={handleEventDrop}
              />
            ))}
          </Box>
          <Box
            ref={selectRect}
            sx={{
              display: "none",
              background: "rgba(125, 125, 255, 0.2)",
              boxSizing: "content-box",
              border: "2px solid aqua",
              position: "absolute",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};
