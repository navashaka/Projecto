import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  MenuItem,
  Paper,
  Select,
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
import { useNavigate } from 'react-router-dom'
import apiClient from '../../../services/apiClient'

type AdminModuleKey = 'hr' | 'gl' | 'inventory'

type AdminField = {
  name: string
  label: string
  kind: 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'time' | 'select'
  nullable: boolean
  editable: boolean
  max_length?: number
  options?: string[]
}

type AdminResource = {
  key: string
  label: string
  fields: AdminField[]
}

type AdminRecord = Record<string, unknown> & {
  id: number | string
}

const PAYROLL_PAGE_OPTION = '__payroll-page__'

type AdminRecordsPageProps = {
  module: AdminModuleKey
  title: string
}

function recordEndpoint(module: AdminModuleKey, resourceKey: string): string {
  return `/api/v1/admin/${module}/${encodeURIComponent(resourceKey)}`
}

function formatError(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response

    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = response.data

      if (typeof data === 'object' && data !== null && 'detail' in data) {
        if (typeof data.detail === 'string') return data.detail
      }
    }
  }

  return error instanceof Error ? error.message : fallback
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function editValue(field: AdminField, value: unknown): string {
  if (value === null || value === undefined) return ''

  const textValue = String(value)

  if (field.kind === 'date') return textValue.slice(0, 10)
  if (field.kind === 'datetime') return textValue.slice(0, 16)

  return textValue
}

function toPayloadValue(field: AdminField, value: string): unknown {
  if (value === '') return null
  if (field.kind === 'boolean') return value === 'true'
  if (field.kind === 'number') return Number(value)
  return value
}

function AdminRecordsPage({ module, title }: AdminRecordsPageProps) {
  const navigate = useNavigate()

  const [resources, setResources] = useState<AdminResource[]>([])
  const [selectedKey, setSelectedKey] = useState('')
  const [records, setRecords] = useState<AdminRecord[]>([])
  const [loadingResources, setLoadingResources] = useState(true)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [error, setError] = useState('')
  const [editingRecord, setEditingRecord] = useState<AdminRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<AdminRecord | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<AdminRecord | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const selectedResource = useMemo(
    () => resources.find((resource) => resource.key === selectedKey),
    [resources, selectedKey],
  )

  const loadRecords = useCallback(async (resource: AdminResource) => {
    setLoadingRecords(true)
    setError('')

    try {
      const response = await apiClient.get<AdminRecord[]>(
        recordEndpoint(module, resource.key),
      )

      if (!Array.isArray(response.data)) {
        throw new Error('The API returned an invalid record list.')
      }

      setRecords(response.data)
    } catch (loadError) {
      setRecords([])
      setError(formatError(loadError, `Unable to load ${resource.label} records.`))
    } finally {
      setLoadingRecords(false)
    }
  }, [module])

  useEffect(() => {
    let active = true

    apiClient
      .get<AdminResource[]>(`/api/v1/admin/${module}/resources`)
      .then((response) => {
        if (!Array.isArray(response.data)) {
          throw new Error('The API returned invalid resource metadata.')
        }

        if (active) {
          setResources(response.data)
          setSelectedKey(response.data[0]?.key ?? '')
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setResources([])
          setError(formatError(loadError, `Unable to load ${title} resources.`))
        }
      })
      .finally(() => {
        if (active) setLoadingResources(false)
      })

    return () => {
      active = false
    }
  }, [module, title])

  useEffect(() => {
    if (selectedResource) {
      void loadRecords(selectedResource)
    } else if (!loadingResources) {
      setRecords([])
      setLoadingRecords(false)
    }
  }, [loadRecords, selectedResource, loadingResources])

  const openEdit = (record: AdminRecord) => {
    if (!selectedResource) return

    setEditingRecord(record)
    setFormValues(
      Object.fromEntries(
        selectedResource.fields
          .filter((field) => field.editable)
          .map((field) => [field.name, editValue(field, record[field.name])]),
      ),
    )
    setError('')
  }

  const openDetails = async (record: AdminRecord) => {
    if (!selectedResource) return

    setError('')

    try {
      const response = await apiClient.get<AdminRecord>(
        `${recordEndpoint(module, selectedResource.key)}/${record.id}`,
      )
      setDetailRecord(response.data)
    } catch (detailError) {
      setError(formatError(detailError, 'Unable to load record details.'))
    }
  }

  const saveRecord = async () => {
    if (!selectedResource || !editingRecord) return

    const editableFields = selectedResource.fields.filter((field) => field.editable)

    const missingField = editableFields.find(
      (field) => !field.nullable && !formValues[field.name]?.trim(),
    )

    if (missingField) {
      setError(`${missingField.label} cannot be empty.`)
      return
    }

    const invalidNumber = editableFields.find(
      (field) =>
        field.kind === 'number' &&
        formValues[field.name] !== '' &&
        !Number.isFinite(Number(formValues[field.name])),
    )

    if (invalidNumber) {
      setError(`${invalidNumber.label} must be a valid number.`)
      return
    }

    const payload = Object.fromEntries(
      editableFields
        .filter(
          (field) =>
            formValues[field.name] !== editValue(field, editingRecord[field.name]),
        )
        .map((field) => [
          field.name,
          toPayloadValue(field, formValues[field.name] ?? ''),
        ]),
    )

    if (Object.keys(payload).length === 0) {
      setEditingRecord(null)
      return
    }

    setSaving(true)
    setError('')

    try {
      await apiClient.patch(
        `${recordEndpoint(module, selectedResource.key)}/${editingRecord.id}`,
        payload,
      )
      setEditingRecord(null)
      await loadRecords(selectedResource)
    } catch (saveError) {
      setError(formatError(saveError, 'Unable to save the record changes.'))
    } finally {
      setSaving(false)
    }
  }

  const deleteRecord = async () => {
    if (!selectedResource || !deletingRecord) return

    setError('')

    try {
      await apiClient.delete(
        `${recordEndpoint(module, selectedResource.key)}/${deletingRecord.id}`,
      )
      setDeletingRecord(null)
      await loadRecords(selectedResource)
    } catch (deleteError) {
      setError(formatError(deleteError, 'Unable to delete the selected record.'))
    }
  }

  const tableFields =
    selectedResource?.fields
      .filter((field) => !['id', 'created_at', 'updated_at'].includes(field.name))
      .slice(0, 6) ?? []

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate('/admin')}
            sx={{ textTransform: 'lowercase' }}
          >
            ← Back to Dashboard
          </Button>
          <Typography variant="h4">{title}</Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'HR Admin', path: '/hr-admin' },
            { label: 'GL Admin', path: '/gl-admin' },
            { label: 'Inventory Admin', path: '/inventory-admin' },
          ]
            .filter((item) => item.path !== `/${module}-admin`)
            .map((item) => (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                size="small"
                sx={{ textTransform: 'lowercase' }}
              >
                {item.label}
              </Button>
            ))}

          <FormControl size="small" sx={{ minWidth: 240 }}>
            <Select
              aria-label={`${title} record type`}
              disabled={loadingResources || resources.length === 0}
              value={selectedKey}
              onChange={(event) => {
                if (event.target.value === PAYROLL_PAGE_OPTION) {
                  navigate('/payroll/create')
                  return
                }
                setSelectedKey(event.target.value)
                setError('')
              }}
            >
              {resources.flatMap((resource) => [
                <MenuItem key={resource.key} value={resource.key}>
                  {resource.label}
                </MenuItem>,
                ...(module === 'hr' && resource.key === 'salary-details'
                  ? [
                      <MenuItem
                        key={PAYROLL_PAGE_OPTION}
                        value={PAYROLL_PAGE_OPTION}
                      >
                        Payroll
                      </MenuItem>,
                    ]
                  : []),
              ])}
            </Select>
          </FormControl>

          <Button
            disabled={!selectedResource || loadingRecords}
            onClick={() => selectedResource && void loadRecords(selectedResource)}
            variant="outlined"
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {loadingResources ? (
        <Stack sx={{ alignItems: 'center', py: 8 }}>
          <CircularProgress aria-label={`Loading ${title} resources`} />
        </Stack>
      ) : selectedResource ? (
        <Paper variant="outlined">
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2 }}
          >
            <Typography variant="h6">{selectedResource.label}</Typography>
            <Typography color="text.secondary" variant="body2">
              {loadingRecords ? 'Loading records...' : `${records.length} records`}
            </Typography>
          </Stack>

          <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  {tableFields.map((field) => (
                    <TableCell key={field.name}>{field.label}</TableCell>
                  ))}
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loadingRecords && (
                  <TableRow>
                    <TableCell colSpan={tableFields.length + 2} align="center">
                      Loading records...
                    </TableCell>
                  </TableRow>
                )}

                {!loadingRecords && records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={tableFields.length + 2} align="center">
                      No saved records found.
                    </TableCell>
                  </TableRow>
                )}

                {!loadingRecords &&
                  records.map((record) => (
                    <TableRow hover key={record.id}>
                      <TableCell>{record.id}</TableCell>
                      {tableFields.map((field) => (
                        <TableCell key={field.name}>
                          {displayValue(record[field.name])}
                        </TableCell>
                      ))}
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                          <Button size="small" onClick={() => void openDetails(record)}>
                            Details
                          </Button>
                          <Button size="small" onClick={() => openEdit(record)}>
                            Edit
                          </Button>
                          <Button
                            color="error"
                            size="small"
                            onClick={() => setDeletingRecord(record)}
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
        </Paper>
      ) : (
        <Alert severity="info">No records are configured for this module.</Alert>
      )}

      {/* Details dialog - normal report format */}
<Dialog
  fullWidth
  maxWidth="md"
  open={Boolean(detailRecord)}
  onClose={() => setDetailRecord(null)}
>
  <DialogTitle>
    {selectedResource?.label} Details
  </DialogTitle>

  <DialogContent dividers>
    <Stack spacing={0}>
      {selectedResource?.fields.map((field) => (
        <Stack
          key={field.name}
          direction="row"
          spacing={2}
          sx={{
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            sx={{
              width: { xs: '45%', sm: '35%' },
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {field.label}
          </Typography>

          <Typography
            sx={{
              flex: 1,
              overflowWrap: 'anywhere',
              whiteSpace: 'pre-wrap',
            }}
          >
            {displayValue(detailRecord?.[field.name])}
          </Typography>
        </Stack>
      ))}
    </Stack>
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setDetailRecord(null)}>
      Close
    </Button>
  </DialogActions>
</Dialog>
      <Dialog
        fullWidth
        maxWidth="md"
        open={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
      >
        <DialogTitle>{selectedResource?.label} Details</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            {selectedResource?.fields.map((field) => {
              const value = displayValue(detailRecord?.[field.name])

              return (
                <Grid key={field.name} size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={field.label}
                    value={value === '-' ? '' : value}
                    placeholder={`No ${field.label.toLowerCase()} available`}
                    slotProps={{
                      input: { readOnly: true },
                      inputLabel: { shrink: true },
                    }}
                  />
                </Grid>
              )
            })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailRecord(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog with labels and placeholders */}
      <Dialog
        fullWidth
        maxWidth="md"
        open={Boolean(editingRecord)}
        onClose={() => !saving && setEditingRecord(null)}
      >
        <DialogTitle>Edit {selectedResource?.label} record</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            {selectedResource?.fields
              .filter((field) => field.editable)
              .map((field) => (
                <Grid key={field.name} size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={field.label}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    multiline={field.kind === 'text' && !field.max_length}
                    minRows={field.kind === 'text' && !field.max_length ? 3 : undefined}
                    required={!field.nullable}
                    select={field.kind === 'boolean' || field.kind === 'select'}
                    type={
                      field.kind === 'number'
                        ? 'number'
                        : field.kind === 'date'
                          ? 'date'
                          : field.kind === 'datetime'
                            ? 'datetime-local'
                            : field.kind === 'time'
                              ? 'time'
                              : 'text'
                    }
                    value={formValues[field.name] ?? ''}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        [field.name]: event.target.value,
                      }))
                    }
                    slotProps={{
                      htmlInput: { maxLength: field.max_length },
                      inputLabel: {
                        shrink:
                          field.kind === 'date' ||
                          field.kind === 'datetime' ||
                          field.kind === 'time' ||
                          Boolean(formValues[field.name]),
                      },
                    }}
                  >
                    {field.kind === 'boolean' && (
                      <MenuItem value="true">Yes</MenuItem>
                    )}
                    {field.kind === 'boolean' && (
                      <MenuItem value="false">No</MenuItem>
                    )}
                    {field.nullable &&
                      (field.kind === 'boolean' || field.kind === 'select') && (
                        <MenuItem value="">Not set</MenuItem>
                      )}
                    {field.kind === 'select' &&
                      field.options?.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                  </TextField>
                </Grid>
              ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setEditingRecord(null)}>
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={() => void saveRecord()}
            variant="contained"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
      >
        <DialogTitle>Delete {selectedResource?.label} record?</DialogTitle>
        <DialogContent>
          <Typography>
            This permanently deletes record {deletingRecord?.id}. This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingRecord(null)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => void deleteRecord()}
            variant="contained"
          >
            Delete record
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default AdminRecordsPage