function drawLines(
  timeSegments: { diff: number }[],
  color: string,
  strokeWidth: number,
  msPerPixel: number,
  timeRangeWidth: number,
): string[] {
  let currentPosition = 0
  const lines = []

  for (const { diff } of timeSegments) {
    currentPosition += diff / msPerPixel
    if (currentPosition < timeRangeWidth) {
      lines.push(
        `<line x1='${currentPosition}' y1='0' x2='${currentPosition}' y2='100%' stroke='${color}' stroke-width='${strokeWidth}' />`,
      )
    }
    else {
      break
    }
  }

  return lines
}

type LevelSettings = { color: string, width: number }

export function generateBackground(
  timeLevels: Array<Array<{ diff: number }>>,
  timeRangeWidth: number,
  msPerPixel: number,
  levelSettings: Array<LevelSettings>,
): string {
  return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${timeRangeWidth}' height='100%'>${timeLevels
    .flatMap((timeLevel, i) =>
      drawLines(
        timeLevel,
        levelSettings[i].color,
        levelSettings[i].width,
        msPerPixel,
        timeRangeWidth,
      ).join(''),
    )
    .join('')}</svg>")`
}

export function levelToDates(level: {
  getNextTimestamp: (prev: number) => number
  renderCell: (date: Date) => React.ReactNode
}, [startDate, endDate]: [number, number]): Array<{
    date: Date
    renderCell: (date: Date) => React.ReactNode
    diff: number
  }> {
  let stamp = startDate
  const out = [stamp]
  const diffs: number[] = []

  while (level.getNextTimestamp(stamp) < endDate) {
    const current = Math.min(endDate, level.getNextTimestamp(stamp))
    diffs.push(current - stamp)
    out.push(current)
    stamp = current
  }

  diffs.push(
    Math.min(
      out[out.length - 1] - out[out.length - 2],
      endDate - out[out.length - 1],
    ),
  )

  return out.map((timestamp, i) => ({
    date: new Date(timestamp),
    renderCell: level.renderCell,
    diff: diffs[i],
  }))
}
