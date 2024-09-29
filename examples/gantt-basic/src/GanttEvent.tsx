import { format } from 'date-fns'
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
    eventProps,
  } = props

  const width = (endDate - startDate) / tickWidthPixels

  return (
    <div
      className={[
        'w-full @container bg-white dark:bg-zinc-800 overflow-clip shadob-md justify-between items-center border-2 border-solid border-zinc-200 gap-2 rounded-lg',
        selected ? 'outline-4 bg-cyan-50 outline outline-cyan-400' : 'hover:outline-4 hover:outline-cyan-200 hover:outline',
      ].join(' ')}
    >
      {width > 120
        ? (
            <div className="flex @md:flex-row max-h-72 flex-col gap-2 p-2 justify-between items-center">
              <div className=" sticky left-0 @md:px-2 flex flex-col gap-1">
                <div className="flex flex-col @md:flex-row gap-4">
                  <p className="break-words">
                    ID:
                    {' '}
                    <b className="font-bold">{id}</b>
                  </p>
                  <p className="break-words">{event.name}</p>
                </div>
                <div className="font-bold flex flex-col @md:flex-row gap-1 @md:gap-4">
                  <div>{format(event.startDate, 'dd MMM hh:mm aa')}</div>
                  <div className="hidden @md:">{' - '}</div>
                  <div>{format(event.startDate, 'dd MMM hh:mm aa')}</div>
                </div>
              </div>
            </div>
          )
        : (
            <div className="flex p-2 justify-center items-center">
              <p
                className="overflow-ellipsis whitespace-nowrap truncate w-full break-keep"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                type="button"
              >
                {event.name}
              </p>
            </div>
          )}
    </div>
  )
}

export default React.memo(Event) as typeof Event
