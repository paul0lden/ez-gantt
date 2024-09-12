import { describe, expect, it } from 'vitest'
import { checkLevel, getEventsByLevel } from './levels' // Update the path to your module

// Example Event data
interface Event {
  startDate: number
  endDate: number
  id: string
}

describe('checkLevel', () => {
  it('no events overlap', () => {
    const entry: Event = { startDate: 100, endDate: 200, id: '0' }
    const events: Event[] = []

    const level = checkLevel(entry, getEventsByLevel(events))

    expect(level).toBe(0)
  })

  it('one event overlaps', () => {
    const entry: Event = { startDate: 100, endDate: 200, id: '1' }
    const events: Event[] = [
      { startDate: 50, endDate: 150, id: '0' },
    ]

    const level = checkLevel(entry, getEventsByLevel(events))

    expect(level).toBe(1)
  })

  it('no overlapping events', () => {
    const entry: Event = { startDate: 300, endDate: 400, id: '2' }
    const events: Event[] = [
      { startDate: 100, endDate: 200, id: '0' },
      { startDate: 150, endDate: 250, id: '1' },
    ]

    const level = checkLevel(entry, getEventsByLevel(events))

    expect(level).toBe(0)
  })

  it('multiple events overlap', () => {
    const entry: Event = { startDate: 150, endDate: 250, id: '3' }
    const events: Event[] = [
      { startDate: 50, endDate: 150, id: '0' }, // Level 0
      { startDate: 100, endDate: 200, id: '1' }, // Level 1
      { startDate: 200, endDate: 300, id: '2' }, // Level 0
    ]

    const level = checkLevel(entry, getEventsByLevel(events))

    expect(level).toBe(2)
  })

  // it('one event inside another', () => {
  //  const entry: Event = { startDate: 150, endDate: 250, id: '1' }
  //  const events: Event[] = [
  //    { startDate: 50, endDate: 400, id: '0' }, // Level 0
  //    { startDate: 200, endDate: 220, id: '2' }, // Level 2
  //  ]
  //
  //  const level = checkLevel(entry, getEventsByLevel(events))
  //
  //  expect(level).toBe(1)
  // })
})
