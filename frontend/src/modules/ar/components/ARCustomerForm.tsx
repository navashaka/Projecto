import {
  Alert,
  Button,
  Grid,
  IconButton,
  MenuItem,
  Paper,
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
import { useState } from 'react'
import type { FormEvent } from 'react'
import { arCustomerFields } from '../constants/arResources'
import { useARRecords } from '../hooks/useARRecords'
import {
  deleteARRecord,
  formatARError,
  getARRecord,
  saveARRecord,
} from '../services/arApi'
import type { ARBankAccount, ARRecord } from '../types/arTypes'
import ARExcelUpload from './ARExcelUpload'
import ARPageLayout from './ARPageLayout'
import { normalizeARValue, validateARValue } from '../utils/arValidation'

type CustomerValues = Record<string, string>

const emptyCustomer = (): CustomerValues =>
  Object.fromEntries(arCustomerFields.map((field) => [field.name, '']))

function recordBankAccounts(record: ARRecord): ARBankAccount[] {
  const value = record.bank_accounts
  if (!Array.isArray(value)) return []
  return value.flatMap((account) => {
    if (typeof account !== 'object' || account === null) return []
    const row = account as Record<string, unknown>
    return [{
      account_no: String(row.account_no ?? ''),
      ifsc: String(row.ifsc ?? ''),
    }]
  })
}

function displayLabel(name: string): string {
  const known: Record<string, string> = {
    gstn: 'GSTN',
    pan: 'PAN',
    msme: 'MSME',
    ifsc: 'IFSC',
  }
  return name.split('_').map((part) => known[part] ?? `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`).join(' ')
}

export default function ARCustomerForm() {
  const { records, loading, error: loadError, reload, setError } =
    useARRecords('customers')
  const [values, setValues] = useState<CustomerValues>(emptyCustomer)
  const [bankAccounts, setBankAccounts] = useState<ARBankAccount[]>([])
  const [editingId, setEditingId] = useState<number>()
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  const selectRecord = async (record: ARRecord) => {
    if (record.id === undefined) return
    try {
      const detail = await getARRecord('customers', record.id)
      const next = emptyCustomer()
      for (const field of arCustomerFields) {
        next[field.name] = String(detail[field.name] ?? '')
      }
      setValues(next)
      setBankAccounts(recordBankAccounts(detail))
      setEditingId(detail.id)
      setNotice('')
      setError('')
    } catch (loadError) {
      setError(formatARError(loadError, 'Unable to load this customer.'))
    }
  }

  const reset = () => {
    setValues(emptyCustomer())
    setBankAccounts([])
    setEditingId(undefined)
    setNotice('')
    setError('')
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fieldError = Object.entries(values)
      .map(([field, value]) => validateARValue(field, value))
      .find(Boolean)
    if (fieldError) {
      setError(fieldError)
      return
    }
    for (const account of bankAccounts) {
      if (!account.account_no.trim() || !account.ifsc.trim()) {
        setError('Enter both account number and IFSC for each bank account.')
        return
      }
      const accountError =
        validateARValue('account_no', account.account_no) ??
        validateARValue('ifsc', account.ifsc)
      if (accountError) {
        setError(accountError)
        return
      }
    }

    setSaving(true)
    setNotice('')
    try {
      await saveARRecord(
        'customers',
        {
          ...Object.fromEntries(
            Object.entries(values).map(([field, value]) => [
              field,
              normalizeARValue(field, value),
            ]),
          ),
          bank_accounts: bankAccounts.map((account) => ({
            account_no: normalizeARValue('account_no', account.account_no),
            ifsc: normalizeARValue('ifsc', account.ifsc),
          })),
        },
        editingId,
      )
      const successMessage = editingId
        ? 'Customer updated successfully.'
        : 'Customer saved successfully.'
      reset()
      setSaveSuccess(successMessage)
      await reload()
    } catch (saveError) {
      setError(formatARError(saveError, 'Unable to save the customer.'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (recordId: number) => {
    if (!window.confirm('Delete this customer and its bank accounts?')) return
    try {
      await deleteARRecord('customers', recordId)
      if (editingId === recordId) reset()
      await reload()
      setNotice('Customer deleted.')
    } catch (deleteError) {
      setError(formatARError(deleteError, 'Unable to delete the customer.'))
    }
  }

  return (
    <ARPageLayout title="Customer Creation / Alteration">
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        autoHideDuration={5000}
        onClose={() => setSaveSuccess('')}
        open={Boolean(saveSuccess)}
      >
        <Alert
          onClose={() => setSaveSuccess('')}
          severity="success"
          variant="filled"
        >
          {saveSuccess}
        </Alert>
      </Snackbar>
      <Stack spacing={2}>
        {(loadError || notice) && (
          <Alert severity={loadError ? 'error' : 'success'}>
            {loadError || notice}
          </Alert>
        )}
        <Paper component="form" onSubmit={submit} sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Typography variant="h6">
              {editingId ? `Edit customer #${editingId}` : 'Customer details'}
            </Typography>
            <Grid container spacing={2}>
              {arCustomerFields.map((field) => (
                <Grid key={field.name} size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label={displayLabel(field.name)}
                    multiline={field.kind === 'textarea'}
                    minRows={field.kind === 'textarea' ? 2 : undefined}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [field.name]: normalizeARValue(field.name, event.target.value),
                      }))
                    }
                    required={field.required}
                    select={field.name === 'activity'}
                    value={values[field.name] ?? ''}
                  >
                    {field.name === 'activity' &&
                      ['Trader', 'Service Provider', 'Manufacturer'].map(
                        (activity) => (
                          <MenuItem key={activity} value={activity}>
                            {activity}
                          </MenuItem>
                        ),
                      )}
                  </TextField>
                </Grid>
              ))}
            </Grid>

            <Stack spacing={1}>
              <Stack
                direction="row"
                sx={{ alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Typography variant="h6">Customer bank accounts</Typography>
                <Button
                  onClick={() =>
                    setBankAccounts((current) => [
                      ...current,
                      { account_no: '', ifsc: '' },
                    ])
                  }
                  variant="outlined"
                >
                  Add bank account
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Account number</TableCell>
                      <TableCell>IFSC</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bankAccounts.map((account, index) => (
                      <TableRow key={`${index}-${account.account_no}`}>
                        <TableCell>
                          <TextField
                            fullWidth
                            label="Account number"
                            value={account.account_no}
                            onChange={(event) =>
                              setBankAccounts((current) =>
                                current.map((row, rowIndex) =>
                                  rowIndex === index
                                    ? { ...row, account_no: event.target.value }
                                    : row,
                                ),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            label="IFSC"
                            value={account.ifsc}
                            onChange={(event) =>
                              setBankAccounts((current) =>
                                current.map((row, rowIndex) =>
                                  rowIndex === index
                                    ? { ...row, ifsc: normalizeARValue('ifsc', event.target.value) }
                                    : row,
                                ),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            color="error"
                            onClick={() =>
                              setBankAccounts((current) =>
                                current.filter((_, rowIndex) => rowIndex !== index),
                              )
                            }
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {bankAccounts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3}>No bank accounts added.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button disabled={saving} type="submit" variant="contained">
                {saving ? 'Saving…' : editingId ? 'Update customer' : 'Save customer'}
              </Button>
              {editingId !== undefined && (
                <Button onClick={reset} variant="outlined">Cancel edit</Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography gutterBottom variant="h6">Customers</Typography>
          {loading ? (
            <Typography>Loading customers…</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>PAN</TableCell>
                    <TableCell>GSTN</TableCell>
                    <TableCell>Bank accounts</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{String(record.customer_name ?? '')}</TableCell>
                      <TableCell>{String(record.pan ?? '')}</TableCell>
                      <TableCell>{String(record.gstn ?? '')}</TableCell>
                      <TableCell>{recordBankAccounts(record).length}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          aria-label={`Edit ${String(record.customer_name ?? 'customer')}`}
                          onClick={() => void selectRecord(record)}
                        >
                          <Typography variant="body2">Edit</Typography>
                        </IconButton>
                        <IconButton
                          aria-label={`Delete ${String(record.customer_name ?? 'customer')}`}
                          color="error"
                          onClick={() => record.id !== undefined && void remove(record.id)}
                        >
                          <Typography variant="body2">Delete</Typography>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {records.length === 0 && !loadError && (
                    <TableRow>
                      <TableCell colSpan={5}>No customers found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
        <ARExcelUpload
          customer
          fields={arCustomerFields}
          onUploaded={reload}
          resource="customers"
          title="Customer"
        />
      </Stack>
    </ARPageLayout>
  )
}
