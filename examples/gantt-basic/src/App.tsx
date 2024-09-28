import {
  addDays,
  addHours,
  format,
  startOfDay,
} from 'date-fns'
import React, { useCallback, useMemo, useState } from 'react'
import Gantt from '../../../src'
import { getEvents, resources } from './data'
import Event from './GanttEvent'
import Placeholder from './GanttPlaceholder'
import Resource from './GanttResource'

function App(): React.ReactNode {
  const [events, setEvents] = useState(getEvents())

  const handleEventDrop = useCallback((events) => {
    setEvents((prev) => {
      return [
        ...prev.filter(el => !events.find(event => event.id === el.id)),
        ...events,
      ]
    })
  }, [])

  const dateRange = useMemo<[number, number]>(
    () => [
      startOfDay(new Date()).valueOf(),
      addDays(startOfDay(new Date()), 5).valueOf(),
    ],
    [],
  )

  const updateEvent = useCallback((event) => {
    setEvents(prev => prev.map(el => (el.id === event.id ? event : el)))
  }, [])

  return (
    <div className="h-lvh w-full bg-stone-900 flex justify-center items-center">
      <div className="w-3/4 h-3/4 dark:bg-gray-700 dark:text-white border-2 border-solid rounded-2xl overflow-hidden">
        <Gantt
          handleEventDrop={handleEventDrop}
          dateRange={dateRange}
          msPerPixel={30 * 1000}
          schedulingThreeshold={30 * 60 * 1000}
          events={events}
          updateEvent={updateEvent}
          dateViewLevels={[
            {
              getNextTimestamp: (prevRange: number) =>
                addDays(prevRange, 1).valueOf(),
              renderCell: (date: Date) => (
                <div
                className='w-full flex'
                  key={date.toISOString()}
                >
                  {format(date, 'dd E')}
                </div>
              ),
              width: 2,
              color: 'rgba(0, 0, 0, .5)',
            },
            {
              getNextTimestamp: (prevRange: number) =>
                addHours(prevRange, 1).valueOf(),
              renderCell: (date: Date) => (
                <div
                  className='w-full flex'
                  key={date.toISOString()}
                >
                  {format(date, 'hh:mm a')}
                </div>
              ),
              width: 1,
              color: 'rgba(0, 0, 0, .25)',
            },
          ]}
          resources={resources}
          resourceColumnDefaultWidth={200}
          slots={{
            Event,
            Placeholder,
            Resource,
          }}
        />
      </div>
    </div>
  )
}

export default App
