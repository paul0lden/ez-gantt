import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";

import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import { createRoot } from "react-dom/client";
import { getEventType } from "./defaults";

const ExampleEvent = (props) => {
  const {
    startDate,
    endDate,
    dateRange,
    level,
    eventHeight,
    tickWidthPixels,
    id,
  } = props;

  return (
    <Box
      sx={{
        display: "flex",
        background: "grey",
        height: "100%",
        borderRadius: 2,
      }}
    >
      <Box
        data-role="resize-left"
        onPointerDown={(e) => {
          e.preventDefault();
          //isResizing.current = true;
          e.target.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          e.preventDefault();
          //if (isResizing.current) {
          //}
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          //isResizing.current = false;
          e.target.releasePointerCapture(e.pointerId);
        }}
        sx={{ width: 12, cursor: "ew-resize" }}
      />
      <Box sx={{ overflow: "hidden", width: "calc(100% - 24px)" }}>
        {id} - {new Date(startDate).toLocaleString()}
      </Box>
      <Box data-role="resize-right" sx={{ width: 12, cursor: "ew-resize" }} />
    </Box>
  );
};


/**
 * Anything rendered inside of gantt should be movable within it
 * and the position should be calculated for it
 * Everything else belongs to the element logic itself (like rersizing)
 *
 */
export const GanttElementWrapper = (props) => {
  const {
    startDate,
    endDate,
    dateRange,
    level,
    eventHeight,
    tickWidthPixels,
    id,
    rowId,
  } = props;

  const [dragging, setDragging] = useState(false);

  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    return draggable({
      element,
      getInitialData: (e) => {
        const dragDiffX = e.input.clientX - e.element.getBoundingClientRect().x;
        return {
          startDate,
          endDate,
          id,
          rowId,
          dragDiffX,
          width: e.element.getBoundingClientRect().width,
          type: getEventType(),
        };
      },
      getInitialDataForExternal: (e) => {
        const dragDiffX = e.input.clientX - e.element.getBoundingClientRect().x;
        return {
          [getEventType({
            dataType: "json",
            metadata: [
              `${dragDiffX.toString()}`,
              `${e.element.getBoundingClientRect().width}`,
            ],
          })]: JSON.stringify({
            ...event,
            rowId,
          }),
        };
      },
      onDragStart() {
        setDragging(true);
      },
      onDrop() {
        setDragging(false);
      },
      onGenerateDragPreview: ({ source, location, nativeSetDragImage }) => {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: preserveOffsetOnSource({
            element,
            input: location.current.input,
          }),
          render({ container }) {
            const root = createRoot(container);
            root.render(
              <Box
                sx={{
                  height: eventHeight,
                  width:
                    (endDate - dateRange[0] - (startDate - dateRange[0])) /
                    tickWidthPixels,
                }}
              >
                <ExampleEvent
                  startDate={startDate}
                  endDate={endDate}
                  dateRange={dateRange}
                  level={level}
                  id={id}
                  eventHeight={eventHeight}
                  tickWidthPixels={tickWidthPixels}
                />
              </Box>
            );
            return () => root.unmount();
          },
        });
      },
    });
  }, [endDate, startDate, tickWidthPixels]);

  return (
    <Box
      ref={ref}
      sx={
        dragging
          ? { display: "none" }
          : {
              height: "100%",
              overflow: "hidden",
              maxHeight: eventHeight,
              left: `${(startDate - dateRange[0]) / tickWidthPixels}px`,
              width:
                (endDate - dateRange[0] - (startDate - dateRange[0])) /
                tickWidthPixels,
              top: Math.max(level * (eventHeight + 8)),
              position: "absolute",
            }
      }
    >
      <ExampleEvent
        startDate={startDate}
        endDate={endDate}
        dateRange={dateRange}
        i={level}
        id={id}
        eventHeight={eventHeight}
        tickWidthPixels={tickWidthPixels}
      />
    </Box>
  );
};
