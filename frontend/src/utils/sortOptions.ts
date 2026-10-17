export function sortOptionsByLabel<T>(
  options: readonly T[],
  getLabel: (option: T) => string,
): T[] {
  return [...options].sort((left, right) =>
    getLabel(left).localeCompare(getLabel(right), undefined, {
      numeric: true,
      sensitivity: 'base',
    }),
  )
}
