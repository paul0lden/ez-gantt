import { faker } from '@faker-js/faker'
import { endOfDay, minutesToMilliseconds, startOfDay, startOfHour } from 'date-fns'

export function generateGanttData(dateRange: [number, number]) {
  const duration = faker.number.int({ min: 4, max: 10 }) * 30

  const startDate = startOfHour(
    faker.date.between({
      from: startOfDay(new Date(dateRange[0])),
      to: endOfDay(new Date(dateRange[1])),
    }),
  )
  const resources = [
    {
      name: 'Paul Allen',
      email: 'paul.allen@test.com',
      id: faker.string.uuid(),
    },
    {
      name: 'Patrick Bateman',
      email: 'patrick.bateman@test.com',
      id: faker.string.uuid(),
    },
  ]
  const events = [
    {
      id: 'dorsia-reservation',
      title: 'Dinner at Dorsia - reservation',
      startDate: startDate.valueOf(),
      endDate: startDate.valueOf() + minutesToMilliseconds(duration),
      resource: resources[0].id,
    },
  ]

  return { events, resources }
}
