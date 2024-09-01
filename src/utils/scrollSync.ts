import { debounceRAF } from "./debounce";

export const syncScroll = (
  element1: HTMLElement,
  element2: HTMLElement,
  { vertical = true, horizontal = true } = {}
) => {
  const scrollHandler1 = debounceRAF(() => {
    if (horizontal) {
      element2.scrollLeft = element1.scrollLeft;
    }
    if (vertical) {
      element2.scrollTop = element1.scrollTop;
    }
  });
  const scrollHandler2 = debounceRAF(() => {
    if (vertical) {
      element1.scrollTop = element2.scrollTop;
    }
    if (horizontal) {
      element1.scrollLeft = element2.scrollLeft;
    }
  });
  element1.addEventListener("scroll", scrollHandler1);
  element2.addEventListener("scroll", scrollHandler2);

  return () => {
    element1.removeEventListener("scroll", scrollHandler1);
    element2.removeEventListener("scroll", scrollHandler2);
  };
};
