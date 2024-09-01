import type { ReactEventHandler} from "react";
import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";

import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import { createRoot } from "react-dom/client";
import { getEventType } from "./defaults";

/**
 * Anything rendered inside of gantt should be movable within it
 * and the position should be calculated for it
 * Everything else belongs to the element logic itself (like rersizing)
 *
 */
export const GanttElementWrapper = (props: { onClick: ReactEventHandler<PointerEvent>}) => {
  const {
    onClick,
    EventSlot,
    eventProps,
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
                <EventSlot
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

  if (dragging) return null;

  return (
    <Box
      data-role="gantt-event"
      ref={ref}
      onClick={onClick}
      sx={{
        height: "100%",
        zIndex: 10,
        cursor: "pointer",
        maxHeight: eventHeight,
        left: `${(startDate - dateRange[0]) / tickWidthPixels}px`,
        width:
          (endDate - dateRange[0] - (startDate - dateRange[0])) /
          tickWidthPixels,
        top: Math.max(level * (eventHeight + 8)) + 8,
        position: "absolute",
      }}
    >
      <EventSlot
        startDate={startDate}
        endDate={endDate}
        dateRange={dateRange}
        i={level}
        id={id}
        eventHeight={eventHeight}
        tickWidthPixels={tickWidthPixels}
        {...eventProps}
      />
    </Box>
  );
};
