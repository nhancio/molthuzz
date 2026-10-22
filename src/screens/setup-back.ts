type SetupBackState = {
  busy: boolean;
  uploading: boolean;
  datePickerOpen: boolean;
  step: number;
};

export function setupBackAction({ busy, uploading, datePickerOpen, step }: SetupBackState) {
  if (busy || uploading) return "stay";
  if (datePickerOpen) return "dismiss-date";
  return step > 0 ? "previous" : "exit";
}
