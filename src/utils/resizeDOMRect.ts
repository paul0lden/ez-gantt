export const resizeDOMRect = (
  rect: HTMLElement,
  startPosition: { x: number; y: number },
  endPosition: { x: number; y: number }
) => {
  rect.style.left = `${Math.min(startPosition.x, endPosition.x)}px`;
  rect.style.top = `${Math.min(startPosition.y, endPosition.y)}px`;
  rect.style.width = `${Math.abs(startPosition.x - endPosition.x)}px`;
  rect.style.height = `${Math.abs(startPosition.y - endPosition.y)}px`;
};
