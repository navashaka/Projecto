import type {
  InventoryFieldDefinition,
  InventoryFormValues,
  InventoryItemDraft,
  InventoryRecord,
} from '../types/inventoryTypes'

export function createDefaultFormValues(
  fields: InventoryFieldDefinition[],
  hasItems = false,
): InventoryFormValues {
  const values: InventoryFormValues = {}

  for (const field of fields) {
    if (field.defaultValue !== undefined) {
      values[field.name] = field.defaultValue
    } else if (field.kind === 'boolean') {
      values[field.name] = false
    } else {
      values[field.name] = ''
    }
  }

  if (hasItems) {
    values.items = []
  }

  return values
}

export function createBlankItem(
  fields: InventoryFieldDefinition[],
): InventoryItemDraft {
  const item: InventoryItemDraft = {}

  for (const field of fields) {
    if (field.defaultValue !== undefined) {
      item[field.name] = field.defaultValue
    } else if (field.kind === 'boolean') {
      item[field.name] = false
    } else {
      item[field.name] = ''
    }
  }

  return item
}

export function buildInventoryPayload(
  fields: InventoryFieldDefinition[],
  values: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const payload: Record<string, string | number | boolean> = {}

  for (const field of fields) {
    const rawValue = values[field.name]
    const value =
      typeof rawValue === 'string' &&
      (field.kind === 'text' || field.kind === 'textarea')
        ? rawValue.trim()
        : rawValue

    if (value === undefined || value === null || value === '') {
      continue
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      payload[field.name] = value
    }
  }

  return payload
}

export function formatInventoryCell(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number'
  ) {
    return String(value)
  }

  return String(JSON.stringify(value) ?? value)
}

export function formatInventoryError(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof Error) {
    const response = 'response' in error ? error.response : undefined

    if (
      typeof response === 'object' &&
      response !== null &&
      'data' in response
    ) {
      const data = response.data

      if (
        typeof data === 'object' &&
        data !== null &&
        'detail' in data
      ) {
        const detail = data.detail

        if (typeof detail === 'string') {
          return detail
        }

        if (Array.isArray(detail)) {
          const messages = detail.flatMap((entry) =>
            typeof entry === 'object' &&
            entry !== null &&
            'msg' in entry &&
            typeof entry.msg === 'string'
              ? [entry.msg]
              : [],
          )

          if (messages.length > 0) {
            return messages.join('; ')
          }
        }
      }
    }

    return error.message || fallback
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    error.isAxiosError === true &&
    'response' in error
  ) {
    const response = error.response

    if (
      typeof response === 'object' &&
      response !== null &&
      'data' in response
    ) {
      const data = response.data

      if (
        typeof data === 'object' &&
        data !== null &&
        'detail' in data
      ) {
        const detail = data.detail

        if (typeof detail === 'string') {
          return detail
        }

        if (Array.isArray(detail)) {
          const messages = detail
            .map((entry) => {
              if (
                typeof entry === 'object' &&
                entry !== null &&
                'msg' in entry &&
                typeof entry.msg === 'string'
              ) {
                return entry.msg
              }

              return undefined
            })
            .filter((message): message is string => message !== undefined)

          if (messages.length > 0) {
            return messages.join('; ')
          }
        }
      }
    }

  }

  return fallback
}

export function getRecordLabel(
  record: InventoryRecord,
  labelFields: string[],
): string {
  const values = labelFields
    .map((field) => record[field])
    .filter(
      (value): value is string | number =>
        typeof value === 'string' ||
        typeof value === 'number',
    )
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0)

  if (values.length > 0) {
    return values.join(' - ')
  }

  return `Record ${formatInventoryCell(record.id)}`
}

export function getRecordId(record: InventoryRecord): number | undefined {
  return typeof record.id === 'number' ? record.id : undefined
}
