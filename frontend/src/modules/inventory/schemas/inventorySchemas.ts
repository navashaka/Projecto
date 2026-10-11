import { z } from 'zod'
import type {
  InventoryFieldDefinition,
  InventoryFormValues,
  InventoryItemDraft,
  InventoryResourceDefinition,
} from '../types/inventoryTypes'

function isInventoryItemDraft(
  value: unknown,
): value is InventoryItemDraft {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false
  }

  return Object.values(value).every(
    (fieldValue) =>
      fieldValue === null ||
      fieldValue === undefined ||
      typeof fieldValue === 'string' ||
      typeof fieldValue === 'number' ||
      typeof fieldValue === 'boolean',
  )
}

function isInventoryFormValues(
  value: unknown,
): value is InventoryFormValues {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false
  }

  return Object.values(value).every(
    (fieldValue) =>
      fieldValue === null ||
      fieldValue === undefined ||
      typeof fieldValue === 'string' ||
      typeof fieldValue === 'number' ||
      typeof fieldValue === 'boolean' ||
      (
        Array.isArray(fieldValue) &&
        fieldValue.every(isInventoryItemDraft)
      ),
  )
}

function isValidCalendarDate(
  value: string,
): boolean {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return false
  }

  const [, yearText, monthText, dayText] =
    match

  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)

  const date = new Date(
    year,
    month - 1,
    day,
  )

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

function validateField(
  field: InventoryFieldDefinition,
  value: unknown,
  path: Array<string | number>,
  context: z.RefinementCtx,
): void {
  const isBooleanField =
    field.kind === 'boolean' ||
    field.name === 'select_costing'

  const isEmpty =
    value === undefined ||
    value === null ||
    value === ''

  if (
    field.required &&
    isEmpty
  ) {
    context.addIssue({
      code: 'custom',
      path,
      message: `${field.label} is required`,
    })

    return
  }

  if (
    isBooleanField
  ) {
    if (
      value !== undefined &&
      value !== null &&
      typeof value !== 'boolean'
    ) {
      context.addIssue({
        code: 'custom',
        path,
        message: `${field.label} must be selected`,
      })
    }

    return
  }

  if (isEmpty) {
    return
  }

  if (field.kind === 'number') {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value)
    ) {
      context.addIssue({
        code: 'custom',
        path,
        message: `${field.label} must be a valid number`,
      })
    } else if (
      field.step === 1 &&
      !Number.isInteger(value)
    ) {
      context.addIssue({
        code: 'custom',
        path,
        message: `${field.label} must be a whole number`,
      })
    }

    return
  }

  if (field.kind === 'select') {
    if (
      field.optionsEndpoint &&
      typeof value !== 'number'
    ) {
      context.addIssue({
        code: 'custom',
        path,
        message: `Choose a valid ${field.label.toLowerCase()}`,
      })

      return
    }

    if (
      !field.optionsEndpoint &&
      typeof value !== 'string'
    ) {
      context.addIssue({
        code: 'custom',
        path,
        message: `Choose a valid ${field.label.toLowerCase()}`,
      })

      return
    }

    if (
      field.choices &&
      !field.choices.some(
        (choice) =>
          choice.value === value,
      )
    ) {
      context.addIssue({
        code: 'custom',
        path,
        message: `Choose a valid ${field.label.toLowerCase()}`,
      })
    }

    return
  }

  if (typeof value !== 'string') {
    context.addIssue({
      code: 'custom',
      path,
      message: `${field.label} must be text`,
    })

    return
  }

  if (
    field.required &&
    value.trim() === ''
  ) {
    context.addIssue({
      code: 'custom',
      path,
      message: `${field.label} is required`,
    })
  }

  if (
    field.maxLength !== undefined &&
    value.length > field.maxLength
  ) {
    context.addIssue({
      code: 'custom',
      path,
      message: `${field.label} must be ${field.maxLength} characters or fewer`,
    })
  }

  if (
    field.kind === 'date' &&
    !isValidCalendarDate(value)
  ) {
    context.addIssue({
      code: 'custom',
      path,
      message: `Enter a valid ${field.label.toLowerCase()}`,
    })
  }

  if (
    field.kind === 'datetime-local' &&
    Number.isNaN(Date.parse(value))
  ) {
    context.addIssue({
      code: 'custom',
      path,
      message: `Enter a valid ${field.label.toLowerCase()}`,
    })
  }
}

export function createInventorySchema(
  resource: InventoryResourceDefinition,
) {
  return z
    .custom<InventoryFormValues>(
      isInventoryFormValues,
    )
    .superRefine((values, context) => {
      for (const field of resource.fields) {
        validateField(
          field,
          values[field.name],
          [field.name],
          context,
        )
      }

      if (!resource.items) {
        return
      }

      const rows = values.items

      if (
        !Array.isArray(rows) ||
        rows.length === 0
      ) {
        context.addIssue({
          code: 'custom',
          path: ['items'],
          message: 'Add at least one item',
        })

        return
      }

      rows.forEach(
        (row, rowIndex) => {
          for (
            const field of resource.items!.fields
          ) {
            validateField(
              field,
              row[field.name],
              [
                'items',
                rowIndex,
                field.name,
              ],
              context,
            )
          }
        },
      )
    })
}

export function createInventoryItemSchema(
  fields: InventoryFieldDefinition[],
) {
  return z
    .custom<InventoryFormValues>(
      isInventoryFormValues,
    )
    .superRefine((values, context) => {
      const rows = values.items

      if (
        !Array.isArray(rows) ||
        rows.length === 0
      ) {
        context.addIssue({
          code: 'custom',
          path: ['items'],
          message: 'Add at least one item',
        })

        return
      }

      rows.forEach(
        (row, rowIndex) => {
          for (const field of fields) {
            validateField(
              field,
              row[field.name],
              [
                'items',
                rowIndex,
                field.name,
              ],
              context,
            )
          }
        },
      )
    })
}