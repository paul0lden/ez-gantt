import type { MutableRefObject } from 'react'
import type { GanttEvent, GanttResource } from '../types'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { findDistance, useMoveEventDnD } from './moveDnD'

describe('findDistance', () => {
  const resources: GanttResource<object>[] = [
    { id: 'A' },
    { id: 'B' },
    { id: 'C' },
    { id: 'D' },
  ]

  it('should return the correct resource when moving forward', () => {
    const result = findDistance(resources, 'A', 'B', 'C')
    expect(result).toBe('D')
  })

  it('should return the correct resource when moving backward', () => {
    const result = findDistance(resources, 'D', 'C', 'B')
    expect(result).toBe('A')
  })

  it('should handle out-of-bounds indices (upper limit)', () => {
    const result = findDistance(resources, 'C', 'D', 'D')
    expect(result).toBe('D')
  })

  it('should handle out-of-bounds indices (lower limit)', () => {
    const result = findDistance(resources, 'B', 'A', 'A')
    expect(result).toBe('A')
  })
})

describe('useMoveEventDnD', () => {
  let handleEventDropMock: jest.Mock
  let selectedEventsRef: MutableRefObject<Array<unknown>>
  const resources: GanttResource<object>[] = [
    { id: 'resource1' },
    { id: 'resource2' },
    { id: 'resource3' },
  ]
  const dateRange: [number, number] = [0, 1000000]
  const msPerPixel = 10
  const threeshold = 100
  const gridLayout = true
  const dropResolutionMode = 'single-resource' as const

  beforeEach(() => {
    handleEventDropMock = vi.fn()
    selectedEventsRef = { current: [] }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty placeholders', () => {
    const { result } = renderHook(() =>
      useMoveEventDnD({
        gridLayout,
        threeshold,
        msPerPixel,
        dateRange,
        handleEventDrop: handleEventDropMock,
        resources,
        dropResolutionMode,
        selectedEventsRef,
      }),
    )
    expect(result.current.placeholders).toEqual([])
  })

  it('should update placeholders on drag', () => {
    const { result } = renderHook(() =>
      useMoveEventDnD({
        gridLayout,
        threeshold,
        msPerPixel,
        dateRange,
        handleEventDrop: handleEventDropMock,
        resources,
        dropResolutionMode,
        selectedEventsRef,
      }),
    )

    const mockSource = {
      data: {
        events: [
          {
            dragDiffX: 10,
            width: 100,
            id: 'event1',
            height: 20,
            resource: 'resource1',
          },
        ],
        initialResource: 'resource1',
      },
    }

    const mockLocation = {
      current: {
        input: { clientX: 150 },
        dropTargets: [
          {
            data: { location: 'row', x: 100, id: 'resource2' },
          },
        ],
      },
    }

    act(() => {
      result.current.dragHandler({ source: mockSource, location: mockLocation })
    })

    expect(result.current.placeholders).toHaveLength(1)
    const placeholder = result.current.placeholders[0]

    expect(placeholder.id).toBe('event1')
    expect(placeholder.startDate).toBeGreaterThan(0)
    expect(placeholder.endDate).toBeGreaterThan(placeholder.startDate)
    expect(placeholder.placeholder).toBe(true)
    expect(placeholder.height).toBe(20)
    expect(placeholder.resource).toBe('resource2')
  })

  it('should handle drop correctly', () => {
    const { result } = renderHook(() =>
      useMoveEventDnD({
        gridLayout,
        threeshold,
        msPerPixel,
        dateRange,
        handleEventDrop: handleEventDropMock,
        resources,
        dropResolutionMode,
        selectedEventsRef,
      }),
    )

    const mockSource = {
      data: {
        events: [
          {
            dragDiffX: 10,
            width: 100,
            id: 'event1',
            height: 20,
            resource: 'resource1',
          },
        ],
        initialResource: 'resource1',
      },
    }

    const mockLocation = {
      current: {
        input: { clientX: 150 },
        dropTargets: [
          {
            data: { location: 'row', x: 100, id: 'resource2' },
          },
        ],
      },
    }

    act(() => {
      result.current.dropHandler({ source: mockSource, location: mockLocation })
    })

    expect(selectedEventsRef.current).toHaveLength(1)
    const updatedEvent = selectedEventsRef.current[0] as GanttEvent<unknown>

    expect(updatedEvent.id).toBe('event1')
    expect(updatedEvent.startDate).toBeGreaterThan(0)
    expect(updatedEvent.endDate).toBeGreaterThan(updatedEvent.startDate)
    expect(updatedEvent.height).toBe(20)
    expect(updatedEvent.resource).toBe('resource2')

    expect(result.current.placeholders).toEqual([])
    expect(handleEventDropMock).toHaveBeenCalledWith(selectedEventsRef.current)
  })

  it('should not update placeholders if events are missing', () => {
    const { result } = renderHook(() =>
      useMoveEventDnD({
        gridLayout,
        threeshold,
        msPerPixel,
        dateRange,
        handleEventDrop: handleEventDropMock,
        resources,
        dropResolutionMode,
        selectedEventsRef,
      }),
    )

    const mockSource = {
      data: {
        events: null,
        initialResource: 'resource1',
      },
    }

    const mockLocation = {
      current: {
        input: { clientX: 150 },
        dropTargets: [],
      },
    }

    act(() => {
      result.current.dragHandler({ source: mockSource, location: mockLocation })
    })

    expect(result.current.placeholders).toEqual([])
  })

  it('should handle multiple events on drag', () => {
    const { result } = renderHook(() =>
      useMoveEventDnD({
        gridLayout: false,
        threeshold,
        msPerPixel,
        dateRange,
        handleEventDrop: handleEventDropMock,
        resources,
        dropResolutionMode: 'multi-resource',
        selectedEventsRef,
      }),
    )

    const mockSource = {
      data: {
        events: [
          {
            dragDiffX: 10,
            width: 100,
            id: 'event1',
            height: 20,
            resource: 'resource1',
          },
          {
            dragDiffX: 5,
            width: 80,
            id: 'event2',
            height: 15,
            resource: 'resource2',
          },
        ],
        initialResource: 'resource1',
      },
    }

    const mockLocation = {
      current: {
        input: { clientX: 200 },
        dropTargets: [
          {
            data: { location: 'row', x: 150, id: 'resource3' },
          },
        ],
      },
    }

    act(() => {
      result.current.dragHandler({ source: mockSource, location: mockLocation })
    })

    expect(result.current.placeholders).toHaveLength(2)

    const placeholder1 = result.current.placeholders[0]
    const placeholder2 = result.current.placeholders[1]

    expect(placeholder1.id).toBe('event1')
    expect(placeholder1.resource).toBe('resource3')

    expect(placeholder2.id).toBe('event2')
    expect(placeholder2.resource).toBe('resource3')
  })

  it('should handle drop with different grid layouts', () => {
    const { result } = renderHook(() =>
      useMoveEventDnD({
        gridLayout: false,
        threeshold,
        msPerPixel,
        dateRange,
        handleEventDrop: handleEventDropMock,
        resources,
        dropResolutionMode,
        selectedEventsRef,
      }),
    )

    const mockSource = {
      data: {
        events: [
          {
            dragDiffX: 10,
            width: 100,
            id: 'event1',
            height: 20,
            resource: 'resource1',
          },
        ],
        initialResource: 'resource1',
      },
    }

    const mockLocation = {
      current: {
        input: { clientX: 200 },
        dropTargets: [
          {
            data: { location: 'row', x: 150, id: 'resource2' },
          },
        ],
      },
    }

    act(() => {
      result.current.dropHandler({ source: mockSource, location: mockLocation })
    })

    const updatedEvent = selectedEventsRef.current[0] as GanttEvent<unknown>

    expect(updatedEvent.startDate).toBe(400)
  })

  it('should not call handleEventDrop if events are missing on drop', () => {
    const { result } = renderHook(() =>
      useMoveEventDnD({
        gridLayout,
        threeshold,
        msPerPixel,
        dateRange,
        handleEventDrop: handleEventDropMock,
        resources,
        dropResolutionMode,
        selectedEventsRef,
      }),
    )

    const mockSource = {
      data: {
        events: null,
        initialResource: 'resource1',
      },
    }

    const mockLocation = {
      current: {
        input: { clientX: 150 },
        dropTargets: [],
      },
    }

    act(() => {
      result.current.dropHandler({ source: mockSource, location: mockLocation })
    })

    expect(handleEventDropMock).not.toHaveBeenCalled()
    expect(selectedEventsRef.current).toEqual([])
  })

  it('should handle drop when dropTargets are missing', () => {
    const { result } = renderHook(() =>
      useMoveEventDnD({
        gridLayout,
        threeshold,
        msPerPixel,
        dateRange,
        handleEventDrop: handleEventDropMock,
        resources,
        dropResolutionMode,
        selectedEventsRef,
      }),
    )

    const mockSource = {
      data: {
        events: [
          {
            dragDiffX: 10,
            width: 100,
            id: 'event1',
            height: 20,
            resource: 'resource1',
          },
        ],
        initialResource: 'resource1',
      },
    }

    const mockLocation = {
      current: {
        input: { clientX: 150 },
        dropTargets: [],
      },
    }

    act(() => {
      result.current.dropHandler({ source: mockSource, location: mockLocation })
    })

    expect(handleEventDropMock).not.toHaveBeenCalled()
    expect(selectedEventsRef.current).toEqual([])
  })
})
