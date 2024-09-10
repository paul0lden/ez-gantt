interface Event {
  startDate: number
  endDate: number
  id: string
}

export function checkLevel(
  entry: Event,
  eventsByLevel: Array<Array<Event>>,
) {
  let level = 0

  while (true) {
    if (!eventsByLevel[level]) {
      return level
    }
    let hasSpace = true
    for (const event of eventsByLevel[level]) {
      if (event.id === entry.id) {
        return level
      }
      if (
        !(event.endDate < entry.startDate
        || event.startDate > entry.endDate)
      ) {
        hasSpace = false
      }
    }
    if (hasSpace)
      return level
    level += 1
  }
}

export function getEventsByLevel(
  events: Event[],
  sortFn: (a: Event, b: Event) => number = (a, b) => a.startDate - b.startDate,
) {
  const eventsByLevel: Array<typeof events> = []

  for (const event of events.sort(sortFn)) {
    const level = checkLevel(event, eventsByLevel)

    if (!eventsByLevel[level])
      eventsByLevel.push([])

    eventsByLevel[level].push(event)
  }

  return eventsByLevel
}
