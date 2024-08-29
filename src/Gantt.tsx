import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, useTheme } from "@mui/material";

import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { autoScrollForExternal } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/external";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";

import type { GanttEvent, GanttProps } from "./types";
import { TimeRangeRow } from "./Timerange";
import { generateBackground, levelToDates } from "./helpers";

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
    dateRange: [startDate, endDate],
    slots: { Placeholder, Resource, Event },
    slotsProps,
    setEvenSelection,
    dateViewLevels,
    handleEventDrop,
  } = props;

  const selectRect = useRef<HTMLElement>(null);
  const selectData = useRef<{ startResource: string; startTimestamp: number } | null>(
    null
  );
  const ganttScrollContainer = useRef<HTMLElement>(null);
  const ganttHeaderScrollContainer = useRef<HTMLElement>(null);
  const resourceScrollContainer = useRef<HTMLElement>(null);

  const ganttWidth = (endDate - startDate) / msPerPixel;

  const dateViewLevelsRanges = useMemo(
    () =>
      dateViewLevels.map((level) => levelToDates(level, [startDate, endDate])),
    [dateViewLevels, startDate, endDate]
  );
  const backgroundGrid = useMemo(
    () =>
      generateBackground(
        dateViewLevelsRanges,
        ganttWidth,
        msPerPixel,
        dateViewLevels
      ),
    [dateViewLevels, startDate, endDate]
  );
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

  const selectionGeoSearch = (startResource: string, endResource: string) => {
    const resourcesInSelection = resources.slice(resources.findIndex(el => el.id === startResource), resources.findIndex(el => el.id === endResource))
    console.log(resourcesInSelection);
  }
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
  const resizeRow = (entry: ResizeObserverEntry) => {
    const resizedId = entry.target.getAttribute("data-resource");
    const resourceContainer = resourceScrollContainer.current;

    if (!resourceContainer) return;

    const resourceRow = resourceContainer.querySelector(
      `[data-resource="${resizedId}"]`
    );
    if (!resourceRow) return;
    resourceRow.setAttribute("style", `height: ${entry.contentRect.height}px`);
  };
  const selectionRectStart = (event) => {
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

    selectData.current = {
      startResource: event.target?.getAttribute('data-resource'),
      startTimestamp: startDate + (data.rectStartX * msPerPixel),
    }

    element.onpointermove = (event) => {
      const { clientY, clientX, target } = event;

      console.log(target);

      let el: HTMLElement = target as HTMLElement;
      //
      //while (el && !el.getAttribute('data-resource')) {
      //  console.log(el.getAttribute('data-resource'))
      //  el = el.parentElement as HTMLElement;
      //}
      
      console.log(el.getAttribute('data-resource'))

      if (!ganttScrollContainer.current || !selectRect.current) return;

      const gantt = ganttScrollContainer.current;

      const endX = clientX - gantt.getBoundingClientRect().x + gantt.scrollLeft;
      const endY = clientY - gantt.getBoundingClientRect().y + gantt.scrollTop;

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
  };
  const selectionRectEnd = (event) => {
    if (!selectRect.current || !ganttScrollContainer.current) return;
    ganttScrollContainer.current.onpointermove = null;
    ganttScrollContainer.current.releasePointerCapture(event.pointerId);
    selectRect.current.style.display = "none";
  };

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
            scrollbarWidth: "none",
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
          onPointerDown={selectionRectStart}
          onPointerUp={selectionRectEnd}
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
                setEventSelection={setEvenSelection}
                EventSlot={Event}
                Placeholder={Placeholder}
                events={resourceEventsMap[resource.id] ?? []}
                dateRange={[startDate, endDate]}
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
