import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { useMemo, useState } from 'react'
import {
  deleteARRecord,
  formatARError,
  getARRecord,
  saveARRecord,
} from '../ar/services/arApi'
import type { ARRecord } from '../ar/types/arTypes'

interface ARAdminRecordsProps {
  label: string
  resource: string
  records: ARRecord[]
  loading: boolean
  error: string
  onReload: () => Promise<boolean>
}

function labelFor(field: string): string {
  const acronyms: Record<string, string> = {
    gst: 'GST',
    gstn: 'GSTN',
    hsn: 'HSN',
    ifsc: 'IFSC',
    pan: 'PAN',
    uom: 'UOM',
  }
  return field
    .split('_')
    .map((part) => acronyms[part] ?? `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ')
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default function ARAdminRecords({
  label,
  resource,
  records,
  loading,
  error,
  onReload,
}: ARAdminRecordsProps) {
  const [detailRecord, setDetailRecord] = useState<ARRecord | null>(null)
  const [editingRecord, setEditingRecord] = useState<ARRecord | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [actionError, setActionError] = useState('')
  const [saving, setSaving] = useState(false)
  const tableFields = useMemo(() => {
    const fields = new Set<string>()
    for (const record of records) {
      for (const [key, value] of Object.entries(record)) {
        if (
          !['id', 'created_at', 'updated_at', 'items', 'bank_accounts'].includes(key) &&
          (typeof value !== 'object' || value === null)
        ) {
          fields.add(key)
        }
      }
    }
    return Array.from(fields).slice(0, 6)
  }, [records])

  const openEdit = async (record: ARRecord) => {
    if (record.id === undefined) return
    setActionError('')
    try {
      const detail = await getARRecord(resource, record.id)
      setEditingRecord(detail)
      setFormValues(
        Object.fromEntries(
          Object.entries(detail)
            .filter(([field]) => !['id', 'created_at', 'updated_at'].includes(field))
            .map(([field, value]) => [
              field,
              value !== null && typeof value === 'object'
                ? JSON.stringify(value, null, 2)
                : typeof value === 'string' && field === 'einvoice_ack_date'
                  ? value.replace(' ', 'T').slice(0, 16)
                : typeof value === 'string' && field.endsWith('_date')
                  ? value.slice(0, 10)
                  : String(value ?? ''),
            ]),
        ),
      )
    } catch (editError) {
      setActionError(
        formatARError(editError, `Unable to load ${label.toLowerCase()} details.`),
      )
    }
  }

  const saveEdit = async () => {
    if (editingRecord?.id === undefined) return
    const payload: Record<string, unknown> = {}
    try {
      for (const [field, text] of Object.entries(formValues)) {
        const original = editingRecord[field]
        if (typeof original === 'boolean') {
          payload[field] = text === 'true'
        } else if (typeof original === 'number') {
          if (text.trim() === '') {
            payload[field] = null
          } else {
            const value = Number(text)
            if (!Number.isFinite(value)) {
              setActionError(`${labelFor(field)} must be a valid number.`)
              return
            }
            payload[field] = value
          }
        } else if (original !== null && typeof original === 'object') {
          payload[field] = JSON.parse(text)
        } else if (
          text === '' &&
          (field.endsWith('_date') || field.endsWith('_ack_date'))
        ) {
          payload[field] = null
        } else {
          payload[field] = text
        }
      }

      setSaving(true)
      setActionError('')
      await saveARRecord(resource, payload, editingRecord.id)
      setEditingRecord(null)
      await onReload()
    } catch (saveError) {
      setActionError(formatARError(saveError, 'Unable to update this AR record.'))
    } finally {
      setSaving(false)
    }
  }

  const removeRecord = async (record: ARRecord) => {
    if (
      record.id === undefined ||
      !window.confirm(`Delete this ${label.toLowerCase()} record?`)
    ) {
      return
    }
    setActionError('')
    try {
      await deleteARRecord(resource, record.id)
      if (detailRecord?.id === record.id) setDetailRecord(null)
      await onReload()
    } catch (deleteError) {
      setActionError(
        formatARError(deleteError, 'Unable to delete this AR record.'),
      )
    }
  }

  return (
    <>
      {(actionError || error) && (
        <Alert severity="error">{actionError || error}</Alert>
      )}
      <Paper variant="outlined">
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2 }}
        >
          <Typography variant="h6">{label}</Typography>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Typography color="text.secondary" variant="body2">
              {loading ? 'Loading records...' : `${records.length} saved records`}
            </Typography>
          </Stack>
        </Stack>
        {loading ? (
          <Stack sx={{ alignItems: 'center', py: 6 }}>
            <CircularProgress aria-label="Loading AR records" />
          </Stack>
        ) : (
          <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  {tableFields.map((field) => (
                    <TableCell key={field}>{labelFor(field)}</TableCell>
                  ))}
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell align="center" colSpan={tableFields.length + 2}>
                      {error
                        ? 'Unable to load saved AR records.'
                        : 'No saved AR records found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow hover key={record.id}>
                      <TableCell>{displayValue(record.id)}</TableCell>
                      {tableFields.map((field) => (
                        <TableCell key={field}>
                          {displayValue(record[field])}
                        </TableCell>
                      ))}
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => setDetailRecord(record)}
                        >
                          Details
                        </Button>
                        <Button
                          size="small"
                          onClick={() => void openEdit(record)}
                        >
                          Edit
                        </Button>
                        <Button
                          color="error"
                          size="small"
                          onClick={() => void removeRecord(record)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        fullWidth
        maxWidth="md"
        open={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
      >
        <DialogTitle>{label} Details</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={0}>
            {detailRecord &&
              Object.entries(detailRecord).map(([field, value]) => (
                <Stack
                  key={field}
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography sx={{ width: { sm: '35%' }, fontWeight: 600 }}>
                    {labelFor(field)}
                  </Typography>
                  <Typography
                    sx={{
                      flex: 1,
                      overflowWrap: 'anywhere',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {displayValue(value)}
                  </Typography>
                </Stack>
              ))}
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="md"
        open={Boolean(editingRecord)}
        onClose={() => {
          if (!saving) setEditingRecord(null)
        }}
      >
        <DialogTitle>Edit {label}</DialogTitle>
        <DialogContent dividers>
          {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
          <Stack spacing={2}>
            {editingRecord &&
              Object.entries(formValues).map(([field, value]) => {
                const original = editingRecord[field]
                const isDate = field.endsWith('_date') && field !== 'einvoice_ack_date'
                const isDateTime = field === 'einvoice_ack_date'
                const isJson = original !== null && typeof original === 'object'

                return (
                  <Stack
                    key={field}
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ alignItems: { sm: 'center' } }}
                  >
                    <Typography sx={{ width: { sm: '35%' }, fontWeight: 600 }}>
                      {labelFor(field)}
                    </Typography>
                    {typeof original === 'boolean' ? (
                      <Checkbox
                        checked={value === 'true'}
                        onChange={(event) =>
                          setFormValues((current) => ({
                            ...current,
                            [field]: String(event.target.checked),
                          }))
                        }
                      />
                    ) : (
                      <TextField
                        fullWidth
                        multiline={isJson || (typeof original === 'string' && original.length > 120)}
                        minRows={isJson ? 5 : undefined}
                        onChange={(event) =>
                          setFormValues((current) => ({
                            ...current,
                            [field]: event.target.value,
                          }))
                        }
                        type={
                          isDate
                            ? 'date'
                            : isDateTime
                              ? 'datetime-local'
                              : typeof original === 'number'
                                ? 'number'
                                : 'text'
                        }
                        value={value}
                      />
                    )}
                  </Stack>
                )
              })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setEditingRecord(null)}>
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={() => void saveEdit()}
            variant="contained"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
