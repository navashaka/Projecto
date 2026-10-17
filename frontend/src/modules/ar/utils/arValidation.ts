const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const phonePattern = /^[0-9]{10}$/
const accountNumberPattern = /^[0-9]{1,50}$/
const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/

export function normalizeARValue(fieldName: string, value: string): string {
  const normalizedField = fieldName.toLowerCase()
  if (
    normalizedField === 'pan' ||
    normalizedField.endsWith('_pan') ||
    normalizedField === 'ifsc' ||
    normalizedField.endsWith('_ifsc')
  ) {
    return value.trim().toUpperCase()
  }
  if (
    normalizedField === 'contact_no' ||
    normalizedField === 'account_no' ||
    normalizedField === 'bank_account_no' ||
    /^bank_account_no_[0-9]+$/.test(normalizedField)
  ) {
    return value.trim()
  }
  return value
}

export function validateARValue(
  fieldName: string,
  value: unknown,
): string | undefined {
  if (value === null || value === undefined || value === '') return undefined
  if (typeof value !== 'string' && typeof value !== 'number') {
    return `${fieldName} must be text.`
  }

  const normalizedField = fieldName.toLowerCase()
  const text = normalizeARValue(normalizedField, String(value))
  if (!text) return undefined

  if (normalizedField === 'pan' || normalizedField.endsWith('_pan')) {
    return panPattern.test(text)
      ? undefined
      : `${fieldName} must be 10 characters in PAN format (ABCDE1234F).`
  }
  if (normalizedField === 'contact_no') {
    return phonePattern.test(text)
      ? undefined
      : `${fieldName} must contain exactly 10 digits.`
  }
  if (
    normalizedField === 'account_no' ||
    normalizedField === 'bank_account_no' ||
    /^bank_account_no_[0-9]+$/.test(normalizedField)
  ) {
    return accountNumberPattern.test(text)
      ? undefined
      : `${fieldName} must contain 1 to 50 digits only.`
  }
  if (normalizedField === 'ifsc' || normalizedField.endsWith('_ifsc')) {
    return ifscPattern.test(text)
      ? undefined
      : `${fieldName} must be a valid 11-character IFSC code.`
  }
  return undefined
}
