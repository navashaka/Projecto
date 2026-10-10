import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiClient from '../../../services/apiClient'
import { glGroupDefaults } from '../constants/glGroupDefaults'
import { glResourceMap } from '../constants/glResources'
import type {
  GLFieldDefinition,
  GLRecord,
  GLResourceDefinition,
} from '../types'

type FormValue = string | boolean
type FormValues = Record<string, FormValue>
type OptionCollections = Record<string, GLRecord[]>
type Payload = Record<string, string | number | boolean | null>

const frontendDefaultGroupPrefix = 'frontend-default:gl-group:'

const accountGroupSpecificFields: Record<string, string[]> = {
  depreciation_applicable: ['Fixed Assets'],
  loan_taken_date: ['Secured Loans', 'Unsecured Loans'],
  interest_rate: ['Secured Loans', 'Unsecured Loans'],
  interest_effective_date: ['Secured Loans', 'Unsecured Loans'],
  maintain_bill_wise: ['Sundry Creditors', 'Sundry Debtors'],
  default_credit_days: ['Sundry Creditors', 'Sundry Debtors'],
  check_credit_days_on_voucher: ['Sundry Creditors', 'Sundry Debtors'],
}

interface NestedForm {
  id: number
  resourceKey: string
  sourceFieldName: string
  optionEndpoint?: string
  editingRecord?: GLRecord
  values: FormValues
  optionCollections: OptionCollections
  loadingOptions: boolean
  saving: boolean
  error: string
}

function readRecords(value: unknown, endpoint: string): GLRecord[] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (record) =>
        typeof record === 'object' &&
        record !== null &&
        !Array.isArray(record),
    )
  ) {
    throw new Error(`The response from ${endpoint} was not a record list.`)
  }

  return value as GLRecord[]
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response
    if (
      typeof response === 'object' &&
      response !== null &&
      'data' in response
    ) {
      const data = response.data
      if (typeof data === 'object' && data !== null && 'detail' in data) {
        const detail = data.detail
        if (typeof detail === 'string') {
          return detail
        }
        if (Array.isArray(detail)) {
          return detail
            .map((item) => {
              if (
                typeof item === 'object' &&
                item !== null &&
                'msg' in item &&
                typeof item.msg === 'string'
              ) {
                return item.msg
              }
              return ''
            })
            .filter(Boolean)
            .join('; ')
        }
      }
    }
  }

  return error instanceof Error ? error.message : fallback
}

function getInitialValues(resource: GLResourceDefinition): FormValues {
  return Object.fromEntries(
    resource.fields.map((field) => [
      field.name,
      field.kind === 'boolean' ? false : '',
    ]),
  )
}

function buildPayload(
  resource: GLResourceDefinition,
  values: FormValues,
  allowIncompleteBankLinks = false,
): { payload?: Payload; error?: string } {
  const missingField = resource.fields.find((field) => {
    const value = values[field.name]
    return (
      field.required &&
      (value === undefined ||
        value === '' ||
        (typeof value === 'string' && value.trim() === ''))
    )
  })
  if (missingField) {
    return { error: `${missingField.label} is required.` }
  }

  if (resource.key === 'accounts' && values.tax_applicable === true) {
    const type = values.hsn_sac_type
    const hasHsn = typeof values.hsn_id === 'string' && values.hsn_id !== ''
    const hasSac = typeof values.sac_id === 'string' && values.sac_id !== ''
    if (
      (type !== 'HSN' && type !== 'SAC') ||
      (type === 'HSN' && (!hasHsn || hasSac)) ||
      (type === 'SAC' && (!hasSac || hasHsn))
    ) {
      return { error: 'Choose exactly one HSN or SAC classification.' }
    }
  }

  if (resource.key === 'bank-accounts' && !allowIncompleteBankLinks) {
    if (
      values.enable_cheque_issue === true &&
      !values.__cheque_range_id
    ) {
      return {
        error: 'Select or create a cheque range for this bank account.',
      }
    }
    if (
      values.__od_limit_enabled === true &&
      !values.__od_limit_id
    ) {
      return {
        error: 'Create or select an OD Limit for this bank account.',
      }
    }
  }

  const unsavedDefault = resource.fields.find((field) => {
    const value = values[field.name]
    return (
      field.kind === 'select' &&
      typeof value === 'string' &&
      value.startsWith('frontend-default:')
    )
  })
  if (unsavedDefault) {
    return {
      error: `${unsavedDefault.label} is a frontend-only default. Save that record in its master form first, then select the saved record.`,
    }
  }

  const payload: Payload = {}
  for (const field of resource.fields) {
    let value = values[field.name]
    if (
      resource.key === 'accounts' &&
      values.tax_applicable !== true &&
      ['hsn_sac_type', 'hsn_id', 'sac_id'].includes(field.name)
    ) {
      value = ''
    }

    if (field.kind === 'boolean') {
      payload[field.name] = value === true
    } else if (value === undefined || value === '') {
      payload[field.name] = null
    } else if (field.kind === 'number' || field.kind === 'select') {
      const numericValue = Number(value)
      if (!Number.isFinite(numericValue)) {
        return { error: `${field.label} must be a valid number.` }
      }
      payload[field.name] = numericValue
    } else {
      payload[field.name] = String(value).trim()
    }
  }

  return { payload }
}

function getOptionLabel(
  record: GLRecord,
  fields: string[],
): string {
  return fields
    .map((field) => record[field])
    .filter(
      (value): value is string | number =>
        typeof value === 'string' || typeof value === 'number',
    )
    .map(String)
    .join(' - ')
}

function normalizeGroupName(name: string): string {
  return name.trim().toLowerCase()
}

function getFieldOptions(
  field: GLFieldDefinition,
  collections: OptionCollections,
): Array<{ value: string; label: string }> {
  const saved = (collections[field.optionEndpoint ?? ''] ?? []).flatMap(
    (record) => {
      if (
        typeof record.id !== 'number' &&
        typeof record.id !== 'string'
      ) {
        return []
      }
      return [{
        value: String(record.id),
        label: getOptionLabel(record, field.optionLabelFields ?? []),
      }]
    },
  )

  if (field.optionEndpoint !== '/gl-groups/') {
    return saved
  }

  const savedGroupNames = new Set<string>()
  const uniqueSavedGroups = saved.filter((option) => {
    const normalizedName = normalizeGroupName(option.label)
    if (!normalizedName || savedGroupNames.has(normalizedName)) {
      return false
    }
    savedGroupNames.add(normalizedName)
    return true
  })

  const defaults = glGroupDefaults
    .filter((group) => !savedGroupNames.has(normalizeGroupName(group)))
    .map((group) => ({
      value: `frontend-default:gl-group:${group}`,
      label: group,
    }))

  return [...defaults, ...uniqueSavedGroups]
}

function formatCellValue(
  value: unknown,
  field: string,
  optionCollections: OptionCollections,
): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  const collectionEndpoint = field === 'parent_group_id'
    ? '/gl-groups/'
    : field === 'group_id'
      ? '/gl-groups/'
      : field === 'tax_type_id'
        ? '/gl-tax-types/'
        : field === 'gl_account_id' || field === 'account_id'
          ? '/gl-accounts/'
          : field === 'hsn_id'
            ? '/gl-hsn-masters/'
            : field === 'sac_id'
              ? '/gl-sac-masters/'
              : field === 'bank_account_id'
                ? '/gl-bank-accounts/'
                : undefined

  if (collectionEndpoint) {
    const record = optionCollections[collectionEndpoint]?.find(
      (option) => String(option.id) === String(value),
    )
    if (record) {
      const labelFields = collectionEndpoint === '/gl-bank-accounts/'
        ? ['account_holder_name', 'bank_name', 'account_number']
        : collectionEndpoint === '/gl-hsn-masters/'
          ? ['hsn_code']
          : collectionEndpoint === '/gl-sac-masters/'
            ? ['sac_code']
            : ['name']
      return getOptionLabel(record, labelFields) || String(value)
    }
  }

  return String(value)
}

function getInputValue(record: GLRecord, field: GLFieldDefinition): FormValue {
  const value = record[field.name]
  if (field.kind === 'boolean') {
    return value === true
  }
  if (field.kind === 'date' && typeof value === 'string') {
    return value.slice(0, 10)
  }
  return value === null || value === undefined ? '' : String(value)
}

function GLResourcePage() {
  const { resourceKey } = useParams<{ resourceKey: string }>()
  const navigate = useNavigate()
  const resource = resourceKey ? glResourceMap[resourceKey] : undefined
  const [records, setRecords] = useState<GLRecord[]>([])
  const [optionCollections, setOptionCollections] =
    useState<OptionCollections>({})
  const [formValues, setFormValues] = useState<FormValues>({})
  const [nestedForms, setNestedForms] = useState<NestedForm[]>([])
  const nextNestedId = useRef(0)
  const [relatedSuccess, setRelatedSuccess] = useState('')
  const [editingRecord, setEditingRecord] = useState<GLRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')

  const optionEndpoints = useMemo(
    () => {
      if (!resource) {
        return []
      }
      const endpoints = resource.fields
        .map((field) => field.optionEndpoint)
        .filter((endpoint): endpoint is string => Boolean(endpoint))
      if (resource.key === 'bank-accounts') {
        endpoints.push('/gl-cheque-ranges/', '/gl-od-limits/')
      }
      return [...new Set(endpoints)]
    },
    [resource],
  )

  const loadRecords = useCallback(async () => {
    if (!resource) {
      return
    }
    setLoading(true)
    setError('')
    try {
      const [recordResponse, ...optionResponses] = await Promise.all([
        apiClient.get<unknown>(resource.endpoint),
        ...optionEndpoints.map((endpoint) => apiClient.get<unknown>(endpoint)),
      ])
      setRecords(readRecords(recordResponse.data, resource.endpoint))
      setOptionCollections(
        Object.fromEntries(
          optionEndpoints.map((endpoint, index) => [
            endpoint,
            readRecords(optionResponses[index]?.data, endpoint),
          ]),
        ),
      )
    } catch (loadError) {
      setError(
        getErrorMessage(
          loadError,
          `Unable to load ${resource.label.toLowerCase()} records.`,
        ),
      )
    } finally {
      setLoading(false)
    }
  }, [optionEndpoints, resource])

  useEffect(() => {
    void Promise.resolve().then(loadRecords)
  }, [loadRecords])

  if (!resource) {
    return (
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5">GL resource not found</Typography>
        <Button onClick={() => navigate('/gl')} sx={{ mt: 2 }} variant="contained">
          Back to GL
        </Button>
      </Paper>
    )
  }

  const openAdd = () => {
    setNestedForms([])
    setRelatedSuccess('')
    setEditingRecord(null)
    setFormValues({
      ...getInitialValues(resource),
      ...(resource.key === 'bank-accounts'
        ? {
            __cheque_range_id: '',
            __od_limit_enabled: false,
            __od_limit_id: '',
          }
        : {}),
    })
    setFormError('')
    setDialogOpen(true)
  }

  const openEdit = (record: GLRecord) => {
    setNestedForms([])
    setRelatedSuccess('')
    setEditingRecord(record)
    const initialValues = Object.fromEntries(
        resource.fields.map((field) => [
          field.name,
          getInputValue(record, field),
        ]),
      )
    if (resource.key === 'bank-accounts') {
      const bankId = String(record.id)
      const chequeRange = (optionCollections['/gl-cheque-ranges/'] ?? []).find(
        (range) => String(range.bank_account_id) === bankId,
      )
      const odLimit = (optionCollections['/gl-od-limits/'] ?? []).find(
        (item) => String(item.bank_account_id) === bankId,
      )
      Object.assign(initialValues, {
        __cheque_range_id:
          chequeRange?.id === undefined ? '' : String(chequeRange.id),
        __od_limit_enabled: Boolean(odLimit),
        __od_limit_id: odLimit?.id === undefined ? '' : String(odLimit.id),
      })
    }
    setFormValues(initialValues)
    setFormError('')
    setDialogOpen(true)
  }

  const saveRecord = async () => {
    const result = buildPayload(resource, formValues)
    if (!result.payload) {
      setFormError(result.error ?? 'The form contains invalid values.')
      return
    }

    setSaving(true)
    setFormError('')
    setError('')
    setSuccess('')
    try {
      if (editingRecord?.id === undefined) {
        await apiClient.post(resource.endpoint, result.payload)
      } else {
        await apiClient.put(
          `${resource.endpoint}${editingRecord.id}`,
          result.payload,
        )
      }

      setDialogOpen(false)
      setSuccess(`${resource.label} saved successfully.`)
      await loadRecords()
    } catch (saveError) {
      setFormError(
        getErrorMessage(
          saveError,
          `Unable to save ${resource.label.toLowerCase()}.`,
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  const loadNestedOptions = async (
    nestedId: number,
    nestedResource: GLResourceDefinition,
  ) => {
    setNestedForms((current) =>
      current.map((form) =>
        form.id === nestedId
          ? { ...form, loadingOptions: true, error: '' }
          : form,
      ),
    )
    try {
      const endpoints = [...new Set(
        nestedResource.fields
          .map((field) => field.optionEndpoint)
          .filter((endpoint): endpoint is string => Boolean(endpoint)),
      )]
      const responses = await Promise.all(
        endpoints.map((endpoint) => apiClient.get<unknown>(endpoint)),
      )
      const collections = Object.fromEntries(
        endpoints.map((endpoint, index) => [
          endpoint,
          readRecords(responses[index]?.data, endpoint),
        ]),
      )
      setNestedForms((current) =>
        current.map((form) =>
          form.id === nestedId
            ? { ...form, optionCollections: collections, loadingOptions: false }
            : form,
        ),
      )
    } catch (loadError) {
      setNestedForms((current) =>
        current.map((form) =>
          form.id === nestedId
            ? {
                ...form,
                loadingOptions: false,
                error: getErrorMessage(
                  loadError,
                  `Unable to load ${nestedResource.label.toLowerCase()} options.`,
                ),
              }
            : form,
        ),
      )
    }
  }

  const saveBankAccountBeforeRelatedRecord = async (): Promise<
    number | string | undefined
  > => {
    if (resource.key !== 'bank-accounts') {
      return undefined
    }
    const result = buildPayload(resource, formValues, true)
    if (!result.payload) {
      setFormError(result.error ?? 'The form contains invalid values.')
      return undefined
    }

    setSaving(true)
    setFormError('')
    setError('')
    setSuccess('')
    try {
      const response =
        editingRecord?.id === undefined
          ? await apiClient.post<unknown>(resource.endpoint, result.payload)
          : await apiClient.put<unknown>(
              `${resource.endpoint}${editingRecord.id}`,
              result.payload,
            )
      if (
        typeof response.data !== 'object' ||
        response.data === null ||
        !('id' in response.data) ||
        (typeof response.data.id !== 'number' &&
          typeof response.data.id !== 'string')
      ) {
        throw new Error(
          'The bank account was saved, but its response did not include an ID.',
        )
      }
      const savedAccount = response.data as GLRecord
      setEditingRecord(savedAccount)
      setSuccess('Bank account saved successfully.')
      await loadRecords()
      return savedAccount.id as number | string
    } catch (saveError) {
      setFormError(
        getErrorMessage(saveError, 'Unable to save the bank account.'),
      )
      return undefined
    } finally {
      setSaving(false)
    }
  }

  const openNestedCreate = (
    resourceKey: string,
    sourceFieldName: string,
    options: {
      initialValues?: FormValues
      optionEndpoint?: string
      editingRecord?: GLRecord
    } = {},
  ) => {
    const nestedResource = glResourceMap[resourceKey]
    if (!nestedResource) {
      setFormError(`The related GL resource "${resourceKey}" is unavailable.`)
      return
    }
    const nestedId = nextNestedId.current++
    setRelatedSuccess('')
    setNestedForms((current) => [
      ...current,
      {
        id: nestedId,
        resourceKey,
        sourceFieldName,
        optionEndpoint: options.optionEndpoint,
        editingRecord: options.editingRecord,
        values: {
          ...getInitialValues(nestedResource),
          ...options.initialValues,
        },
        optionCollections: {},
        loadingOptions: true,
        saving: false,
        error: '',
      },
    ])
    void loadNestedOptions(nestedId, nestedResource)
  }

  const openBankRelatedWorkflow = async (
    resourceKey: 'cheque-ranges' | 'od-limits',
    selectionField: '__cheque_range_id' | '__od_limit_id',
    endpoint: string,
    existingRecord?: GLRecord,
  ) => {
    const bankAccountId = await saveBankAccountBeforeRelatedRecord()
    if (bankAccountId === undefined) {
      return
    }
    const relatedResource = glResourceMap[resourceKey]
    const initialValues = existingRecord
      ? Object.fromEntries(
          relatedResource.fields.map((field) => [
            field.name,
            getInputValue(existingRecord, field),
          ]),
        )
      : getInitialValues(relatedResource)
    initialValues.bank_account_id = String(bankAccountId)
    openNestedCreate(resourceKey, selectionField, {
      initialValues,
      optionEndpoint: endpoint,
      editingRecord: existingRecord,
    })
  }

  const saveNestedRecord = async () => {
    const nested = nestedForms[nestedForms.length - 1]
    const nestedResource = nested && glResourceMap[nested.resourceKey]
    if (!nested || !nestedResource) {
      return
    }

    const result = buildPayload(nestedResource, nested.values)
    if (!result.payload) {
      setNestedForms((current) =>
        current.map((form) =>
          form.id === nested.id
            ? { ...form, error: result.error ?? 'The form contains invalid values.' }
            : form,
        ),
      )
      return
    }

    setNestedForms((current) =>
      current.map((form) =>
        form.id === nested.id ? { ...form, saving: true, error: '' } : form,
      ),
    )
    try {
      const response = nested.editingRecord?.id === undefined
        ? await apiClient.post<unknown>(
            nestedResource.endpoint,
            result.payload,
          )
        : await apiClient.put<unknown>(
            `${nestedResource.endpoint}${nested.editingRecord.id}`,
            result.payload,
          )
      if (
        typeof response.data !== 'object' ||
        response.data === null ||
        !('id' in response.data) ||
        (typeof response.data.id !== 'number' &&
          typeof response.data.id !== 'string')
      ) {
        throw new Error(
          `${nestedResource.label} was saved, but the response did not include its record ID.`,
        )
      }

      const createdRecord = response.data as GLRecord
      const parentForms = nestedForms.slice(0, -1)
      const parentResource = parentForms.length
        ? glResourceMap[parentForms[parentForms.length - 1]?.resourceKey ?? '']
        : resource
      const parentField = parentResource?.fields.find(
        (field) => field.name === nested.sourceFieldName,
      )
      const optionEndpoint = nested.optionEndpoint ?? parentField?.optionEndpoint
      let refreshedOptions: GLRecord[] = []
      if (optionEndpoint) {
        try {
          const optionsResponse = await apiClient.get<unknown>(optionEndpoint)
          refreshedOptions = readRecords(optionsResponse.data, optionEndpoint)
        } catch (refreshError) {
          setError(
            `Saved ${nestedResource.label.toLowerCase()}, but its dropdown could not be refreshed: ${getErrorMessage(refreshError, 'Refresh failed.')}`,
          )
          refreshedOptions = [createdRecord]
        }
      }

      const selectedValue = String(createdRecord.id)
      if (parentForms.length === 0) {
        setFormValues((current) => ({
          ...current,
          [nested.sourceFieldName]: selectedValue,
        }))
        if (optionEndpoint) {
          setOptionCollections((current) => ({
            ...current,
            [optionEndpoint]: refreshedOptions,
          }))
        }
      } else {
        const parentId = parentForms[parentForms.length - 1]?.id
        setNestedForms((current) =>
          current.map((form) =>
            form.id === parentId
              ? {
                  ...form,
                  values: {
                    ...form.values,
                    [nested.sourceFieldName]: selectedValue,
                  },
                  optionCollections: optionEndpoint
                    ? {
                        ...form.optionCollections,
                        [optionEndpoint]: refreshedOptions,
                      }
                    : form.optionCollections,
                }
              : form,
          ),
        )
      }

      setNestedForms((current) => current.slice(0, -1))
      setRelatedSuccess(`${nestedResource.label} saved successfully.`)
    } catch (saveError) {
      setNestedForms((current) =>
        current.map((form) =>
          form.id === nested.id
            ? {
                ...form,
                saving: false,
                error: getErrorMessage(
                  saveError,
                  `Unable to save ${nestedResource.label.toLowerCase()}.`,
                ),
              }
            : form,
        ),
      )
    }
  }

  const deleteRecord = async (record: GLRecord) => {
    if (record.id === undefined) {
      return
    }
    if (!window.confirm(`Delete this ${resource.label.toLowerCase()} record?`)) {
      return
    }
    setError('')
    setSuccess('')
    try {
      await apiClient.delete(`${resource.endpoint}${record.id}`)
      setSuccess(`${resource.label} deleted successfully.`)
      await loadRecords()
    } catch (deleteError) {
      setError(
        getErrorMessage(
          deleteError,
          `Unable to delete ${resource.label.toLowerCase()}.`,
        ),
      )
    }
  }

  const renderField = (
    field: GLFieldDefinition,
    activeResourceKey: string,
    values: FormValues,
    setValues: (update: (current: FormValues) => FormValues) => void,
    collections: OptionCollections,
    allowNestedCreate: boolean,
  ) => {
    const value = values[field.name] ?? (field.kind === 'boolean' ? false : '')
    if (field.kind === 'boolean') {
      const accountYesNo =
        activeResourceKey === 'accounts' &&
        [
          'tax_applicable',
          'costing_applicable',
          'depreciation_applicable',
          'maintain_bill_wise',
          'check_credit_days_on_voucher',
        ].includes(field.name)
      const accountDetailYesNo =
        ['sundry-creditors', 'sundry-debtors'].includes(activeResourceKey) &&
        [
          'maintain_bill_wise',
          'check_credit_days_on_voucher_entry',
        ].includes(field.name)
      const bankYesNo =
        activeResourceKey === 'bank-accounts' &&
        ['enable_cheque_issue', 'enable_e_payments'].includes(field.name)
      if (accountYesNo || accountDetailYesNo || bankYesNo) {
        return (
          <FormControl key={field.name}>
            <FormLabel>{field.label}</FormLabel>
            <RadioGroup
              onChange={(event) =>
                setValues((current) => {
                  const enabled = event.target.value === 'yes'
                  const updated = { ...current, [field.name]: enabled }
                  if (field.name === 'tax_applicable' && !enabled) {
                    updated.hsn_sac_type = ''
                    updated.hsn_id = ''
                    updated.sac_id = ''
                  }
                  if (
                    field.name === 'enable_cheque_issue' &&
                    !enabled
                  ) {
                    updated.__cheque_range_id = ''
                  }
                  return updated
                })
              }
              row
              value={value === true ? 'yes' : 'no'}
            >
              <FormControlLabel control={<Radio />} label="Yes" value="yes" />
              <FormControlLabel control={<Radio />} label="No" value="no" />
            </RadioGroup>
          </FormControl>
        )
      }
      return (
        <FormControlLabel
          key={field.name}
          control={
            <Checkbox
              checked={value === true}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [field.name]: event.target.checked,
                }))
              }
            />
          }
          label={field.label}
        />
      )
    }

    if (field.kind === 'select') {
      const options = getFieldOptions(field, collections)
      return (
        <Stack key={field.name} spacing={1}>
          <TextField
            fullWidth
            label={field.label}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                [field.name]: event.target.value,
              }))
            }
            required={field.required}
            select
            size="small"
            value={value}
          >
            {!field.required && <MenuItem value="">None</MenuItem>}
            {options.map((option, index) => (
              <MenuItem
                key={option.value || String(index)}
                value={option.value}
              >
                {option.label || `Record ${option.value}`}
              </MenuItem>
            ))}
            {options.length === 0 && (
              <MenuItem disabled value="">
                No records available
              </MenuItem>
            )}
          </TextField>
          {allowNestedCreate && field.createResourceKey && (
            <Button
              onClick={() => {
                const defaultGroupName =
                  field.name === 'group_id' &&
                  typeof value === 'string' &&
                  value.startsWith(frontendDefaultGroupPrefix)
                    ? value.slice(frontendDefaultGroupPrefix.length)
                    : ''
                openNestedCreate(field.createResourceKey ?? '', field.name, {
                  initialValues: defaultGroupName
                    ? { name: defaultGroupName, is_default: true }
                    : undefined,
                })
              }}
              size="small"
              sx={{ alignSelf: 'flex-start' }}
              variant="outlined"
            >
              {field.createResourceKey === 'accounts'
                ? 'Create GL Account'
                : field.createResourceKey === 'groups'
                  ? 'Create Group'
                  : field.createResourceKey === 'hsn-masters'
                    ? 'Create HSN'
                    : 'Create SAC'}
            </Button>
          )}
        </Stack>
      )
    }

    return (
      <TextField
        fullWidth
        key={field.name}
        label={field.label}
        multiline={field.kind === 'textarea'}
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            [field.name]: event.target.value,
          }))
        }
        required={field.required}
        rows={field.kind === 'textarea' ? 3 : undefined}
        size="small"
        slotProps={
          field.kind === 'number'
            ? { htmlInput: { min: 0, step: field.step ?? 'any' } }
            : undefined
        }
        type={
          field.kind === 'number'
            ? 'number'
            : field.kind === 'date'
              ? 'date'
              : 'text'
        }
        value={value}
      />
    )
  }

  const renderResourceFields = (
    activeResource: GLResourceDefinition,
    values: FormValues,
    setValues: (update: (current: FormValues) => FormValues) => void,
    collections: OptionCollections,
    allowNestedCreate: boolean,
  ) => {
    const selectedGroupId = values.group_id
    const selectedGroup = collections['/gl-groups/']?.find(
      (group) => String(group.id) === String(selectedGroupId),
    )
    const selectedGroupName =
      typeof selectedGroup?.name === 'string'
        ? selectedGroup.name
        : typeof selectedGroupId === 'string' &&
            selectedGroupId.startsWith(frontendDefaultGroupPrefix)
          ? selectedGroupId.slice(frontendDefaultGroupPrefix.length)
          : ''
    const isFixedAssets =
      activeResource.key === 'accounts' &&
      selectedGroupName === 'Fixed Assets'
    const bankAccountId =
      activeResource.key === 'bank-accounts' &&
      !activeNestedForm &&
      editingRecord?.id !== undefined
        ? String(editingRecord.id)
        : ''
    const bankChequeRanges = (collections['/gl-cheque-ranges/'] ?? []).filter(
      (range) => String(range.bank_account_id) === bankAccountId,
    )
    const bankOdLimits = (collections['/gl-od-limits/'] ?? []).filter(
      (odLimit) => String(odLimit.bank_account_id) === bankAccountId,
    )

    return (
      <Grid container spacing={2}>
      {activeResource.fields
        .filter(
          (field) => {
            if (activeResource.key !== 'accounts') {
              return true
            }
            if (['hsn_sac_type', 'hsn_id', 'sac_id'].includes(field.name)) {
              return false
            }
            const applicableGroups = accountGroupSpecificFields[field.name]
            return (
              applicableGroups === undefined ||
              applicableGroups.includes(selectedGroupName)
            )
          },
        )
        .map((field) => (
          <Grid key={field.name} size={{ xs: 12, sm: 6 }}>
            {renderField(
              field,
              activeResource.key,
              values,
              setValues,
              collections,
              allowNestedCreate,
            )}
          </Grid>
        ))}
      {activeResource.key === 'accounts' && values.tax_applicable === true && (
        <Grid size={{ xs: 12 }}>
          <Stack spacing={2}>
            <FormControl required>
              <FormLabel>Tax classification</FormLabel>
              <RadioGroup
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    hsn_sac_type: event.target.value,
                    hsn_id: '',
                    sac_id: '',
                  }))
                }
                row
                value={values.hsn_sac_type ?? ''}
              >
                <FormControlLabel
                  control={<Radio />}
                  label="HSN"
                  value="HSN"
                />
                <FormControlLabel
                  control={<Radio />}
                  label="SAC"
                  value="SAC"
                />
              </RadioGroup>
            </FormControl>
            {values.hsn_sac_type === 'HSN' &&
              renderField(
                { ...glResourceMap.accounts.fields.find((field) => field.name === 'hsn_id')!, required: true },
                activeResource.key,
                values,
                setValues,
                collections,
                allowNestedCreate,
              )}
            {values.hsn_sac_type === 'SAC' &&
              renderField(
                { ...glResourceMap.accounts.fields.find((field) => field.name === 'sac_id')!, required: true },
                activeResource.key,
                values,
                setValues,
                collections,
                allowNestedCreate,
              )}
          </Stack>
        </Grid>
      )}
      {isFixedAssets && values.depreciation_applicable === true && (
        <Grid size={{ xs: 12 }}>
          <Stack spacing={2}>
            <Alert severity="info">
              The current GL Account schema stores whether depreciation applies
              but does not define additional depreciation configuration fields.
              These related account workflows remain separate; no group
              hierarchy is changed.
            </Alert>
            <Typography variant="subtitle2">
              Related GL Account workflows
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              {[
                'Secured Loans',
                'Unsecured Loans',
                'Sundry Creditors',
                'Sundry Debtors',
              ].map((groupName) => (
                <Button
                  key={groupName}
                  onClick={() => {
                    const group = collections['/gl-groups/']?.find(
                      (record) => record.name === groupName,
                    )
                    openNestedCreate(
                      'accounts',
                      `__related_account_${groupName}`,
                      {
                        initialValues: {
                          group_id: group?.id === undefined
                            ? `frontend-default:gl-group:${groupName}`
                            : String(group.id),
                        },
                      },
                    )
                  }}
                  variant="outlined"
                >
                  Create {groupName} Account
                </Button>
              ))}
            </Stack>
          </Stack>
        </Grid>
      )}
      {activeResource.key === 'bank-accounts' &&
        values.enable_cheque_issue === true && (
          <Grid size={{ xs: 12 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2">Cheque range</Typography>
              {!bankAccountId ? (
                <Alert severity="info">
                  Save the bank account before linking a cheque range.
                </Alert>
              ) : (
                <TextField
                  fullWidth
                  label="Existing cheque range"
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      __cheque_range_id: event.target.value,
                    }))
                  }
                  select
                  size="small"
                  value={values.__cheque_range_id ?? ''}
                >
                  <MenuItem value="">Select a cheque range</MenuItem>
                  {bankChequeRanges.map((chequeRange) => (
                    <MenuItem
                      key={String(chequeRange.id)}
                      value={String(chequeRange.id)}
                    >
                      {`${String(chequeRange.from_number ?? '')} - ${String(chequeRange.to_number ?? '')}`}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <Button
                disabled={saving}
                onClick={() =>
                  void openBankRelatedWorkflow(
                    'cheque-ranges',
                    '__cheque_range_id',
                    '/gl-cheque-ranges/',
                  )
                }
                size="small"
                sx={{ alignSelf: 'flex-start' }}
                variant="outlined"
              >
                Create Cheque Range
              </Button>
            </Stack>
          </Grid>
        )}
      {activeResource.key === 'bank-accounts' &&
        values.enable_e_payments === true && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="info">
              E-payments are enabled. The existing GL backend supports this
              Yes/No setting only; it provides no additional e-payment fields
              or configuration API.
            </Alert>
          </Grid>
        )}
      {activeResource.key === 'bank-accounts' && (
        <Grid size={{ xs: 12 }}>
          <Stack spacing={2}>
            <FormControl>
              <FormLabel>OD Limit Enabled</FormLabel>
              <RadioGroup
                onChange={(event) => {
                  const enabled = event.target.value === 'yes'
                  setValues((current) => ({
                    ...current,
                    __od_limit_enabled: enabled,
                    __od_limit_id: enabled ? current.__od_limit_id ?? '' : '',
                  }))
                }}
                row
                value={values.__od_limit_enabled === true ? 'yes' : 'no'}
              >
                <FormControlLabel control={<Radio />} label="Yes" value="yes" />
                <FormControlLabel control={<Radio />} label="No" value="no" />
              </RadioGroup>
              <FormHelperText>
                OD details are stored as OD Limit records linked to this bank
                account.
              </FormHelperText>
            </FormControl>
            {values.__od_limit_enabled === true && (
              <Stack spacing={1}>
                {!bankAccountId ? (
                  <Alert severity="info">
                    Save the bank account before configuring its OD Limit.
                  </Alert>
                ) : (
                  <TextField
                    fullWidth
                    label="Existing OD Limit"
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        __od_limit_id: event.target.value,
                      }))
                    }
                    select
                    size="small"
                    value={values.__od_limit_id ?? ''}
                  >
                    <MenuItem value="">Select an OD Limit</MenuItem>
                    {bankOdLimits.map((odLimit) => (
                      <MenuItem
                        key={String(odLimit.id)}
                        value={String(odLimit.id)}
                      >
                        {`${String(odLimit.od_limit ?? '-')} / ${String(odLimit.rate_of_interest ?? '-')}% / ${String(odLimit.effective_date ?? '-')}`}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
                <Button
                  disabled={saving}
                  onClick={() => {
                    const selectedOdLimit = bankOdLimits.find(
                      (item) =>
                        String(item.id) === String(values.__od_limit_id),
                    )
                    void openBankRelatedWorkflow(
                      'od-limits',
                      '__od_limit_id',
                      '/gl-od-limits/',
                      selectedOdLimit,
                    )
                  }}
                  size="small"
                  sx={{ alignSelf: 'flex-start' }}
                  variant="outlined"
                >
                  {values.__od_limit_id
                    ? 'Alter OD Limit'
                    : 'Create OD Limit'}
                </Button>
              </Stack>
            )}
          </Stack>
        </Grid>
      )}
      </Grid>
    )
  }

  const activeNestedForm = nestedForms[nestedForms.length - 1]
  const activeNestedResource = activeNestedForm
    ? glResourceMap[activeNestedForm.resourceKey]
    : undefined

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <div>
          <Typography variant="h4">{resource.label}</Typography>
        </div>
        <Stack direction="row" spacing={1}>
          <Button onClick={() => navigate('/gl')} variant="outlined">
            GL Home
          </Button>
          <Button onClick={openAdd} variant="contained">
            Add {resource.label}
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      {loading && <Alert severity="info">Loading {resource.label.toLowerCase()}...</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              {resource.columns.map((column) => (
                <TableCell key={column.field}>{column.label}</TableCell>
              ))}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && records.length === 0 && (
              <TableRow>
                <TableCell colSpan={resource.columns.length + 2}>
                  No {resource.label.toLowerCase()} records found.
                </TableCell>
              </TableRow>
            )}
            {records.map((record, index) => (
              <TableRow key={String(record.id ?? index)}>
                <TableCell>{String(record.id ?? '-')}</TableCell>
                {resource.columns.map((column) => (
                  <TableCell key={column.field}>
                    {formatCellValue(
                      record[column.field],
                      column.field,
                      optionCollections,
                    )}
                  </TableCell>
                ))}
                <TableCell align="right">
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ justifyContent: 'flex-end' }}
                  >
                    <Button onClick={() => openEdit(record)} size="small">
                      Edit
                    </Button>
                    <Button
                      color="error"
                      onClick={() => void deleteRecord(record)}
                      size="small"
                    >
                      Delete
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        fullWidth
        maxWidth="md"
        onClose={() => {
          if (activeNestedForm) {
            if (!activeNestedForm.saving) {
              setNestedForms((current) => current.slice(0, -1))
            }
          } else if (!saving) {
            setDialogOpen(false)
          }
        }}
        open={dialogOpen}
      >
        <DialogTitle>
          {activeNestedResource
            ? `Add ${activeNestedResource.label}`
            : `${editingRecord ? 'Edit' : 'Add'} ${resource.label}`}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {activeNestedForm && activeNestedResource ? (
              <>
                {activeNestedForm.error && (
                  <Alert
                    action={
                      !activeNestedForm.loadingOptions &&
                      activeNestedForm.error.startsWith('Unable to load')
                        ? (
                            <Button
                              color="inherit"
                              onClick={() =>
                                void loadNestedOptions(
                                  activeNestedForm.id,
                                  activeNestedResource,
                                )
                              }
                              size="small"
                            >
                              Retry
                            </Button>
                          )
                        : undefined
                    }
                    severity="error"
                  >
                    {activeNestedForm.error}
                  </Alert>
                )}
                {activeNestedForm.loadingOptions && (
                  <Alert severity="info">
                    Loading related GL records...
                  </Alert>
                )}
                {relatedSuccess && (
                  <Alert severity="success">{relatedSuccess}</Alert>
                )}
                {renderResourceFields(
                  activeNestedResource,
                  activeNestedForm.values,
                  (update) =>
                    setNestedForms((current) =>
                      current.map((form) =>
                        form.id === activeNestedForm.id
                          ? { ...form, values: update(form.values) }
                          : form,
                      ),
                    ),
                  activeNestedForm.optionCollections,
                  true,
                )}
              </>
            ) : (
              <>
                {formError && <Alert severity="error">{formError}</Alert>}
                {renderResourceFields(
                  resource,
                  formValues,
                  setFormValues,
                  optionCollections,
                  true,
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          {activeNestedForm ? (
            <>
              <Button
                disabled={activeNestedForm.saving}
                onClick={() => {
                  setRelatedSuccess('')
                  setNestedForms((current) => current.slice(0, -1))
                }}
              >
                Back
              </Button>
              <Button
                disabled={
                  activeNestedForm.saving || activeNestedForm.loadingOptions
                }
                onClick={() => void saveNestedRecord()}
                variant="contained"
              >
                {activeNestedForm.saving ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : (
            <>
              <Button disabled={saving} onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={saving}
                onClick={() => void saveRecord()}
                variant="contained"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default GLResourcePage
