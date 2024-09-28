function drawLines(
  level: { diff: number }[],
  color: string,
  width: number,
  msPerPixel: number,
  limit: number,
): string[] {
  let prevSize = 0

  const outSizes = []

  for (const { diff } of level) {
    prevSize += diff / msPerPixel
    if (prevSize !== limit) {
      outSizes.push(prevSize)
    }
  }

  return outSizes.map(
    size =>
      `<line x1='${size}' y1='0' x2='${size}' y2='100%' stroke='${color}' stroke-width='${width}' />`,
  )
}

export function generateBackground(
  levels: Array<Array<{ diff: number }>>,
  limit: number,
  msPerPixel: number,
  settings: any,
): string {
  return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${limit}' height='100%'>${levels
    .flatMap((level, i) =>
      drawLines(
        level,
        settings[i].color,
        settings[i].width,
        msPerPixel,
        limit,
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
