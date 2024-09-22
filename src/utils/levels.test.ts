import type { MockedFunction } from 'vitest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkLevel, getEventsByLevel } from './levels'

// Example Event data
interface Event {
  startDate: number
  endDate: number
  id: string
}

describe('checkLevel', () => {
  it('no events overlap', () => {
    const entry: Event = { startDate: 100, endDate: 200, id: '0' }
    const events: Event[][] = []

    const level = checkLevel(entry, events)

    expect(level).toBe(0)
  })

  it('one event overlaps', () => {
    const entry: Event = { startDate: 100, endDate: 200, id: '1' }
    const events: Event[][] = [
      // level 0
      [{ startDate: 50, endDate: 150, id: '0' }],
    ]

    const level = checkLevel(entry, events)

    expect(level).toBe(1)
  })

  it('no overlapping events', () => {
    const entry: Event = { startDate: 300, endDate: 400, id: '2' }
    const events: Event[][] = [
      // level 0
      [
        { startDate: 100, endDate: 200, id: '0' },
        { startDate: 150, endDate: 250, id: '1' },
      ],
    ]

    const level = checkLevel(entry, events)

    expect(level).toBe(0)
  })

  it('multiple events overlap', () => {
    const entry: Event = { startDate: 150, endDate: 250, id: '3' }
    const events: Event[][] = [
      // level 0
      [
        { startDate: 50, endDate: 150, id: '0' },
        { startDate: 200, endDate: 300, id: '2' },
      ],

      // level 1
      [{ startDate: 100, endDate: 200, id: '1' }],
    ]

    const level = checkLevel(entry, events)

    expect(level).toBe(2)
  })

  it('entry has identical start and end dates as an existing event', () => {
    const entry: Event = { startDate: 100, endDate: 200, id: '4' }
    const events: Event[][] = [
      [{ startDate: 100, endDate: 200, id: '0' }],
    ]

    const level = checkLevel(entry, events)

    expect(level).toBe(1)
  })

  it('entry starts when an existing event ends', () => {
    const entry: Event = { startDate: 200, endDate: 300, id: '5' }
    const events: Event[][] = [
      [{ startDate: 100, endDate: 200, id: '0' }],
    ]

    const level = checkLevel(entry, events)

    expect(level).toBe(0)
  })

  it('entry ends when an existing event starts', () => {
    const entry: Event = { startDate: 50, endDate: 100, id: '6' }
    const events: Event[][] = [
      [{ startDate: 100, endDate: 200, id: '0' }],
    ]

    const level = checkLevel(entry, events)

    expect(level).toBe(0)
  })

  it('entry is completely within an existing event', () => {
    const entry: Event = { startDate: 120, endDate: 180, id: '7' }
    const events: Event[][] = [
      [{ startDate: 100, endDate: 200, id: '0' }],
    ]

    const level = checkLevel(entry, events)

    expect(level).toBe(1)
  })

  it('entry completely encompasses an existing event', () => {
    const entry: Event = { startDate: 50, endDate: 250, id: '8' }
    const events: Event[][] = [
      [{ startDate: 100, endDate: 200, id: '0' }],
    ]

    const level = checkLevel(entry, events)

    expect(level).toBe(1)
  })

  it('entry has zero duration and does not overlap', () => {
    const entry: Event = { startDate: 200, endDate: 200, id: '9' }
    const events: Event[][] = [
      [{ startDate: 100, endDate: 200, id: '0' }],
    ]

    const level = checkLevel(entry, events)

    expect(level).toBe(0)
  })

  it('entry has zero duration and overlaps exactly with an existing event', () => {
    const entry: Event = { startDate: 100, endDate: 100, id: '10' }
    const events: Event[][] = [
      [{ startDate: 100, endDate: 200, id: '0' }],
    ]

    const level = checkLevel(entry, events)

    expect(level).toBe(0)
  })

  it('intermediate levels are empty', () => {
    const entry: Event = { startDate: 150, endDate: 250, id: '11' }
    const events: Event[][] = [
      // level 0
      [{ startDate: 100, endDate: 200, id: '0' }],
      // level 1 is empty
      [],
      // level 2
      [{ startDate: 200, endDate: 300, id: '1' }],
    ]

    const level = checkLevel(entry, events)

    expect(level).toBe(1)
  })

  it('entry has negative startDate', () => {
    const entry: Event = { startDate: -100, endDate: 50, id: '12' }
    const events: Event[][] = []

    const level = checkLevel(entry, events)

    expect(level).toBe(0)
  })

  it('entry has non-integer dates', () => {
    const entry: Event = { startDate: 100.5, endDate: 200.5, id: '13' }
    const events: Event[][] = [
      [{ startDate: 150, endDate: 250, id: '0' }],
    ]

    const level = checkLevel(entry, events)

    expect(level).toBe(1)
  })

  it('entry overlaps with many levels', () => {
    const entry: Event = { startDate: 150, endDate: 250, id: '14' }
    const events: Event[][] = [
      [{ startDate: 100, endDate: 200, id: '0' }],
      [{ startDate: 150, endDate: 250, id: '1' }],
      [{ startDate: 200, endDate: 300, id: '2' }],
      [{ startDate: 250, endDate: 350, id: '3' }],
    ]

    const level = checkLevel(entry, events)

    expect(level).toBe(3)
  })

  it('events within levels are unsorted', () => {
    const entry: Event = { startDate: 150, endDate: 250, id: '15' }
    const events: Event[][] = [
      [
        { startDate: 200, endDate: 300, id: '2' },
        { startDate: 100, endDate: 200, id: '0' },
      ],
      [
        { startDate: 150, endDate: 250, id: '1' },
      ],
    ]

    const level = checkLevel(entry, events)

    expect(level).toBe(2)
  })

  it('handles a large number of events', () => {
    const entry: Event = { startDate: 500, endDate: 600, id: '16' }
    const events: Event[][] = []

    for (let i = 0; i < 100; i++) {
      events.push([
        { startDate: 400, endDate: 700, id: `${i}` },
      ])
    }

    const level = checkLevel(entry, events)

    expect(level).toBe(100)
  })
})


describe('getEventsByLevel', () => {

  it('should return an empty array when given an empty events array', () => {
    const events: Event[] = [];
    const result = getEventsByLevel(events);
    expect(result).toEqual([]);
  });

  it('should return one level containing a single event', () => {
    const events: Event[] = [{ startDate: 1, endDate: 2, id: '1' }];
    const result = getEventsByLevel(events);
    expect(result).toEqual([[{ startDate: 1, endDate: 2, id: '1' }]]);
  });

  it('should place all events in the same level when checkLevel returns 0', () => {
    const events: Event[] = [
      { startDate: 1, endDate: 2, id: '1' },
      { startDate: 2, endDate: 3, id: '2' },
      { startDate: 3, endDate: 4, id: '3' },
    ];
    const result = getEventsByLevel(events);
    expect(result).toEqual([
      [
        { startDate: 1, endDate: 2, id: '1' },
        { startDate: 2, endDate: 3, id: '2' },
        { startDate: 3, endDate: 4, id: '3' },
      ],
    ]);
  });

  it('should distribute events across multiple levels based on checkLevel', () => {
    const events: Event[] = [
      { startDate: 1, endDate: 2, id: '1' },
      { startDate: 1, endDate: 2, id: '2' },
      { startDate: 2, endDate: 3, id: '3' },
      { startDate: 2, endDate: 3, id: '4' },
    ];
    const result = getEventsByLevel(events);
    expect(result).toEqual([
      [
        { startDate: 1, endDate: 2, id: '1' },
        { startDate: 2, endDate: 3, id: '3' },
      ],
      [
        { startDate: 1, endDate: 2, id: '2' },
        { startDate: 2, endDate: 3, id: '4' },
      ],
    ]);
  });

  it('should handle events with identical start dates by assigning different levels', () => {
    const events: Event[] = [
      { startDate: 1, endDate: 2, id: '1' },
      { startDate: 1, endDate: 2, id: '2' },
      { startDate: 1, endDate: 2, id: '3' },
    ];
    const result = getEventsByLevel(events);
    expect(result).toEqual([
      [{ startDate: 1, endDate: 2, id: '1' }],
      [{ startDate: 1, endDate: 2, id: '2' }],
      [{ startDate: 1, endDate: 2, id: '3' }],
    ]);
  });

  it('should throw an error when an event has a missing startDate', () => {
    const events: any[] = [
      { endDate: 2, id: '1' },
      { startDate: 1, endDate: 2, id: '2' },
    ];
    expect(() => getEventsByLevel(events)).toThrow();
  });

  it('should use the custom sort function if provided', () => {
    const events: Event[] = [
      { startDate: 3, endDate: 4, id: '3' },
      { startDate: 1, endDate: 2, id: '1' },
      { startDate: 2, endDate: 3, id: '2' },
    ];
    const sortFn = (a: Event, b: Event) => b.startDate - a.startDate;
    const result = getEventsByLevel(events, sortFn);
    expect(result).toEqual([
      [
        { startDate: 3, endDate: 4, id: '3' },
        { startDate: 2, endDate: 3, id: '2' },
        { startDate: 1, endDate: 2, id: '1' },
      ],
    ]);
  });

  it('should throw an error when an event has a non-number startDate', () => {
    const events: any[] = [
      { startDate: 'abc', endDate: 2, id: '1' },
      { startDate: 1, endDate: 2, id: '2' },
    ];
    expect(() => getEventsByLevel(events)).toThrow();
  });

  it('should correctly assign events to levels based on checkLevel', () => {
    const events: Event[] = [
      { startDate: 1, endDate: 2, id: '1' },
      { startDate: 2, endDate: 3, id: '2' },
      { startDate: 1, endDate: 2, id: '3' },
    ];
    const result = getEventsByLevel(events);
    expect(result).toEqual([
      [
        { startDate: 1, endDate: 2, id: '1' },
        { startDate: 2, endDate: 3, id: '2' },
      ],
      [{ startDate: 1, endDate: 2, id: '3' }],
    ]);
  });
});
