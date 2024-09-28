import React from 'react'

function Event(props: any): React.ReactNode {
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

export default React.memo(Event) as typeof Event
