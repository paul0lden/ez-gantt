import React, { useEffect, useMemo, useRef, useState } from "react";

import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { autoScrollForExternal } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/external";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";

import type { GanttEvent, GanttProps } from "./types";
import { TimeRangeRow } from "./Timerange";
import { generateBackground, levelToDates } from "./utils/background";
import { useSelectionUtils } from "./utils/selection";
import { syncScroll } from "./utils/scrollSync";

import "./gantt.css";

/**
 * Data driven gantt chart
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
    slotsProps: { placeholderProps, resourceProps, eventProps } = {},
    dateViewLevels,
    handleEventDrop,
    resourceColumnDefaultWidth = 300,
  } = props;

  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const selectionRect = useRef<HTMLDivElement>(null);
  const ganttScrollContainer = useRef<HTMLDivElement>(null);
  const ganttHeaderScrollContainer = useRef<HTMLDivElement>(null);
  const resourceScrollContainer = useRef<HTMLDivElement>(null);

  const ganttWidth = (endDate - startDate) / msPerPixel;
  const { selectionRectEnd, selectionRectStart } = useSelectionUtils({
    gantt: ganttScrollContainer,
    selectionRect,
    startDate,
    msPerPixel,
    setSelectedEvents,
  });

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

  useEffect(() => {
    const element = ganttScrollContainer.current;
    if (
      !element ||
      !ganttHeaderScrollContainer.current ||
      !resourceScrollContainer.current
    )
      return;

    const dateRangeCleanup = syncScroll(
      ganttScrollContainer.current,
      ganttHeaderScrollContainer.current,
      { horizontal: true, vertical: false }
    );
    const resourceCleanUp = syncScroll(
      ganttScrollContainer.current,
      resourceScrollContainer.current,
      { horizontal: false, vertical: true }
    );

    return () => {
      combine(
        autoScrollForExternal({
          element,
          getConfiguration: () => ({ maxScrollSpeed: "fast" }),
        }),
        autoScrollForElements({
          element,
          getConfiguration: () => ({ maxScrollSpeed: "fast" }),
        })
      );
      resourceCleanUp();
      dateRangeCleanup();
    };
  }, []);

  return (
    <div className="gantt-wrapper">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `${resourceColumnDefaultWidth}px 8px auto`,
        }}
      >
        <div></div>
        <div className="splitter" />
        <div className="gantt-header" ref={ganttHeaderScrollContainer}>
          <div
            className="date-area"
            style={{
              width: ganttWidth,
            }}
          >
            {dateViewLevelsRanges.map((level, i) => (
              <div
                key={i}
                className="grid h-full"
                style={{
                  gridTemplateColumns: `${level
                    .map(
                      ({ diff }) =>
                        `${Math.min(ganttWidth, diff / msPerPixel)}px`
                    )
                    .join(" ")}`,
                }}
              >
                {level.map(({ date, getLabel }) => (
                  <div className="date-cell" key={date.toISOString()}>
                    {getLabel(date)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        className="grid overflow-auto"
        style={{
          gridTemplateColumns: `${resourceColumnDefaultWidth}px 8px auto`,
        }}
      >
        <div className="resource-wrapper" ref={resourceScrollContainer}>
          {resources.map((data) => (
            <Resource key={data.id} {...data} />
          ))}
        </div>
        <div className="splitter" />
        <div
          ref={ganttScrollContainer}
          data-role="gantt"
          className="gantt"
          onPointerDown={selectionRectStart}
          onPointerUp={selectionRectEnd}
        >
          <div
            style={{
              width: ganttWidth,
              backgroundRepeat: "no-repeat",
              backgroundImage: backgroundGrid,
            }}
          >
            {resources.map((resource) => (
              <TimeRangeRow
                setSelectedEvents={setSelectedEvents}
                selectedEvents={selectedEvents}
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
          </div>
          <div className="select-rect" ref={selectionRect} />
        </div>
      </div>
    </div>
  );
};
