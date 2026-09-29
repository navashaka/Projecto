export const formatPayrollAmount = (
  value: number | null | undefined,
): string => {
  const amount = Number(value ?? 0)

  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export const formatPayrollCurrency = (
  value: number | null | undefined,
): string => {
  return `₹${formatPayrollAmount(value)}`
}