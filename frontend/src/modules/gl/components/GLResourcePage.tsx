import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
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
import { useCallback, useEffect, useMemo, useState } from 'react'
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

  const defaults = glGroupDefaults
    .filter((group) =>
      !saved.some((option) => option.label === group),
    )
    .map((group) => ({
      value: `frontend-default:gl-group:${group}`,
      label: group,
    }))

  return [...defaults, ...saved]
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
        : field === 'gl_account_id'
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
  const [editingRecord, setEditingRecord] = useState<GLRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')

  const optionEndpoints = useMemo(
    () =>
      resource
        ? [...new Set(
            resource.fields
              .map((field) => field.optionEndpoint)
              .filter((endpoint): endpoint is string => Boolean(endpoint)),
          )]
        : [],
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
    setEditingRecord(null)
    setFormValues(getInitialValues(resource))
    setFormError('')
    setDialogOpen(true)
  }

  const openEdit = (record: GLRecord) => {
    setEditingRecord(record)
    setFormValues(
      Object.fromEntries(
        resource.fields.map((field) => [
          field.name,
          getInputValue(record, field),
        ]),
      ),
    )
    setFormError('')
    setDialogOpen(true)
  }

  const saveRecord = async () => {
    const missingField = resource.fields.find((field) => {
      const value = formValues[field.name]
      return (
        field.required &&
        (value === undefined ||
          value === '' ||
          (typeof value === 'string' && value.trim() === ''))
      )
    })
    if (missingField) {
      setFormError(`${missingField.label} is required.`)
      return
    }

    const unsavedDefault = resource.fields.find((field) => {
      const value = formValues[field.name]
      return (
        field.kind === 'select' &&
        typeof value === 'string' &&
        value.startsWith('frontend-default:')
      )
    })
    if (unsavedDefault) {
      setFormError(
        `${unsavedDefault.label} is a frontend-only default. Save that record in its master form first, then select the saved record.`,
      )
      return
    }

    const payload: Record<string, string | number | boolean | null> = {}
    for (const field of resource.fields) {
      const value = formValues[field.name]
      if (field.kind === 'boolean') {
        payload[field.name] = value === true
      } else if (value === undefined || value === '') {
        payload[field.name] = null
      } else if (field.kind === 'number' || field.kind === 'select') {
        const numericValue = Number(value)
        if (!Number.isFinite(numericValue)) {
          setFormError(`${field.label} must be a valid number.`)
          return
        }
        payload[field.name] = numericValue
      } else {
        payload[field.name] = String(value).trim()
      }
    }

    setSaving(true)
    setFormError('')
    setError('')
    setSuccess('')
    try {
      if (editingRecord?.id === undefined) {
        await apiClient.post(resource.endpoint, payload)
      } else {
        await apiClient.put(
          `${resource.endpoint}${editingRecord.id}`,
          payload,
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

  const renderField = (field: GLFieldDefinition) => {
    const value = formValues[field.name] ?? (field.kind === 'boolean' ? false : '')
    if (field.kind === 'boolean') {
      return (
        <FormControlLabel
          key={field.name}
          control={
            <Checkbox
              checked={value === true}
              onChange={(event) =>
                setFormValues((current) => ({
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
      const options = getFieldOptions(field, optionCollections)
      return (
        <TextField
          fullWidth
          key={field.name}
          label={field.label}
          onChange={(event) =>
            setFormValues((current) => ({
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
      )
    }

    return (
      <TextField
        fullWidth
        key={field.name}
        label={field.label}
        multiline={field.kind === 'textarea'}
        onChange={(event) =>
          setFormValues((current) => ({
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
        onClose={() => !saving && setDialogOpen(false)}
        open={dialogOpen}
      >
        <DialogTitle>
          {editingRecord ? 'Edit' : 'Add'} {resource.label}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <Grid container spacing={2}>
              {resource.fields.map((field) => (
                <Grid key={field.name} size={{ xs: 12, sm: 6 }}>
                  {renderField(field)}
                </Grid>
              ))}
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={() => void saveRecord()} variant="contained">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default GLResourcePage
