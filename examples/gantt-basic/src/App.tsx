import {
  addDays,
  addHours,
  format,
  getDate,
  getHours,
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
    <div className="h-lvh p-12 w-full dark:bg-stone-900 flex justify-center items-center">
      <div className="w-full h-full bg-zinc-100 dark:bg-zinc-700 dark:text-zinc-200 border-2 border-solid border-zinc-200 dark:border-zinc-400 rounded-2xl overflow-hidden">
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
                  className={[
                    'w-full',
                    'flex',
                    'bg-opacity-30',
                    getDate(date) % 2 === 1 ? 'bg-sky-300 dark:bg-sky-800' : 'bg-violet-300 dark:bg-violet-800',
                  ].join(' ')}
                  key={date.toISOString()}
                >
                  <p className="px-12 py-2 text-lg sticky left-0">
                    {format(date, 'dd eeee')}
                  </p>
                </div>
              ),
              width: 4,
              color: 'rgba(0, 0, 0, .5)',
            },
            {
              getNextTimestamp: (prevRange: number) =>
                addHours(prevRange, 1).valueOf(),
              renderCell: (date: Date) => (
                <div
                  className={[
                    'w-full',
                    'flex',
                    'items-center',
                    'justify-start',
                    'p-2',
                    getDate(date) % 2 === 1
                      ? getHours(date) % 2 === 1
                        ? 'bg-sky-400 dark:bg-sky-950 bg-opacity-40'
                        : 'bg-sky-400 dark:bg-sky-950 bg-opacity-60'
                      : getHours(date) % 2 === 1
                        ? 'bg-violet-400 dark:bg-violet-950 bg-opacity-40'
                        : 'bg-violet-400 dark:bg-violet-950 bg-opacity-60',
                  ].join(' ')}
                  key={date.toISOString()}
                >
                  {format(date, 'hh:mm a')}
                </div>
              ),
              width: 2,
              color: 'rgba(0, 0, 0, .25)',
            },
          ]}
          slotsProps={{
            splitterProps: {
              className: 'bg-zinc-200 dark:bg-zinc-500',
            },
            headerProps: {
              className: 'border-b-4 border-zinc-200 dark:border-zinc-500',
            },
            timerangeProps: {
              className: 'py-2 min-h-12 odd:bg-zinc-500 odd:bg-opacity-30',
            },
            resourceProps: {
              className: 'odd:bg-zinc-500 odd:bg-opacity-30',
            },
            eventProps: {
              className: 'self-baseline',
            },
          }}
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
