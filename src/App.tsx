import React, { useState } from "react";
import { Gantt } from "./Gantt";
import { getEvents, resources } from "./data";
import { Box } from "@mui/material";
import {
  addDays,
  addHours,
  addMonths,
  startOfDay,
  format,
  startOfMonth,
  startOfDecade,
} from "date-fns";
import { Set as ImmutableSet } from "immutable";

const Resource = ({ id }) => {
  return (
    <Box
      key={id}
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
          paddingBlock: 1,
          width: "100%",
          alignItems: "flex-start",
          borderBottom: "2px solid rgba(0,0,0,.2)",
        }}
      >
        <Box
          data-resource={id}
          sx={{
            width: "max-content",
            height: 45 + 8,
            display: "flex",
            marginInline: 2,
          }}
        >
          {id}
        </Box>
      </Box>
    </Box>
  );
};

const Event = (props) => {
  const {
    startDate,
    endDate,
    dateRange,
    level,
    eventHeight,
    tickWidthPixels,
    id,
    ...rest
  } = props;

  return (
    <Box
      {...rest}
      sx={{
        display: "flex",
        background: "grey",
        height: "100%",
        ":hover": {
          outline: "2px aqua solid",
        },
        borderRadius: 2,
        ...rest.sx,
      }}
    >
      <Box
        data-role="resize-left"
        onPointerDown={(e) => {
          e.preventDefault();
          e.target.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          e.preventDefault();
        }}
        onPointerUp={(e) => {
          e.preventDefault();
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

const Placeholder = ({ width, x, level }) => {
  return (
    <Box
      sx={{
        width,
        position: "absolute",
        transition: "left .05s linear",
        top: level * 45 + level * 8 + 8,
        height: 45,
        background: "rgba(0, 0, 0, .25)",
        borderRadius: 2,
        left: x,
      }}
    />
  );
};

function App() {
  const [events, setEvents] = useState(getEvents());

  const handleEventDrop = (event, resource, dropArea) => {
    setEvents((prev) => {
      let updated = false;
      const base = prev.reduce((acc, el) => {
        if (el.id === event.id) {
          if (resource.id === el.resource) {
            updated = true;
            return [...acc, { ...event, ...dropArea, resource: resource.id }];
          }
          return [...acc];
        }
        return [...acc, el];
      }, []);
      return [
        base,
        updated ? [] : { ...event, ...dropArea, resource: resource.id },
      ].flat();
    });
  };

  return (
    <Box className="App" sx={{ height: "100vh" }}>
      <Gantt
        handleEventDrop={handleEventDrop}
        dateRange={[
          startOfDay(startOfDecade(new Date())).valueOf(),
          addDays(startOfDay(new Date()), 5).valueOf(),
        ]}
        msPerPixel={60 * 1000}
        events={events}
        dateViewLevels={[
          {
            getNextTimestamp: (prevRange: number) =>
              addMonths(startOfMonth(prevRange), 1).valueOf(),
            getLabel: (date: Date) => format(date, "LLLL"),
            width: 3,
            color: "rgba(0, 0, 0, .75)",
          },
          {
            getNextTimestamp: (prevRange: number) =>
              addDays(prevRange, 1).valueOf(),
            getLabel: (date: Date) => format(date, "dd E"),
            width: 2,
            color: "rgba(0, 0, 0, .5)",
          },
          {
            getNextTimestamp: (prevRange: number) =>
              addHours(prevRange, 1).valueOf(),
            getLabel: (date: Date) => date.getHours(),
            width: 1,
            color: "rgba(0, 0, 0, .25)",
          },
        ]}
        resources={resources}
        slots={{
          Event: (props) => (
            <Event
              {...props}
              sx={{
                outline: props.selected ? "2px red solid" : "unset",
              }}
            />
          ),
          Placeholder,
          Resource,
        }}
      />
    </Box>
  );
}

export default App;
