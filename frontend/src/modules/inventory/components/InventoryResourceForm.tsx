import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  Box,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import * as XLSX from 'xlsx'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Controller,
  useFieldArray,
  useForm,
  type Control,
  type Path,
} from 'react-hook-form'
import { createInventoryRecord } from '../actions/inventoryActions'
import {
  createInventorySchema,
  createInventoryItemSchema,
} from '../schemas/inventorySchemas'
import type {
  InventoryFieldDefinition,
  InventoryFieldValue,
  InventoryFieldOption,
  InventoryFormValues,
  InventoryRecord,
  InventoryResourceDefinition,
} from '../types/inventoryTypes'
import {
  buildInventoryPayload,
  createBlankItem,
  createDefaultFormValues,
  formatInventoryError,
  getRecordLabel,
} from '../utils/inventoryFormUtils'
import { useInventoryResource } from '../hooks/useInventoryResource'
import { sortOptionsByLabel } from '../../../utils/sortOptions'

interface InventoryResourceFormProps {
  resource: InventoryResourceDefinition
}

interface InventoryFieldsProps {
  fields: InventoryFieldDefinition[]
  control: Control<InventoryFormValues>
  options: Record<string, InventoryRecord[]>
  endpointErrors: Record<string, string>
  onOptionSelected?: (
    field: InventoryFieldDefinition,
    value: number | string,
  ) => void
  disabled: boolean
  loading: boolean
  prefix?: `items.${number}.`
  isGoodsIssue?: boolean
  isGateEntry?: boolean
  isMaterialReceiptNote?: boolean
  isDeliveryChallan?: boolean
  isDeliveryChallanInward?: boolean
}

type ExcelMessageType = 'error' | 'info' | 'success'
type InventoryExcelRow = Record<string, string | number | boolean>

function normalizeExcelHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
}

function formatInventoryExcelDate(
  value: unknown,
  field: InventoryFieldDefinition,
): string {
  if (field.kind === 'date') {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    }
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value)
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
      }
    }

    const text = String(value ?? '').trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return text
    }
    throw new Error(`${field.label} must use YYYY-MM-DD format.`)
  }

  if (field.kind === 'datetime-local') {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}T${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}:${String(value.getSeconds()).padStart(2, '0')}`
    }
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value)
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}T${String(date.H).padStart(2, '0')}:${String(date.M).padStart(2, '0')}:${String(Math.floor(date.S)).padStart(2, '0')}`
      }
    }

    const text = String(value ?? '').trim().replace(' ', 'T')
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(text)) {
      return text
    }
    throw new Error(`${field.label} must be a valid date and time.`)
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}:${String(value.getSeconds()).padStart(2, '0')}`
  }
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value)
    if (date) {
      return `${String(date.H).padStart(2, '0')}:${String(date.M).padStart(2, '0')}:${String(Math.floor(date.S)).padStart(2, '0')}`
    }
  }

  const text = String(value ?? '').trim()
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(text)) {
    return text.length === 5 ? `${text}:00` : text
  }
  throw new Error(`${field.label} must use HH:mm or HH:mm:ss format.`)
}

function parseInventoryExcelValue(
  value: unknown,
  field: InventoryFieldDefinition,
  rowNumber: number,
): InventoryFieldValue {
  if (value === undefined || value === null || value === '') {
    if (field.required) {
      throw new Error(`Row ${rowNumber}: ${field.name} is required.`)
    }
    return undefined
  }

  if (field.kind === 'boolean') {
    if (typeof value === 'boolean') return value
    const normalized = String(value).trim().toLowerCase()
    if (['true', 'yes', '1'].includes(normalized)) return true
    if (['false', 'no', '0'].includes(normalized)) return false
    throw new Error(
      `Row ${rowNumber}: ${field.name} must be TRUE/FALSE, YES/NO, or 1/0.`,
    )
  }

  if (
    field.kind === 'date' ||
    field.kind === 'datetime-local' ||
    field.kind === 'time'
  ) {
    try {
      return formatInventoryExcelDate(value, field)
    } catch (error) {
      throw new Error(
        `Row ${rowNumber}: ${error instanceof Error ? error.message : `Invalid ${field.name}.`}`,
      )
    }
  }

  if (field.kind === 'number' || (field.kind === 'select' && field.optionsEndpoint)) {
    const number = Number(value)
    if (!Number.isFinite(number)) {
      throw new Error(`Row ${rowNumber}: ${field.name} must be a valid number.`)
    }
    if (field.step === 1 && !Number.isInteger(number)) {
      throw new Error(`Row ${rowNumber}: ${field.name} must be a whole number.`)
    }
    if (field.kind === 'select' && (!Number.isInteger(number) || number < 1)) {
      throw new Error(`Row ${rowNumber}: ${field.name} must be a valid record ID.`)
    }
    return number
  }

  const text = String(value).trim()
  if (field.required && !text) {
    throw new Error(`Row ${rowNumber}: ${field.name} is required.`)
  }
  if (field.maxLength !== undefined && text.length > field.maxLength) {
    throw new Error(
      `Row ${rowNumber}: ${field.name} must be ${field.maxLength} characters or fewer.`,
    )
  }
  if (
    field.kind === 'select' &&
    field.choices &&
    !field.choices.some((choice) => choice.value === text)
  ) {
    throw new Error(
      `Row ${rowNumber}: ${field.name} must be one of ${field.choices
        .map((choice) => choice.value)
        .join(', ')}.`,
    )
  }
  return text
}

function getFieldOptions(
  field: InventoryFieldDefinition,
  optionRecords: Record<string, InventoryRecord[]>,
): InventoryFieldOption[] {
  if (!field.optionsEndpoint) {
    return []
  }

  const labelFields = field.optionLabelFields ?? []
  const valueField = field.optionValue ?? 'id'

  return (optionRecords[field.optionsEndpoint] ?? []).flatMap(
    (record) => {
      const value = record[valueField]

      if (
        typeof value !== 'number' &&
        typeof value !== 'string'
      ) {
        return []
      }

      return [
        {
          value,
          label: getRecordLabel(
            record,
            labelFields,
          ),
        },
      ]
    },
  ).sort((left, right) =>
    left.label.localeCompare(right.label, undefined, {
      numeric: true,
      sensitivity: 'base',
    }),
  )
}

function InventoryField({
  field,
  name,
  options,
  endpointErrors,
  onOptionSelected,
  disabled,
  loading,
  control,
  isGoodsIssueStatus = false,
  isGateEntry = false,
  isMaterialReceiptNote = false,
  isDeliveryChallan = false,
  isDeliveryChallanInward = false,
}: {
  field: InventoryFieldDefinition
  name: Path<InventoryFormValues>
  options: InventoryFieldOption[]
  endpointErrors: Record<string, string>
  onOptionSelected?: (
    field: InventoryFieldDefinition,
    value: number | string,
  ) => void
  disabled: boolean
  loading: boolean
  control: Control<InventoryFormValues>
  isGoodsIssueStatus?: boolean
  isGateEntry?: boolean
  isMaterialReceiptNote?: boolean
  isDeliveryChallan?: boolean
  isDeliveryChallanInward?: boolean
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: controlField, fieldState }) => {
        if (field.kind === 'select') {
          const showPlaceholderSelect =
            isDeliveryChallanInward || isGoodsIssueStatus
          const labelId = `${name.replaceAll('.', '-')}-label`

          const values = sortOptionsByLabel(
            field.choices
              ? field.choices.map((choice) => ({
                  value: choice.value,
                  label: choice.label,
                }))
              : options,
            (option) => option.label,
          )

          const noOptions =
            !field.choices &&
            values.length === 0
          const optionError = field.optionsEndpoint
            ? endpointErrors[field.optionsEndpoint]
            : undefined

          return (
            <FormControl
              disabled={disabled}
              error={Boolean(fieldState.error)}
              fullWidth
              required={field.required}
              size="small"
            >
              {!showPlaceholderSelect && (
                <InputLabel id={labelId}>
                  {field.label}
                </InputLabel>
              )}

              <Select
                {...controlField}
                displayEmpty={showPlaceholderSelect}
                label={
                  showPlaceholderSelect
                    ? undefined
                    : field.label
                }
                labelId={
                  showPlaceholderSelect
                    ? undefined
                    : labelId
                }
                onChange={(event) => {
                  const selected = values.find(
                    (option) =>
                      String(option.value) ===
                      String(event.target.value),
                  )

                  controlField.onChange(
                    selected?.value ?? '',
                  )
                  onOptionSelected?.(
                    field,
                    selected?.value ?? '',
                  )
                }}
                value={
                  controlField.value === undefined ||
                  controlField.value === null
                    ? ''
                    : controlField.value
                }
                renderValue={(value) => {
                  if (showPlaceholderSelect && value === '') {
                    return `${field.label}${field.required ? ' *' : ''}`
                  }
                  return (
                    values.find(
                      (option) =>
                        String(option.value) === String(value),
                    )?.label ?? ''
                  )
                }}
              >
                {showPlaceholderSelect && (
                  <MenuItem disabled value="">
                    {field.label}
                    {field.required ? ' *' : ''}
                  </MenuItem>
                )}
                {!showPlaceholderSelect &&
                  !field.required &&
                  !noOptions && (
                  <MenuItem value="">
                    None
                  </MenuItem>
                  )}

                {noOptions && (
                  <MenuItem disabled value="">
                    {loading
                      ? 'Loading options...'
                      : optionError
                        ? 'Unable to load options.'
                        : 'No backend records available'}
                  </MenuItem>
                )}

                {values.map((option) => (
                  <MenuItem
                    key={String(option.value)}
                    value={option.value}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </Select>

              {fieldState.error?.message && (
                <FormHelperText>
                  {fieldState.error.message}
                </FormHelperText>
              )}

              {noOptions && !fieldState.error && (
                <FormHelperText error={Boolean(optionError)}>
                  {loading
                    ? 'Loading live options...'
                    : optionError
                      ? `Unable to load options from ${field.optionsEndpoint}: ${optionError}`
                      : field.optionsEndpoint
                        ? `No options returned from ${field.optionsEndpoint}.`
                      : 'No choices are configured.'}
                </FormHelperText>
              )}
            </FormControl>
          )
        }

        if (field.kind === 'boolean') {
          const isEwayBillRequired =
            field.name === 'eway_bill_required' &&
            (isDeliveryChallan || isDeliveryChallanInward)
          const ewayBillRequired = controlField.value === true

          return (
            <FormControl
              error={Boolean(fieldState.error)}
            >
              <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={ewayBillRequired}
                      disabled={disabled}
                      onChange={(event) =>
                        controlField.onChange(
                          event.target.checked,
                        )
                      }
                    />
                  }
                  label={field.label}
                />
                {isEwayBillRequired && (
                  <Button
                    component="a"
                    disabled={disabled || !ewayBillRequired}
                    href="https://ewaybillgst.gov.in/"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{ textTransform: 'lowercase' }}
                    target="_blank"
                    variant="outlined"
                  >
                    Generate
                  </Button>
                )}
              </Box>

              {fieldState.error?.message && (
                <FormHelperText>
                  {fieldState.error.message}
                </FormHelperText>
              )}
            </FormControl>
          )
        }

        const multiline =
          field.kind === 'textarea'

        const inputType = multiline
          ? undefined
          : field.kind === 'datetime-local'
              ? 'datetime-local'
              : field.kind

        const isPlaceholderField =
          field.name === 'name' ||
          field.name === 'indent_no' ||
          field.name === 'department_id' ||
          field.name === 'quantity' ||
          field.name === 'rate' ||
          (isGateEntry &&
            [
              'vendor_invoice_no',
              'vendor_name',
              'vendor_address',
              'transporter_name',
              'vehicle_no',
              'scan_copy_path',
            ].includes(field.name)) ||
          isMaterialReceiptNote ||
          isDeliveryChallan ||
          isDeliveryChallanInward

        const inputValue =
          controlField.value === undefined ||
          controlField.value === null
            ? ''
            : controlField.value
        const showInwardDatePlaceholder =
          isDeliveryChallanInward &&
          field.kind === 'date' &&
          inputValue === ''
        const textField = (
          <TextField
              disabled={disabled}
              error={Boolean(fieldState.error)}
              fullWidth
              helperText={fieldState.error?.message}
              placeholder={
                isPlaceholderField
                  ? field.required
                    ? `${field.label} *`
                    : field.label
                  : undefined
              }
              label={isPlaceholderField ? undefined : field.label}
              multiline={multiline}
              required={field.required}
              rows={multiline ? 3 : undefined}
              size="small"
              sx={
                showInwardDatePlaceholder
                  ? {
                      '& input::-webkit-datetime-edit': {
                        color: 'transparent',
                      },
                    }
                  : undefined
              }
              slotProps={{
                htmlInput: {
                  maxLength: field.maxLength,
                  step: field.step,
                },
                inputLabel: {
                  shrink:
                    !isPlaceholderField &&
                    (field.kind === 'date' ||
                      field.kind === 'datetime-local' ||
                      field.kind === 'time'),
                },
              }}
              type={inputType}
              value={inputValue}
              onBlur={controlField.onBlur}
              onChange={(event) => {
                if (field.kind === 'number') {
                  controlField.onChange(
                    event.target.value === ''
                      ? ''
                      : Number(event.target.value),
                  )
                } else {
                  controlField.onChange(event.target.value)
                }
              }}
              inputRef={controlField.ref}
              name={controlField.name}
          />
        )

        if (!showInwardDatePlaceholder) {
          return textField
        }

        return (
          <Box sx={{ position: 'relative' }}>
            {textField}
            <Box
                aria-hidden="true"
                sx={{
                  color: 'text.disabled',
                  left: 14,
                  pointerEvents: 'none',
                  position: 'absolute',
                  top: 20,
                  transform: 'translateY(-50%)',
                  userSelect: 'none',
                }}
              >
                {field.label}
            </Box>
          </Box>
        )
      }}
    />
  )
}

function InventoryFields({
  fields,
  control,
  options,
  endpointErrors,
  onOptionSelected,
  disabled,
  loading,
  prefix,
  isGoodsIssue = false,
  isGateEntry = false,
  isMaterialReceiptNote = false,
  isDeliveryChallan = false,
  isDeliveryChallanInward = false,
}: InventoryFieldsProps) {
  return (
    <Grid container spacing={2}>
      {fields.map((field) => {
        const name =
          `${prefix ?? ''}${field.name}` as Path<InventoryFormValues>

        return (
          <Grid
            key={name}
            size={{
              xs: 12,
              sm: 6,
            }}
          >
            <InventoryField
              control={control}
              disabled={disabled}
              field={field}
              isGoodsIssueStatus={
                isGoodsIssue && field.name === 'status'
              }
              loading={loading}
              name={name}
              options={getFieldOptions(
                field,
                options,
              )}
              endpointErrors={endpointErrors}
              onOptionSelected={onOptionSelected}
              isGateEntry={isGateEntry}
              isMaterialReceiptNote={
                isMaterialReceiptNote
              }
              isDeliveryChallan={isDeliveryChallan}
              isDeliveryChallanInward={isDeliveryChallanInward}
            />
          </Grid>
        )
      })}
    </Grid>
  )
}

function InventoryResourceForm({
  resource,
}: InventoryResourceFormProps) {
  const navigate = useNavigate()

  const {
    records,
    options,
    endpointErrors,
    loading,
    dataError,
    retryLoad,
  } = useInventoryResource(resource)

  const [
    savingHeader,
    setSavingHeader,
  ] = useState(false)

  const [
    savingItems,
    setSavingItems,
  ] = useState(false)

  const [
    headerError,
    setHeaderError,
  ] = useState('')

  const [
    itemError,
    setItemError,
  ] = useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('')

  const [
    excelFile,
    setExcelFile,
  ] = useState<File | null>(null)

  const [
    excelPreviewRows,
    setExcelPreviewRows,
  ] = useState<InventoryExcelRow[]>([])

  const [
    excelPreviewColumns,
    setExcelPreviewColumns,
  ] = useState<string[]>([])

  const [
    excelUploading,
    setExcelUploading,
  ] = useState(false)

  const [
    excelMessage,
    setExcelMessage,
  ] = useState('')

  const [
    excelMessageType,
    setExcelMessageType,
  ] = useState<ExcelMessageType>('info')

  const [
    excelTarget,
    setExcelTarget,
  ] = useState<'record' | 'item'>('record')

  const [
    completedItemCount,
    setCompletedItemCount,
  ] = useState(0)

  const [
    uomMode,
    setUomMode,
  ] = useState<'new' | 'existing'>('new')

  const [
    selectedUomId,
    setSelectedUomId,
  ] = useState('')

  const [
    selectedIndentId,
    setSelectedIndentId,
  ] = useState('')

  const [
    selectedGateEntryId,
    setSelectedGateEntryId,
  ] = useState('')

  const [
    stockGroupRows,
    setStockGroupRows,
  ] = useState<InventoryFormValues[]>([])

  const isUnitOfMeasure =
    resource.key === 'unit-of-measures'

  const isStockGroup =
    resource.key === 'stock-groups'

  const isGateEntry =
    resource.key === 'gate-entries'

  const isGoodsIssue =
    resource.key === 'goods-issues'

  const isMaterialReceiptNote =
    resource.key === 'material-receipt-notes'
  const isDeliveryChallan =
    resource.key === 'delivery-challans'
  const isDeliveryChallanInward =
    resource.key === 'delivery-challan-inwards'
  const hideItemSectionHelper = [
    'delivery-challans',
    'gate-entries',
    'indents',
    'goods-issues',
    'goods-issue-sales',
  ].includes(resource.key)
  const hiddenMrnConflictMessage =
    'The inventory record conflicts with existing data or references a record that does not exist.'
  const shouldShowHeaderError =
    Boolean(headerError) &&
    (!isMaterialReceiptNote ||
      !headerError.includes(hiddenMrnConflictMessage))
  const shouldShowItemError =
    Boolean(itemError) &&
    (!isMaterialReceiptNote ||
      !itemError.includes(hiddenMrnConflictMessage))

  const headerDefaults =
    createDefaultFormValues(
      resource.fields,
    )

  const {
    control: headerControl,
    handleSubmit: handleHeaderSubmit,
    reset: resetHeader,
    setValue: setHeaderValue,
  } = useForm<InventoryFormValues>({
    resolver: zodResolver(
      createInventorySchema({
        ...resource,
        items: undefined,
      }),
    ),
    defaultValues: headerDefaults,
  })

  const itemFields =
    resource.items?.fields ?? []

  const excelFields =
    excelTarget === 'item' && resource.items
      ? resource.items.fields
      : resource.fields

  const excelEndpoint =
    excelTarget === 'item' && resource.items
      ? resource.items.endpoint
      : resource.endpoint

  const excelTargetLabel =
    excelTarget === 'item' && resource.items
      ? `${resource.label} item`
      : resource.label

  useEffect(() => {
    setExcelFile(null)
    setExcelPreviewRows([])
    setExcelPreviewColumns([])
    setExcelMessage('')
    setExcelTarget('record')
  }, [resource.key])

  const itemDefaults =
    createDefaultFormValues(
      itemFields,
      true,
    )

  const {
    control: itemControl,
    handleSubmit: handleItemSubmit,
    reset: resetItems,
    formState: {
      errors: itemFormErrors,
    },
  } = useForm<InventoryFormValues>({
    resolver: zodResolver(
      createInventoryItemSchema(
        itemFields,
      ),
    ),
    defaultValues: itemDefaults,
  })

  const {
    fields: itemRows,
    append,
    remove,
  } = useFieldArray({
    control: itemControl,
    name: 'items',
  })

  const handleHeaderOptionSelected = (
    field: InventoryFieldDefinition,
    value: number | string,
  ) => {
    if (isGoodsIssue && field.name === 'indent_id') {
      const indentId = String(value)
      setSelectedIndentId(indentId)
      const indent = options['/inventory/indents']?.find(
        (record) => String(record.id) === indentId,
      )

      setHeaderValue(
        'indent_date',
        typeof indent?.indent_date === 'string'
          ? indent.indent_date.slice(0, 10)
          : '',
        { shouldValidate: true },
      )
      setHeaderValue(
        'department_id',
        typeof indent?.department_id === 'number'
          ? indent.department_id
          : '',
        { shouldValidate: true },
      )

      const indentItems = (options['/inventory/indent-items'] ?? [])
        .filter((record) => String(record.indent_id) === indentId)
      resetItems({
        items: indentItems.map((record) => ({
          ...createBlankItem(itemFields),
          stock_item_id:
            typeof record.stock_item_id === 'number'
              ? record.stock_item_id
              : '',
          quantity:
            typeof record.quantity === 'number'
              ? record.quantity
              : Number(record.quantity ?? 0),
        })),
      })
      return
    }

    if (isMaterialReceiptNote && field.name === 'gate_entry_id') {
      const gateEntryId = String(value)
      setSelectedGateEntryId(gateEntryId)
      const gateEntry = options['/inventory/gate-entries']?.find(
        (record) => String(record.id) === gateEntryId,
      )

      setHeaderValue(
        'mrn_date',
        typeof gateEntry?.entry_date === 'string'
          ? gateEntry.entry_date.slice(0, 10)
          : '',
        { shouldValidate: true },
      )
      setHeaderValue(
        'mrn_time',
        typeof gateEntry?.entry_time === 'string'
          ? gateEntry.entry_time.slice(0, 8)
          : '',
        { shouldValidate: true },
      )
      setHeaderValue(
        'vendor_invoice_no',
        typeof gateEntry?.vendor_invoice_no === 'string'
          ? gateEntry.vendor_invoice_no
          : '',
        { shouldValidate: true },
      )
      setHeaderValue(
        'vendor_invoice_date',
        typeof gateEntry?.vendor_invoice_date === 'string'
          ? gateEntry.vendor_invoice_date.slice(0, 10)
          : '',
        { shouldValidate: true },
      )
      setHeaderValue(
        'vendor_name',
        typeof gateEntry?.vendor_name === 'string'
          ? gateEntry.vendor_name
          : '',
        { shouldValidate: true },
      )
      setHeaderValue(
        'vendor_address',
        typeof gateEntry?.vendor_address === 'string'
          ? gateEntry.vendor_address
          : '',
        { shouldValidate: true },
      )

      const gateEntryItems = (options['/inventory/gate-entry-items'] ?? [])
        .filter((record) => String(record.gate_entry_id) === gateEntryId)
      resetItems({
        items: gateEntryItems.map((record) => ({
          ...createBlankItem(itemFields),
          gate_entry_item_id:
            typeof record.id === 'number' ? record.id : '',
          stock_item_id:
            typeof record.stock_item_id === 'number'
              ? record.stock_item_id
              : '',
          quantity:
            typeof record.quantity === 'number'
              ? record.quantity
              : Number(record.quantity ?? 0),
          rate:
            typeof record.rate === 'number'
              ? record.rate
              : Number(record.rate ?? 0),
        })),
      })
    }
  }

  const itemOptions = { ...options }
  if (isGoodsIssue) {
    const indentStockItemIds = new Set(
      (options['/inventory/indent-items'] ?? [])
        .filter((record) => String(record.indent_id) === selectedIndentId)
        .map((record) => String(record.stock_item_id)),
    )
    itemOptions['/inventory/stock-items'] = (
      options['/inventory/stock-items'] ?? []
    ).filter((record) => indentStockItemIds.has(String(record.id)))
  }
  if (isMaterialReceiptNote) {
    const gateEntryStockItemIds = new Set(
      (options['/inventory/gate-entry-items'] ?? [])
        .filter(
          (record) =>
            String(record.gate_entry_id) === selectedGateEntryId,
        )
        .map((record) => String(record.stock_item_id)),
    )
    itemOptions['/inventory/stock-items'] = (
      options['/inventory/stock-items'] ?? []
    ).filter((record) => gateEntryStockItemIds.has(String(record.id)))
    itemOptions['/inventory/gate-entry-items'] = (
      options['/inventory/gate-entry-items'] ?? []
    ).filter(
      (record) => String(record.gate_entry_id) === selectedGateEntryId,
    )
  }

  const onCreateHeader = async (
    values: InventoryFormValues,
  ) => {
    setSavingHeader(true)
    setHeaderError('')
    setSuccessMessage('')

    try {
      await createInventoryRecord(
        resource.endpoint,
        buildInventoryPayload(
          resource.fields,
          values,
        ),
      )

      setSuccessMessage(
        'Saved successfully!',
      )

      resetHeader(headerDefaults)

      await retryLoad()
    } catch (error) {
      setHeaderError(
        formatInventoryError(
          error,
          `Unable to create ${resource.label.toLowerCase()}.`,
        ),
      )
    } finally {
      setSavingHeader(false)
    }
  }

  const onAddStockGroup = async (
    values: InventoryFormValues,
  ) => {
    setHeaderError('')
    setSuccessMessage('')

    setStockGroupRows((previous) => [
      ...previous,
      values,
    ])

    resetHeader(headerDefaults)

    setSuccessMessage(
      'Stock group added. Add another or click Save.',
    )
  }

  const onSaveStockGroups = async () => {
    if (stockGroupRows.length === 0) {
      setHeaderError(
        'Add at least one stock group before saving.',
      )
      return
    }

    setSavingHeader(true)
    setHeaderError('')
    setSuccessMessage('')

    try {
      for (const row of stockGroupRows) {
        await createInventoryRecord(
          resource.endpoint,
          buildInventoryPayload(
            resource.fields,
            row,
          ),
        )
      }

      setSuccessMessage(
        'Saved successfully!',
      )

      setStockGroupRows([])

      resetHeader(headerDefaults)

      await retryLoad()
    } catch (error) {
      setHeaderError(
        formatInventoryError(
          error,
          'Unable to save stock groups.',
        ),
      )
    } finally {
      setSavingHeader(false)
    }
  }

  const selectedUom = records.find(
    (record) =>
      String(record.id) ===
      selectedUomId,
  )

  const selectUom = (
    value: string,
  ) => {
    setSelectedUomId(value)

    const record = records.find(
      (candidate) =>
        String(candidate.id) === value,
    )

    if (!record) {
      setUomMode('new')
      resetHeader(headerDefaults)
      return
    }

    if (
      typeof record.symbol !== 'string' ||
      typeof record.name !== 'string' ||
      (
        typeof record.number_of_decimals !==
          'number' &&
        typeof record.number_of_decimals !==
          'string'
      )
    ) {
      setHeaderError(
        'The selected UOM record is missing required display fields.',
      )

      setSelectedUomId('')
      setUomMode('new')
      return
    }

    setHeaderError('')
    setUomMode('existing')

    setHeaderValue(
      'symbol',
      record.symbol,
      {
        shouldValidate: true,
      },
    )

    setHeaderValue(
      'name',
      record.name,
      {
        shouldValidate: true,
      },
    )

    setHeaderValue(
      'number_of_decimals',
      Number(
        record.number_of_decimals,
      ),
      {
        shouldValidate: true,
      },
    )
  }

  const startNewUom = () => {
    setUomMode('new')
    setSelectedUomId('')
    setHeaderError('')
    setSuccessMessage('')
    resetHeader(headerDefaults)
  }

  const getUomOptionLabel = (
    record: InventoryRecord,
  ) => {
    const symbol =
      typeof record.symbol === 'string'
        ? record.symbol
        : ''

    const name =
      typeof record.name === 'string'
        ? record.name
        : ''

    if (symbol && name) {
      return `${symbol} (${name})`
    }

    return getRecordLabel(
      record,
      ['symbol', 'name'],
    )
  }

  const onCreateItems = async (
    values: InventoryFormValues,
  ) => {
    if (
      !resource.items ||
      !Array.isArray(values.items)
    ) {
      return
    }

    setSavingItems(true)
    setItemError('')
    setSuccessMessage('')

    let nextItemIndex =
      completedItemCount

    try {
      while (
        nextItemIndex <
        values.items.length
      ) {
        const itemPayload =
          buildInventoryPayload(
            resource.items.fields,
            values.items[
              nextItemIndex
            ],
          )

        await createInventoryRecord(
          resource.items.endpoint,
          itemPayload,
        )

        nextItemIndex += 1

        setCompletedItemCount(
          nextItemIndex,
        )
      }

      setSuccessMessage(
        'Saved successfully!',
      )

      setCompletedItemCount(0)

      resetItems(itemDefaults)

      await retryLoad()
    } catch (error) {
      setCompletedItemCount(
        nextItemIndex,
      )

      setItemError(
        `${nextItemIndex} of ${values.items.length} item rows were saved. ${formatInventoryError(
          error,
          'Unable to create the remaining item records.',
        )} Submit again to retry the remaining rows.`,
      )
    } finally {
      setSavingItems(false)
    }
  }

  const handleExcelFileChange = async (file?: File) => {
    setExcelFile(null)
    setExcelPreviewRows([])
    setExcelPreviewColumns([])
    setExcelMessage('')

    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls'].includes(extension ?? '')) {
      setExcelMessageType('error')
      setExcelMessage('Excel files only: please choose .xlsx or .xls.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setExcelMessageType('error')
      setExcelMessage('File is too large. Maximum size is 10 MB.')
      return
    }

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: 'array',
        cellDates: true,
      })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        throw new Error('The Excel file has no worksheet.')
      }

      const matrix = XLSX.utils.sheet_to_json<unknown[]>(
        workbook.Sheets[sheetName],
        { header: 1, defval: '', raw: true, blankrows: false },
      )
      const headerRow = matrix[0]
      if (!headerRow) {
        throw new Error('The selected worksheet has no data.')
      }

      const headers = headerRow.map(normalizeExcelHeader)
      while (headers.length > 0 && !headers[headers.length - 1]) {
        headers.pop()
      }
      if (headers.length === 0 || headers.some((header) => !header)) {
        throw new Error('Every Excel column must have a column header.')
      }
      if (new Set(headers).size !== headers.length) {
        throw new Error('The Excel file contains duplicate column headers.')
      }

      const allowedFields = new Set(excelFields.map((field) => field.name))
      const unsupportedHeaders = headers.filter(
        (header) => !allowedFields.has(header),
      )
      if (unsupportedHeaders.length > 0) {
        throw new Error(
          `Unsupported Excel columns: ${unsupportedHeaders.join(', ')}.`,
        )
      }

      const missingHeaders = excelFields
        .filter((field) => field.required && !headers.includes(field.name))
        .map((field) => field.name)
      if (missingHeaders.length > 0) {
        throw new Error(
          `Missing required Excel columns: ${missingHeaders.join(', ')}.`,
        )
      }

      const parsedRows: InventoryExcelRow[] = []
      for (const [index, cells] of matrix.slice(1).entries()) {
        if (cells.every((cell) => cell === '' || cell === null || cell === undefined)) {
          continue
        }
        if (
          cells
            .slice(headers.length)
            .some((cell) => cell !== '' && cell !== null && cell !== undefined)
        ) {
          throw new Error(`Row ${index + 2}: a value has no matching column header.`)
        }

        const rowNumber = index + 2
        const values: InventoryExcelRow = {}
        for (const field of excelFields) {
          const columnIndex = headers.indexOf(field.name)
          const value = parseInventoryExcelValue(
            columnIndex < 0 ? '' : cells[columnIndex],
            field,
            rowNumber,
          )
          if (value !== undefined && value !== null && value !== '') {
            values[field.name] = value
          }
        }

        if (Object.keys(values).length === 0) {
          throw new Error(`Row ${rowNumber}: enter at least one field value.`)
        }
        parsedRows.push(values)
      }

      if (parsedRows.length === 0) {
        throw new Error('The selected worksheet has no data rows.')
      }

      setExcelFile(file)
      setExcelPreviewRows(parsedRows)
      setExcelPreviewColumns(headers)
      setExcelMessageType('info')
      setExcelMessage(`${parsedRows.length} Excel rows ready to preview.`)
    } catch (fileError) {
      setExcelMessageType('error')
      setExcelMessage(
        fileError instanceof Error
          ? fileError.message
          : 'Unable to read the Excel file.',
      )
    }
  }

  const handleExcelUpload = async () => {
    if (!excelFile || excelPreviewRows.length === 0) {
      setExcelMessageType('error')
      setExcelMessage('Choose a valid Excel file first.')
      return
    }

    setExcelUploading(true)
    setExcelMessage('')
    let savedCount = 0
    try {
      for (const row of excelPreviewRows) {
        await createInventoryRecord(
          excelEndpoint,
          buildInventoryPayload(excelFields, row),
        )
        savedCount += 1
      }

      await retryLoad()
      setExcelFile(null)
      setExcelPreviewRows([])
      setExcelPreviewColumns([])
      setExcelMessageType('success')
      setExcelMessage(`${savedCount} ${excelTargetLabel} records saved successfully.`)
    } catch (uploadError) {
      if (savedCount > 0) {
        await retryLoad()
      }
      setExcelMessageType('error')
      setExcelMessage(
        `${savedCount} of ${excelPreviewRows.length} rows were saved. Row ${savedCount + 2}: ${formatInventoryError(
          uploadError,
          `Unable to upload ${excelTargetLabel.toLowerCase()} records.`,
        )}`,
      )
    } finally {
      setExcelUploading(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Paper
        component="form"
        id="inventory-header-form"
        onSubmit={
          isStockGroup
            ? (event) => {
                event.preventDefault()
                void onSaveStockGroups()
              }
            : handleHeaderSubmit(
                onCreateHeader,
              )
        }
        sx={{
          p: {
            xs: 2,
            md: 4,
          },
        }}
      >
        <Stack spacing={3}>
          <div>
            <Typography variant="h5">
              {resource.label}
            </Typography>
          </div>

          {dataError && (
            <Alert
              action={
                <Button
                  color="inherit"
                  disabled={loading}
                  onClick={() =>
                    void retryLoad()
                  }
                  size="small"
                  type="button"
                >
                  Retry
                </Button>
              }
              severity="error"
            >
              {dataError}
            </Alert>
          )}

          {shouldShowHeaderError && (
            <Alert severity="error">{headerError}</Alert>
          )}

          {loading && (
            <Alert
              icon={
                <CircularProgress
                  size={20}
                />
              }
              severity="info"
            >
              Loading live{' '}
              {resource.label.toLowerCase()}{' '}
              data...
            </Alert>
          )}

          {isUnitOfMeasure && (
            <Grid
              container
              spacing={2}
              sx={{
                alignItems: 'center',
              }}
            >
              <Grid
                size={{
                  xs: 12,
                  sm: 8,
                }}
              >
                <FormControl
                  fullWidth
                  size="small"
                >
                  <InputLabel id="existing-uom-label">
                    Existing Unit of Measure
                  </InputLabel>

                  <Select
                    disabled={
                      loading ||
                      savingHeader
                    }
                    label="Existing Unit of Measure"
                    labelId="existing-uom-label"
                    onChange={(event) =>
                      selectUom(
                        String(
                          event.target.value,
                        ),
                      )
                    }
                    value={selectedUomId}
                  >
                    <MenuItem value="">
                      Select existing UOM
                    </MenuItem>

                    {sortOptionsByLabel(records, getUomOptionLabel).map(
                      (
                        record,
                        index,
                      ) => (
                        <MenuItem
                          key={
                            typeof record.id ===
                            'number'
                              ? record.id
                              : `uom-${index}`
                          }
                          value={
                            typeof record.id ===
                            'number'
                              ? record.id
                              : ''
                          }
                        >
                          {getUomOptionLabel(
                            record,
                          )}
                        </MenuItem>
                      ),
                    )}

                    {!loading &&
                      records.length === 0 && (
                        <MenuItem
                          disabled
                          value="__empty"
                        >
                          No UOM records available
                        </MenuItem>
                      )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 4,
                }}
              >
                <Button
                  disabled={
                    loading ||
                    savingHeader ||
                    uomMode === 'new'
                  }
                  onClick={
                    startNewUom
                  }
                  type="button"
                  variant="outlined"
                >
                  Create new UOM
                </Button>
              </Grid>
            </Grid>
          )}

          {isUnitOfMeasure &&
          uomMode === 'existing' &&
          selectedUom ? (
            <Grid
              container
              spacing={2}
            >
              <Grid
                size={{
                  xs: 12,
                  sm: 4,
                }}
              >
                <TextField
                  fullWidth
                  label="Symbol"
                  size="small"
                  value={String(
                    selectedUom.symbol ?? '',
                  )}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 4,
                }}
              >
                <TextField
                  fullWidth
                  label="Name"
                  size="small"
                  value={String(
                    selectedUom.name ?? '',
                  )}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 4,
                }}
              >
                <TextField
                  fullWidth
                  label="Number of decimals"
                  size="small"
                  type="number"
                  value={String(
                    selectedUom.number_of_decimals ??
                      '',
                  )}
                  slotProps={{
                    htmlInput: {
                      readOnly: true,
                    },
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />
              </Grid>
            </Grid>
          ) : (
            (!isUnitOfMeasure ||
              uomMode === 'new') && (
              <InventoryFields
                control={headerControl}
                disabled={
                  savingHeader ||
                  loading
                }
                fields={resource.fields}
                loading={loading}
                options={options}
                endpointErrors={endpointErrors}
                onOptionSelected={handleHeaderOptionSelected}
                isGoodsIssue={isGoodsIssue}
                isGateEntry={
                  isGateEntry
                }
                isMaterialReceiptNote={
                  isMaterialReceiptNote
                }
                isDeliveryChallan={isDeliveryChallan}
                isDeliveryChallanInward={
                  isDeliveryChallanInward
                }
              />
            )
          )}

          {isStockGroup &&
            stockGroupRows.length > 0 && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                }}
              >
                <Stack spacing={1}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                    }}
                  >
                    Added Stock Groups
                  </Typography>

                  {stockGroupRows.map(
                    (
                      row,
                      index,
                    ) => (
                      <Stack
                        key={index}
                        direction={{
                          xs: 'column',
                          sm: 'row',
                        }}
                        spacing={2}
                        sx={{
                          py: 1,
                          borderBottom:
                            index <
                            stockGroupRows.length -
                              1
                              ? '1px solid #eee'
                              : 'none',
                        }}
                      >
                        <Typography>
                          {index + 1}.
                        </Typography>

                        <Typography>
                          {String(
                            row.name ?? '',
                          )}
                        </Typography>

                        <Typography
                          color="text.secondary"
                        >
                          {row.under_stock_group_id
                            ? `Under group ID: ${row.under_stock_group_id}`
                            : 'No parent group'}
                        </Typography>
                      </Stack>
                    ),
                  )}
                </Stack>
              </Paper>
            )}

          {isStockGroup && (
            <Stack
              direction="row"
              spacing={1}
              sx={{
                justifyContent:
                  'flex-start',
              }}
            >
              <Button
                disabled={
                  loading ||
                  savingHeader
                }
                onClick={() =>
                  void handleHeaderSubmit(
                    onAddStockGroup,
                  )()
                }
                type="button"
                variant="outlined"
              >
                Add Stock Group
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      {resource.items && (
        <Paper
          component="form"
          id="inventory-items-form"
          onSubmit={handleItemSubmit(
            onCreateItems,
          )}
          sx={{
            p: {
              xs: 2,
              md: 4,
            },
          }}
        >
          <Stack spacing={3}>
            <div>
              <Typography variant="h5">
                {resource.label} item details
              </Typography>

              {!isMaterialReceiptNote &&
                !isDeliveryChallanInward &&
                !hideItemSectionHelper && (
                <Typography
                  color="text.secondary"
                  variant="body2"
                >
                  Choose each existing header
                  and master record from the
                  live dropdowns, then add its
                  item rows.
                </Typography>
              )}
            </div>

            {shouldShowItemError && (
              <Alert severity="error">
                {itemError}
              </Alert>
            )}

            <Stack spacing={2}>
              {itemRows.map(
                (
                  row,
                  rowIndex,
                ) => (
                  <Paper
                    key={row.id}
                    sx={{ p: 2 }}
                    variant="outlined"
                  >
                    <Stack spacing={2}>
                      <Typography variant="subtitle2">
                        Item {rowIndex + 1}
                      </Typography>

                      <InventoryFields
                        control={itemControl}
                        disabled={
                          savingItems ||
                          loading ||
                          completedItemCount >
                            0
                        }
                        fields={itemFields}
                        loading={loading}
                        options={itemOptions}
                        endpointErrors={endpointErrors}
                        prefix={`items.${rowIndex}.`}
                        isGateEntry={
                          isGateEntry
                        }
                        isMaterialReceiptNote={
                          isMaterialReceiptNote
                        }
                        isDeliveryChallan={isDeliveryChallan}
                        isDeliveryChallanInward={
                          isDeliveryChallanInward
                        }
                      />

                      <Stack
                        direction="row"
                        sx={{
                          justifyContent:
                            'flex-end',
                        }}
                      >
                        <Button
                          color="error"
                          disabled={
                            savingItems ||
                            loading ||
                            completedItemCount >
                              0
                          }
                          onClick={() =>
                            remove(
                              rowIndex,
                            )
                          }
                          type="button"
                        >
                          Remove row
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ),
              )}

              {itemRows.length === 0 && (
                <Typography
                  color="text.secondary"
                  variant="body2"
                >
                  No item rows added. Add a
                  row to create item records.
                </Typography>
              )}

              {typeof itemFormErrors
                .items?.message ===
                'string' && (
                <FormHelperText error>
                  {
                    itemFormErrors.items
                      .message
                  }
                </FormHelperText>
              )}
            </Stack>

            <Stack
              direction={{
                xs: 'column',
                sm: 'row',
              }}
              spacing={1}
              sx={{
                justifyContent:
                  'space-between',
              }}
            >
              <Button
                disabled={
                  savingItems ||
                  loading ||
                  completedItemCount >
                    0
                }
                onClick={() =>
                  append(
                    createBlankItem(
                      itemFields,
                    ),
                  )
                }
                type="button"
                variant="outlined"
              >
                Add item row
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      <Stack
        direction="row"
        spacing={1}
        sx={{
          justifyContent:
            'flex-end',
        }}
      >
        {isStockGroup ? (
          <Button
            disabled={
              savingHeader ||
              loading ||
              stockGroupRows.length === 0
            }
            form="inventory-header-form"
            type="submit"
            variant="contained"
          >
            {savingHeader
              ? 'Saving...'
              : 'Save'}
          </Button>
        ) : (
          !(isUnitOfMeasure &&
            uomMode === 'existing') && (
            <Button
              disabled={
                savingHeader ||
                loading
              }
              form="inventory-header-form"
              type="submit"
              variant="contained"
            >
              {savingHeader
                ? 'Saving...'
                : 'Save'}
            </Button>
          )
        )}

        {resource.items && (
          <Button
            disabled={
              savingItems ||
              loading
            }
            form="inventory-items-form"
            type="submit"
            variant="contained"
          >
            {savingItems
              ? 'Saving items...'
              : 'Save items'}
          </Button>
        )}

        <Button
          onClick={() =>
            navigate('/inventory')
          }
          sx={{ textTransform: 'lowercase' }}
          type="button"
          variant="outlined"
        >
          Back
        </Button>
      </Stack>

      <Paper
        component="section"
        sx={{
          p: {
            xs: 2,
            md: 4,
          },
        }}
      >
        <Stack spacing={2}>
          <div>
            <Typography variant="h5">
              Upload Data
            </Typography>
          </div>

          {resource.items && (
            <Stack
              direction={{
                xs: 'column',
                sm: 'row',
              }}
              spacing={1}
            >
              <Button
                disabled={excelUploading}
                onClick={() => {
                  setExcelTarget('record')
                  setExcelFile(null)
                  setExcelPreviewRows([])
                  setExcelPreviewColumns([])
                  setExcelMessage('')
                }}
                variant={excelTarget === 'record' ? 'contained' : 'outlined'}
              >
                {resource.label} records
              </Button>
              <Button
                disabled={excelUploading}
                onClick={() => {
                  setExcelTarget('item')
                  setExcelFile(null)
                  setExcelPreviewRows([])
                  setExcelPreviewColumns([])
                  setExcelMessage('')
                }}
                variant={excelTarget === 'item' ? 'contained' : 'outlined'}
              >
                {resource.label} line items
              </Button>
            </Stack>
          )}

          {excelMessage && (
            <Alert severity={excelMessageType}>
              {excelMessage}
            </Alert>
          )}

          <div>
            <Typography
              component="label"
              htmlFor={`inventory-excel-file-${resource.key}`}
              variant="body2"
            >
              Select Excel file
            </Typography>
            <input
              accept=".xlsx,.xls"
              disabled={excelUploading}
              id={`inventory-excel-file-${resource.key}`}
              onChange={(event) => {
                void handleExcelFileChange(event.target.files?.[0])
                event.target.value = ''
              }}
              style={{
                display: 'block',
                marginTop: 8,
              }}
              type="file"
            />
          </div>

          {excelFile && (
            <Typography variant="body2">
              Selected: <strong>{excelFile.name}</strong>
            </Typography>
          )}

          {excelPreviewRows.length > 0 && (
            <>
              <Typography variant="h6">
                Excel Preview
              </Typography>
              <TableContainer
                component={Paper}
                variant="outlined"
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {excelPreviewColumns.map((column) => (
                        <TableCell key={column}>
                          {excelFields.find(
                            (field) => field.name === column,
                          )?.name ?? column}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {excelPreviewRows.slice(0, 10).map((row, index) => (
                      <TableRow key={`excel-row-${index}`}>
                        {excelPreviewColumns.map((column) => (
                          <TableCell key={column}>
                            {String(row[column] ?? '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {excelPreviewRows.length > 10 && (
                <Typography
                  color="text.secondary"
                  variant="body2"
                >
                  Showing first 10 of {excelPreviewRows.length} rows in preview.
                </Typography>
              )}
              <div>
                <Button
                  disabled={excelUploading}
                  onClick={() => void handleExcelUpload()}
                  variant="contained"
                >
                  {excelUploading ? 'Uploading...' : 'Save'}
                </Button>
              </div>
            </>
          )}
        </Stack>
      </Paper>

      <Snackbar
        autoHideDuration={6000}
        onClose={() =>
          setSuccessMessage('')
        }
        open={successMessage !== ''}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Alert
          onClose={() =>
            setSuccessMessage('')
          }
          severity="success"
          variant="filled"
          sx={{
            width: '100%',
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Stack>
  )
}

export default InventoryResourceForm