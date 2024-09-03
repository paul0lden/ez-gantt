export function checkLevel(entry, eventsByLevel, msPerPx = 1) {
  let level = 0

  while (true) {
    if (!eventsByLevel[level]) {
      return level
    }
    else if (
      !eventsByLevel[level].find(
        el =>
          (entry.endDate / msPerPx > el.startDate / msPerPx
          && entry.startDate / msPerPx < el.endDate / msPerPx)
          || (el.endDate / msPerPx > entry.startDate / msPerPx
          && el.startDate / msPerPx < entry.endDate / msPerPx),
      )
    ) {
      return level
    }
    level += 1
  }
}

export function getEventsByLevel(events) {
  const eventsByLevel: Array<typeof events> = []

  for (const event of events) {
    const level = checkLevel(event, eventsByLevel)

    if (!eventsByLevel[level])
      eventsByLevel.push([])

    eventsByLevel[level].push(event)
  }

  return eventsByLevel
}
