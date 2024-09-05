import React, { useCallback, useMemo, useState } from 'react'
import { Box } from '@mui/material'
import {
  addDays,
  addHours,
  addMonths,
  format,
  startOfDay,
  startOfMonth,
} from 'date-fns'
import { getEvents, resources } from './data'
import { Gantt } from './Gantt'
import { ResizeableEvent } from './ResizeableEvent'

function Resource({ id }) {
  return (
    <Box
      key={id}
      sx={{
        'width': '100%',
        'display': 'flex',
        ':hover': {
          '& > .resource': {
            backgroundColor: 'rgba(0,0,0,.1)',
          },
        },
      }}
    >
      <Box
        className="resource"
        sx={{
          paddingBlock: 1,
          width: '100%',
          alignItems: 'flex-start',
          borderBottom: '2px solid rgba(0,0,0,.2)',
        }}
      >
        <Box
          data-resource={id}
          sx={{
            width: 'max-content',
            height: 45 + 8,
            display: 'flex',
            marginInline: 2,
          }}
        >
          {id}
        </Box>
      </Box>
    </Box>
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
    <ResizeableEvent
      schedulingThreeshold={schedulingThreeshold}
      startDate={startDate}
      endDate={endDate}
      event={event}
      tickWidthPixels={tickWidthPixels}
      id={id}
      dateRange={dateRange}
      updateEvent={updateEvent}
    >
      <Box
        {...rest}
        sx={{
          'display': 'flex',
          'background': 'grey',
          'height': 60,
          ':hover': {
            outline: '2px aqua solid',
          },
          'outline': selected ? '2px red solid' : 'unset',
          'borderRadius': 2,
          ...rest.sx,
        }}
      >
        <Box sx={{ overflow: 'hidden', marginInline: '16px' }}>
          {id}
          {' '}
          -
          {new Date(startDate).toLocaleString()}
        </Box>
      </Box>
    </ResizeableEvent>
  )
}

const MemoEvent = React.memo(Event)

function Placeholder({ width, x, height, level }) {
  console.log(level)
  return (
    <Box
      sx={{
        height: `${height}px`,
        transition: 'left .05s linear',
        background: 'rgba(0, 0, 0, .25)',
        borderRadius: 2,
        gridColumnStart: x + 1,
        gridColumnEnd: x + width + 1,
        gridRowStart: level,
        gridRowEnd: level + 1,
      }}
    />
  )
}

const MemoPlaceholder = React.memo(Placeholder)

function App() {
  const [events, setEvents] = useState(getEvents())

  const handleEventDrop = useCallback((event, resource, dropArea) => {
    setEvents((prev) => {
      let updated = false
      const base = prev.reduce((acc, el) => {
        if (el.id === event.id) {
          if (resource.id === el.resource) {
            updated = true
            return [...acc, { ...event, ...dropArea, resource: resource.id }]
          }
          return [...acc]
        }
        return [...acc, el]
      }, [])
      return [
        base,
        updated ? [] : { ...event, ...dropArea, resource: resource.id },
      ].flat()
    })
  }, [])

  const dateRange = useMemo(
    () => [
      startOfDay(new Date()).valueOf(),
      addDays(startOfDay(new Date()), 5).valueOf(),
    ],
    [],
  )

  const updateEvent = useCallback((event) => {
    setEvents(prev => prev.map(el => el.id === event.id ? event : el))
  }, [])

  return (
    <Box className="App" sx={{ height: '100vh' }}>
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
        slots={{
          Event: MemoEvent,
          Placeholder: MemoPlaceholder,
          Resource: MemoResource,
        }}
      />
    </Box>
  )
}

export default App
