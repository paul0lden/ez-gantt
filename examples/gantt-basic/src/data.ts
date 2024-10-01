import type { GanttEvent, GanttResource } from 'ez-gantt'
import { faker } from '@faker-js/faker'
import { addDays, startOfDay, startOfHour } from 'date-fns'

function getRandomInt(min: number, max: number): number {
  const minCeiled = Math.ceil(min)
  const maxFloored = Math.floor(max)
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled) // The maximum is exclusive and the minimum is inclusive
}

function createRandomResource(): GanttResource<{
  name: string
  email: string
  avatar: string
}> {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
  }
}

export const resources: GanttResource<unknown>[] = faker.helpers.multiple(
  createRandomResource,
  { count: { min: 25, max: 50 } },
)

function getRandomResource(): string {
  return resources[getRandomInt(0, resources.length)].id
}

function createRandomEvent(): GanttEvent<{ name: string }> {
  const duration = faker.number.int({ min: 2, max: 32 }) * 30
  const startDate = startOfHour(
    faker.date.between({
      from: startOfDay(new Date()),
      to: addDays(startOfDay(new Date()), 5),
    }),
  )
  return {
    resource: getRandomResource(),
    endDate: startDate.valueOf() + duration * 60 * 1000,
    startDate: startDate.valueOf(),
    id: faker.string.numeric(6),
    name: faker.hacker.phrase(),
  }
}

export function getEvents(): GanttEvent<unknown>[] {
  return faker.helpers.multiple(createRandomEvent, {
    count: { min: 50, max: 100 },
  })
}
