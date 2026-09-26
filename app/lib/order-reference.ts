// Keep a searchable suffix for display without changing payment identifiers.
export function displayOrderReference(reference: string): string {
  return `mascot-${reference.slice(-10)}`;
}
