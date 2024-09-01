import type React from "react";
import { useRef } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";

import { useAutoScroll } from "./autoScroll";
import { resizeDOMRect } from "./resizeDOMRect";

const selectionGeoSearch = (startResource: string, endResource: string) => {


  
};

interface SelectionProps {
  gantt: RefObject<HTMLElement>;
  selectionRect: RefObject<HTMLElement>;
  startDate: number;
  msPerPixel: number;
  setSelectedEvents: Dispatch<SetStateAction<string[]>>;
}

export const useSelectionUtils = ({
  gantt,
  selectionRect,
  startDate,
  msPerPixel,
  setSelectedEvents,
}: SelectionProps) => {
  const initialPosition = useRef({ x: 0, y: 0 });
  const selectionData = useRef({
    startResource: null,
    startTimestamp: null,
  });
  const mouse = useRef({
    x: 0,
    y: 0,
  });
  const { stopAutoScroll, startAutoScroll } = useAutoScroll({
    gantt,
    selectionRect,
    mouse,
    initialPosition,
  });

  const selectionRectStart: React.PointerEventHandler<HTMLElement> = (event) => {
    let el: HTMLElement | null = event.target as HTMLElement;

    while (el && el.getAttribute("data-role") !== "gantt") {
      if (el.getAttribute("data-role") === "gantt-event") return;
      el = el.parentElement;
    }

    const element = gantt.current;
    if (!element) return;

    element.setPointerCapture(event.pointerId);
    const { x, y } = element.getBoundingClientRect();
    initialPosition.current = {
      x: event.clientX - x + element.scrollLeft,
      y: event.clientY - y + element.scrollTop,
    };

    selectionData.current = {
      startResource: event.target?.getAttribute("data-resource"),
      startTimestamp: startDate + initialPosition.current.x * msPerPixel,
    };

    element.onpointermove = (event) => {
      const { clientY, clientX } = event;
      event.preventDefault();

      if (!gantt.current || !selectionRect.current || !initialPosition.current)
        return;

      const { x, y } = gantt.current.getBoundingClientRect();
      mouse.current = { x: clientX - x, y: clientY - y };

      startAutoScroll();

      selectionRect.current.style.display = "unset";

      resizeDOMRect(selectionRect.current, initialPosition.current, {
        x: mouse.current.x + gantt.current.scrollLeft,
        y: mouse.current.y + gantt.current.scrollTop,
      });
    };
  };
  const selectionRectEnd: React.PointerEventHandler<HTMLElement> = (event) => {
    if (!selectionRect.current || !gantt.current) return;
    gantt.current.onpointermove = null;
    gantt.current.releasePointerCapture(event.pointerId);
    selectionRect.current.style.display = "none";
    stopAutoScroll();
  };
  return {
    selectionRectStart,
    selectionRectEnd,
  };
};
