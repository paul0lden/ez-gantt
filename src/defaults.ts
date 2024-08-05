type getTypeStringArgs = {
  dataType: string;
  metadata: string;
};

export const EVENT_TYPE = "application/vnd.ez-gantt-event";

export const getEventType = (args?: getTypeStringArgs) => {
  const { dataType, metadata } = args ?? {};
  return [EVENT_TYPE, dataType ?? [], metadata ?? []].flat().join("+");
}
