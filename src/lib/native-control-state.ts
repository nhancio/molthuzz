/** Return a canonical change only when an enabled native control changes selection. */
export function nativeSelectionChange({
  values,
  selected,
  value,
  multiple,
  checked = true,
  disabled = false,
  maxSelected,
}: {
  values: readonly string[];
  selected: readonly string[];
  value: string;
  multiple: boolean;
  checked?: boolean;
  disabled?: boolean;
  maxSelected?: number;
}): string[] | null {
  if (disabled || !values.includes(value)) return null;
  if (!multiple)
    return selected.length === 1 && selected[0] === value ? null : [value];
  const present = selected.includes(value);
  if (
    checked &&
    !present &&
    maxSelected != null &&
    selected.length >= maxSelected
  )
    return null;
  if (present === checked) return null;
  return checked
    ? [...selected, value]
    : selected.filter((item) => item !== value);
}
