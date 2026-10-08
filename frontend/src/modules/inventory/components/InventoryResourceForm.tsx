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
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
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

interface InventoryResourceFormProps {
  resource: InventoryResourceDefinition
}

interface InventoryFieldsProps {
  fields: InventoryFieldDefinition[]
  control: Control<InventoryFormValues>
  options: Record<string, InventoryRecord[]>
  disabled: boolean
  loading: boolean
  prefix?: `items.${number}.`
  isGoodsIssue?: boolean
  isGateEntry?: boolean
  isMaterialReceiptNote?: boolean
  isDeliveryChallan?: boolean
  isDeliveryChallanInward?: boolean
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
  )
}

function InventoryField({
  field,
  name,
  options,
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

          const values = field.choices
            ? field.choices.map((choice) => ({
                value: choice.value,
                label: choice.label,
              }))
            : options

          const noOptions =
            !field.choices &&
            values.length === 0

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
                <FormHelperText>
                  {loading
                    ? 'Loading live options...'
                    : field.optionsEndpoint
                      ? `No options returned from ${field.optionsEndpoint}.`
                      : 'No choices are configured.'}
                </FormHelperText>
              )}
            </FormControl>
          )
        }

        if (field.kind === 'boolean') {
          return (
            <FormControl
              error={Boolean(fieldState.error)}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      controlField.value === true
                    }
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

                    {records.map(
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
                          No UOM records
                          available
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
                        options={options}
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
          type="button"
          variant="outlined"
        >
          Back
        </Button>
      </Stack>

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