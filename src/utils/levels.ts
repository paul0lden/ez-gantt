interface Event {
  startDate: number
  endDate: number
  id: string
}

export function checkLevel(
  entry: Event,
  eventsByLevel: Array<Array<Event>>,
): number {
  let level = 0

  while (true) {
    if (!eventsByLevel[level]) {
      return level
    }
    let hasSpace = true
    for (const event of eventsByLevel[level]) {
      if (typeof event.startDate !== 'number') {
        throw new TypeError(`Expected number for event.startDate but got ${typeof event.startDate}`)
      }
      if (typeof event.endDate !== 'number') {
        throw new TypeError(`Expected number for event.endDate but got ${typeof event.endDate}`)
      }
      if (
        (event.startDate < entry.endDate
          && entry.startDate < event.endDate)
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
): Array<Array<Event>> {
  const eventsByLevel: Array<typeof events> = []

  for (const event of events.sort(sortFn)) {
    const level = checkLevel(event, eventsByLevel)

    if (!eventsByLevel[level])
      eventsByLevel.push([])

    eventsByLevel[level].push(event)
  }

  return eventsByLevel
}
