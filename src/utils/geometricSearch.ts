type Point = [number, number]
type Rect = [Point, Point]

export function rectanglesIntersect(rect1: Rect, rect2: Rect): boolean {
  const [p1, p2] = rect1
  const [p3, p4] = rect2

  const [x1, y1] = [Math.min(p1[0], p2[0]), Math.min(p1[1], p2[1])]
  const [x2, y2] = [Math.max(p1[0], p2[0]), Math.max(p1[1], p2[1])]
  const [x3, y3] = [Math.min(p3[0], p4[0]), Math.min(p3[1], p4[1])]
  const [x4, y4] = [Math.max(p3[0], p4[0]), Math.max(p3[1], p4[1])]

  if (x1 > x4 || x3 > x2) {
    return false
  }
  if (y1 > y4 || y3 > y2) {
    return false
  }

  return true
}

/**
 * Performs geometric search on dom nodes
 * @param {HTMLElement} container Container to search for nodes in
 * @param {HTMLElement} searchNode Rect to perform the search against
 */
export function DOMGeometricSearch(container: HTMLElement, searchNode: HTMLElement) {
  const out: Array<Element> = []
  const selectionRectBox = searchNode.getBoundingClientRect()
  container.querySelectorAll('[data-role="gantt-event"]').forEach((el) => {
    const { x, y, width, height } = el.getBoundingClientRect()
    if (
      rectanglesIntersect(
        [
          [selectionRectBox.x, selectionRectBox.y],
          [
            selectionRectBox.x + selectionRectBox.width,
            selectionRectBox.y + selectionRectBox.height,
          ],
        ],
        [
          [x, y],
          [x + width, y + height],
        ],
      )
    ) {
      out.push(el)
    }
  })

  return out
}
