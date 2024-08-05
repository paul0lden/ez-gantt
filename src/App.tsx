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
} from "date-fns";

function App() {
  const [events, setEvents] = useState(getEvents());

  const handleEventDrop = (event, resource, dropArea) => {
    console.log(event, resource, new Date(dropArea.startDate));

    setEvents((prev) =>
      [...prev.reduce(
        (acc, el) => [
          ...acc,
          el.id === event.id
            ?  []           : el,
        ].flat(),
        []
      ), { ...event, ...dropArea, resource: resource.id }
]
    );
  };

  return (
    <Box className="App" sx={{ height: "100vh" }}>
      <Gantt
        handleEventDrop={handleEventDrop}
        dateRange={[
          startOfDay(new Date()).valueOf(),
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
      />
    </Box>
  );
}

export default App;
