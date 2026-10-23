type SetupBackState = {
  busy: boolean;
  uploading: boolean;
  datePickerOpen: boolean;
};

export function setupBackAction({ busy, uploading, datePickerOpen }: SetupBackState) {
  if (busy || uploading) return "stay";
  if (datePickerOpen) return "dismiss-date";
  return "exit";
}
