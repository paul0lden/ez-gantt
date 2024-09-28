import {
  addDays,
  addHours,
  addMonths,
  format,
  startOfDay,
  startOfMonth,
} from 'date-fns'
import 'ez-gantt/dist/index.css'
import Gantt from 'ez-gantt'
import React, { useCallback, useState } from 'react'
import { generateGanttData } from './data'

function Resource({ id }) {
  return (
    <div key={id} className="w-full flex hover:bg-gray-400">
      <div className="py-4 resource w-full items-start border-b-2 border-solid border-green-50">
        <div data-resource={id} className="h-8 w-max flex mx-8">
          {id}
        </div>
      </div>
    </div>
  )
}

const MemoResource = React.memo(Resource)

function Event(props) {
  const {
    startDate,
    endDate,
    dateRange,
    level,
    eventHeight,
    tickWidthPixels,
    schedulingThreeshold,
    id,
    event,
    selected,
    updateEvent,
    ...rest
  } = props

  return (
    <div
      {...rest}
      className="flex bg-cyan-800 h-8 hover:outline-2 hover:outline-cyan-100 hover:outline rounded-s"
    >
      <div className="overflow-hidden mx-4">
        {id}
        {' '}
        -
        {new Date(startDate).toLocaleString()}
      </div>
    </div>
  )
}

const MemoEvent = React.memo(Event)

function Placeholder() {
  return <div className="h-8 bg-green-300 rounded-s" />
}

const MemoPlaceholder = React.memo(Placeholder)

const dateRange: [number, number] = [
  startOfDay(new Date()).valueOf(),
  addDays(startOfDay(new Date()), 5).valueOf(),
]
const data = generateGanttData(dateRange)

function ExampleSimple() {
  const resources = data.resources
  const [events, setEvents] = useState(data.events)

  const handleEventDrop = useCallback((events) => {
    setEvents((prev) => {
      return [
        ...prev.filter(el => !events.find(event => event.id === el.id)),
        ...events,
      ]
    })
  }, [])

  const updateEvent = useCallback((event) => {
    setEvents(prev => prev.map(el => (el.id === event.id ? event : el)))
  }, [])

  return (
    <Gantt
      handleEventDrop={handleEventDrop}
      dateRange={dateRange}
      msPerPixel={60 * 1000}
      schedulingThreeshold={30 * 60 * 1000}
      events={events}
      updateEvent={updateEvent}
      dateViewLevels={[
        {
          getNextTimestamp: (prevRange: number) =>
            addMonths(startOfMonth(prevRange), 1).valueOf(),
          getLabel: (date: Date) => format(date, 'LLLL'),
          width: 3,
          color: 'rgba(0, 0, 0, .75)',
        },
        {
          getNextTimestamp: (prevRange: number) =>
            addDays(prevRange, 1).valueOf(),
          getLabel: (date: Date) => format(date, 'dd E'),
          width: 2,
          color: 'rgba(0, 0, 0, .5)',
        },
        {
          getNextTimestamp: (prevRange: number) =>
            addHours(prevRange, 1).valueOf(),
          getLabel: (date: Date) => date.getHours(),
          width: 1,
          color: 'rgba(0, 0, 0, .25)',
        },
      ]}
      resources={resources}
      resourceColumnDefaultWidth={200}
      slots={{
        Event: MemoEvent,
        Placeholder: MemoPlaceholder,
        Resource: MemoResource,
      }}
    />
  )
}

export default ExampleSimple
