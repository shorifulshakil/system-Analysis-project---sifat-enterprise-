export const DATA_CHANGE_EVENT = "app-data-change";

export const fireDataChange = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DATA_CHANGE_EVENT));
};

export const addDataChangeListener = (listener: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(DATA_CHANGE_EVENT, listener);
  return () => window.removeEventListener(DATA_CHANGE_EVENT, listener);
};
