import React from "react";
import { addDays, startOfDay } from "date-fns";
import { Gantt } from "./Gantt";
import { events, resources } from "./data";

function App() {
  return (
    <div className="App">
      <Gantt
        dateRange={[
          startOfDay(new Date()).valueOf(),
          addDays(startOfDay(new Date()), 5).valueOf(),
        ]}
        events={events}
        resources={resources}
      />
    </div>
  );
}

export default App;
