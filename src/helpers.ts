const reactRender = (preview: React.ReactNode, container: HTMLElement) => {
  const root = createRoot(container);
  root.render(preview);
  return () => root.unmount();
};
const setDndImage = (preview: React.ReactNode, setDragImage, offset) => {
  const container = document.createElement("div");

  Object.assign(container.style, {
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 2147483647, // max possible
    pointerEvents: "none",
  });

  document.body.append(container);

  const unmount = reactRender(preview, container);

  queueMicrotask(() => {
    const { userAgent } = navigator;
    if (userAgent.includes("AppleWebKit") && !userAgent.includes("Chrome")) {
      const rect = container.getBoundingClientRect();

      if (rect.width === 0) {
        return;
      }

      container.style.left = `-${rect.width - 0.0001}px`;
    }

    setDragImage?.(container, offset.x, offset.y);
  });

  return () => {
    unmount?.();
    document.body.removeChild(container);
  };
};
