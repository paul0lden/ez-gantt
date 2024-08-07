import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import type { TimeRangeProps } from "./types";
import { GanttElementWrapper } from "./Event";
import { dropTargetForExternal } from "@atlaskit/pragmatic-drag-and-drop/external/adapter";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { getEventType } from "./defaults";

export const TimeRangeRow = <EventT, ResourceT>(
  props: TimeRangeProps<EventT, ResourceT>
) => {
  const {
    EventSlot,
    Placeholder,
    resource,
    events,
    dateRange: [startDate],
    tickWidthPixels,
    handleEventDrop,
    resizeRow,
    schedulingThreeshold,
  } = props;
  const sortedEvents = events;

  // store temporary resize event to display the preview
  // before submiting final ressult to the client
  const [placeholderPos, setPlaceholderPos] = useState<{
    width: number;
    x: number;
    level: number;
  } | null>(null);

  const eventsByLevel: Array<typeof sortedEvents> = [];

  const checkLevel = (entry, eventsByLevel, msPerPx = 1) => {
    let level = 0;

    while (true) {
      if (!eventsByLevel[level]) {
        return level;
      } else if (
        !eventsByLevel[level].find(
          (el) =>
            (entry.endDate / msPerPx > el.startDate / msPerPx &&
              entry.startDate / msPerPx < el.endDate / msPerPx) ||
            (el.endDate / msPerPx > entry.startDate / msPerPx &&
              el.startDate / msPerPx < entry.endDate / msPerPx)
        )
      ) {
        return level;
      }
      level += 1;
    }
  };
  for (const event of sortedEvents) {
    const level = checkLevel(event, eventsByLevel);

    if (!eventsByLevel[level]) eventsByLevel.push([]);

    eventsByLevel[level].push(event);
  }

  const rowRef = useRef<HTMLElement>(null);

  const eventHeight = 45;
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      resizeRow(entry);
    }
  });

  const drawPlaceholder = (rowRelativeX: number, width: number, id: string) => {
    const roundValue =
      Math.round(rowRelativeX / (schedulingThreeshold / tickWidthPixels)) *
      (schedulingThreeshold / tickWidthPixels);

    const level = checkLevel(
      {
        startDate: startDate + roundValue * tickWidthPixels,
        endDate:
          startDate + roundValue * tickWidthPixels + width * tickWidthPixels,
      },
      eventsByLevel.map((subArray) =>
        subArray.reduce(
          (acc, el) => [...acc, el.id === id ? [] : el].flat(),
          []
        )
      ),
      tickWidthPixels
    );

    if (placeholderPos?.x !== roundValue || placeholderPos?.level !== level) {
      setPlaceholderPos({
        width,
        x: roundValue,
        level,
      });
    }
  };

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
  useEffect(() => {
    const element = rowRef.current;

    if (!element) return;

    return combine(
      dropTargetForExternal({
        element,
        getData({ element }) {
          return {
            x: element.getBoundingClientRect().x,
            location: "row",
          };
        },
        canDrop: ({ source }) =>
          !!source.types.find((el) => el.includes(getEventType())),
        onDragLeave() {
          setPlaceholderPos(null);
        },
        onDrag({ location, source }) {
          const {
            current: { input, dropTargets },
          } = location;
          const type = source.types.find((el) => el.includes(getEventType()));
          const target = dropTargets.find((el) => el.data.location === "row");

          if (type && target) {
            const diffX = Number(type.split("+")?.[2]);
            if (!diffX || Number.isNaN(diffX)) return;

            const width = Number(type.split("+")?.[3]);
            if (!width || Number.isNaN(width)) return;

            const data: { x?: number } = target.data;
            if (!data.x) return;

            drawPlaceholder(input.clientX - diffX - data.x, width);
          }
        },
        onDrop({ source, location }) {
          setPlaceholderPos(null);
        },
      }),
      dropTargetForElements({
        element,
        getData({ element }) {
          return {
            x: element.getBoundingClientRect().x,
            location: "row",
            ...resource,
          };
        },
        onDragLeave() {
          setPlaceholderPos(null);
        },
        onDrop({ source, location }) {
          const {
            current: { input, dropTargets },
          } = location;
          const { dragDiffX, width, id } = source.data;
          const target = dropTargets.find((el) => el.data.location === "row");

          if (!dragDiffX || !width || !target) return;

          const roundValue =
            Math.round(
              (input.clientX - target.data.x - dragDiffX) /
                (schedulingThreeshold / tickWidthPixels)
            ) *
            (schedulingThreeshold / tickWidthPixels);

          const start = startDate + roundValue * tickWidthPixels;
          const end = start + width * tickWidthPixels;

          handleEventDrop(source.data, location.current.dropTargets[0].data, {
            startDate: start,
            endDate: end,
          });
          setPlaceholderPos(null);
        },
        onDrag({ location, source }) {
          const {
            current: { input, dropTargets },
          } = location;
          const { dragDiffX, width, id } = source.data;

          const target = dropTargets.find((el) => el.data.location === "row");

          if (!dragDiffX || !width || !target) return;

          drawPlaceholder(input.clientX - target.data.x - dragDiffX, width, id);
        },
      })
    );
  }, [placeholderPos, tickWidthPixels, startDate]);

  return (
    <Box
      ref={rowRef}
      sx={{
        width: "100%",
        display: "flex",
        overflow: "hidden",
        height:
          Math.max(
            placeholderPos?.level ? placeholderPos.level + 1 : 0,
            eventsByLevel.length
          ) *
            eventHeight +
          Math.max(
            placeholderPos?.level ? placeholderPos.level : 0,
            eventsByLevel.length - 1
          ) *
            8,
        transition: 'height 0.1s linear',
        minHeight: eventHeight,
        position: "relative",
        boxSizing: "content-box",
        paddingBlock: 1,
        borderBottom: "2px solid rgba(0,0,0,.2)",
      }}
      data-resource={resource.id}
    >
      {eventsByLevel.flatMap(
        (level, i) =>
          level?.flatMap((event) =>
            event ? (
              <GanttElementWrapper
                {...event}
                EventSlot={EventSlot}
                dateRange={[startDate]}
                level={i}
                rowId={resource.id}
                eventHeight={eventHeight}
                tickWidthPixels={tickWidthPixels}
                key={event.id}
              />
            ) : (
              ""
            )
          ) ?? []
      )}
      {placeholderPos && (
       <Placeholder {...placeholderPos} />
      )}
    </Box>
  );
};
