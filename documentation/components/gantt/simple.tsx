import {
  addDays,
  addHours,
  addMonths,
  format,
  startOfDay,
  startOfMonth,
} from 'date-fns'
import Gantt from 'ez-gantt'
import React, { useCallback, useState } from 'react'
import { generateGanttData } from './data'

function Resource({ id, name }) {
  return (
    <div className="w-full flex hover:bg-gray-400">
      <div className="py-2 resource w-full items-start border-b-2 border-solid border-gray-500">
        <div className="w-full flex justify-center text-center">
          <p>{name}</p>
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
    resource,
    updateEvent,
    ...rest
  } = props

  return (
    <div
      {...rest}
      className="flex bg-red-800 h-fit hover:outline-2 hover:outline-cyan-100 hover:outline rounded-lg"
    >
      <div className="overflow-hidden mx-4">
        {id}
        {' '}
        -
        {resource}
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
      msPerPixel={30 * 1000}
      schedulingThreeshold={30 * 60 * 1000}
      events={events}
      updateEvent={updateEvent}
      dateViewLevels={[
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
