import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'

const API = 'http://localhost:8000'

type FormType =
  | 'vendors'
  | 'quotation-comparisons'
  | 'orders'
  | 'advance-requisitions'

type Field = {
  name: string
  label: string
  type?: string
  multiline?: boolean
  rows?: number
}

const formConfig: Record<FormType, { title: string; fields: Field[] }> = {
  vendors: {
    title: 'Vendor Creation',
    fields: [
      { name: 'vendor_name', label: 'Vendor Name' },
      { name: 'street_no', label: 'Street Number' },
      { name: 'street_name', label: 'Street Name' },
      { name: 'city', label: 'City' },
      { name: 'pin', label: 'PIN Code' },
      { name: 'state', label: 'State' },
      { name: 'country', label: 'Country' },
      { name: 'pan', label: 'PAN Number' },
      { name: 'gstn', label: 'GST Number' },
      { name: 'email_id', label: 'Email', type: 'email' },
      { name: 'contact_no', label: 'Contact Number' },
      { name: 'contact_person_name', label: 'Contact Person' },
      { name: 'account_no', label: 'Account Number' },
      { name: 'ifsc', label: 'IFSC Code' },
      { name: 'msme_status', label: 'MSME Status' },
      { name: 'msme_no', label: 'MSME Number' },
      { name: 'activity', label: 'Activity' },
    ],
  },

  'quotation-comparisons': {
    title: 'Quotation Comparison',
    fields: [
      { name: 'comparison_no', label: 'Comparison Number' },
      { name: 'comparison_date', label: 'Comparison Date', type: 'date' },
      { name: 'vendors', label: 'Vendors (JSON Array)', multiline: true, rows: 3 },
      { name: 'items', label: 'Items (JSON Array)', multiline: true, rows: 4 },
      { name: 'total_amount', label: 'Total Amount', type: 'number' },
      { name: 'tax_amount', label: 'Tax Amount', type: 'number' },
      { name: 'grand_total', label: 'Grand Total', type: 'number' },
      { name: 'delivery_terms', label: 'Delivery Terms', multiline: true },
      { name: 'payment_terms', label: 'Payment Terms', multiline: true },
      {
        name: 'additional_terms_conditions',
        label: 'Additional Terms & Conditions',
        multiline: true,
      },
    ],
  },

  orders: {
    title: 'Purchase Order',
    fields: [
      { name: 'purchase_order_no', label: 'Purchase Order Number' },
      { name: 'purchase_order_date', label: 'Purchase Order Date', type: 'date' },
      { name: 'indent_no', label: 'Indent Number' },
      { name: 'indent_date', label: 'Indent Date', type: 'date' },
      { name: 'quotation_no', label: 'Quotation Number' },
      { name: 'quotation_date', label: 'Quotation Date', type: 'date' },
      { name: 'vendor_id', label: 'Vendor ID', type: 'number' },
      { name: 'vendor_name', label: 'Vendor Name' },
      { name: 'vendor_address', label: 'Vendor Address (JSON Object)', multiline: true, rows: 3 },
      { name: 'vendor_bank_details', label: 'Vendor Bank Details (JSON Object)', multiline: true, rows: 3 },
      { name: 'items', label: 'Items (JSON Array)', multiline: true, rows: 4 },
      { name: 'total_amount', label: 'Total Amount', type: 'number' },
      { name: 'tax_amount', label: 'Tax Amount', type: 'number' },
      { name: 'grand_total', label: 'Grand Total', type: 'number' },
      { name: 'delivery_terms', label: 'Delivery Terms', multiline: true },
      { name: 'payment_terms', label: 'Payment Terms', multiline: true },
      { name: 'default_terms_conditions', label: 'Default Terms & Conditions', multiline: true },
      { name: 'additional_terms_conditions', label: 'Additional Terms & Conditions', multiline: true },
      { name: 'created_by', label: 'Created By' },
      { name: 'checked_by', label: 'Checked By' },
      { name: 'approved_by', label: 'Approved By' },
      { name: 'status', label: 'Status' },
    ],
  },

  'advance-requisitions': {
    title: 'Advance Requisition',
    fields: [
      { name: 'vendor_id', label: 'Vendor ID', type: 'number' },
      { name: 'vendor_name', label: 'Vendor Name' },
      { name: 'vendor_address', label: 'Vendor Address (JSON Object)', multiline: true, rows: 3 },
      { name: 'vendor_bank_details', label: 'Vendor Bank Details (JSON Object)', multiline: true, rows: 3 },
      { name: 'purchase_order_no', label: 'Purchase Order Number' },
      { name: 'purchase_order_date', label: 'Purchase Order Date', type: 'date' },
      { name: 'purchase_order_value_before_gst', label: 'Purchase Order Value Before GST', type: 'number' },
      { name: 'purchase_order_value_with_gst', label: 'Purchase Order Value With GST', type: 'number' },
      { name: 'advance_requested_amount', label: 'Advance Requested Amount', type: 'number' },
      { name: 'created_by', label: 'Created By' },
      { name: 'checked_by', label: 'Checked By' },
      { name: 'approved_by', label: 'Approved By' },
      { name: 'status', label: 'Status' },
    ],
  },
}

const jsonFields = [
  'vendors',
  'items',
  'vendor_address',
  'vendor_bank_details',
]

const numberFields = [
  'total_amount',
  'tax_amount',
  'grand_total',
  'vendor_id',
  'purchase_order_value_before_gst',
  'purchase_order_value_with_gst',
  'advance_requested_amount',
]

const emptyValues = (type: FormType): Record<string, any> => {
  const result: Record<string, any> = {}

  formConfig[type].fields.forEach((field) => {
    if (field.name === 'vendors' || field.name === 'items') {
      result[field.name] = '[]'
    } else if (
      field.name === 'vendor_address' ||
      field.name === 'vendor_bank_details'
    ) {
      result[field.name] = '{}'
    } else if (field.name === 'status') {
      result[field.name] = 'Draft'
    } else {
      result[field.name] = ''
    }
  })

  return result
}

const PurchaseForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FormType>('vendors')
  const [values, setValues] = useState<Record<string, any>>(
    () => emptyValues('vendors'),
  )
  const [records, setRecords] = useState<any[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  const config = formConfig[activeTab]

  const showMessage = (
    message: string,
    severity: 'success' | 'error' = 'success',
  ) => {
    setSnackbar({ open: true, message, severity })
  }

  const loadRecords = useCallback(async () => {
    setLoading(true)

    try {
      const response = await fetch(`${API}/purchase/${activeTab}`)

      if (!response.ok) {
        throw new Error('Unable to load records')
      }

      const data = await response.json()
      setRecords(Array.isArray(data) ? data : data.items || [])
    } catch (error) {
      console.error(error)
      setRecords([])
      showMessage('Records loading failed. Check backend API.', 'error')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    setValues(emptyValues(activeTab))
    setEditingId(null)
    loadRecords()
  }, [activeTab, loadRecords])

  const handleChange = (name: string, value: string) => {
    setValues((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const preparePayload = () => {
    const payload: Record<string, any> = {}

    Object.entries(values).forEach(([key, value]) => {
      if (jsonFields.includes(key)) {
        try {
          payload[key] = value.trim()
            ? JSON.parse(value)
            : key === 'vendors' || key === 'items'
              ? []
              : {}
        } catch {
          throw new Error(`${key} lo valid JSON enter cheyyali`)
        }
      } else if (numberFields.includes(key)) {
        payload[key] = value === '' ? null : Number(value)
      } else {
        payload[key] = value === '' ? null : value
      }
    })

    return payload
  }

  const handleSave = async () => {
    try {
      if (activeTab === 'vendors' && !values.vendor_name?.trim()) {
        showMessage('Vendor Name is required', 'error')
        return
      }

      if (
        activeTab === 'advance-requisitions' &&
        !values.advance_requested_amount
      ) {
        showMessage('Advance Requested Amount is required', 'error')
        return
      }

      const payload = preparePayload()
      setSaving(true)

      const url = editingId
        ? `${API}/purchase/${activeTab}/${editingId}`
        : `${API}/purchase/${activeTab}`

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || 'Unable to save purchase record')
      }

      showMessage(
        editingId ? 'Record updated successfully' : 'Record saved successfully',
      )
      setValues(emptyValues(activeTab))
      setEditingId(null)
      await loadRecords()
    } catch (error: any) {
      showMessage(error.message || 'Something went wrong', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (record: any) => {
    const updatedValues = emptyValues(activeTab)

    config.fields.forEach((field) => {
      const value = record[field.name]

      if (jsonFields.includes(field.name)) {
        updatedValues[field.name] = JSON.stringify(
          value ?? (
            field.name === 'vendors' || field.name === 'items' ? [] : {}
          ),
          null,
          2,
        )
      } else {
        updatedValues[field.name] = value ?? ''

        if (typeof value === 'string' && field.type === 'date') {
          updatedValues[field.name] = value.substring(0, 10)
        }
      }
    })

    setValues(updatedValues)
    setEditingId(record.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return
    }

    try {
      const response = await fetch(
        `${API}/purchase/${activeTab}/${id}`,
        { method: 'DELETE' },
      )

      if (!response.ok) {
        throw new Error('Unable to delete record')
      }

      showMessage('Record deleted successfully')
      await loadRecords()
    } catch (error: any) {
      showMessage(error.message || 'Delete failed', 'error')
    }
  }

  const handleCancel = () => {
    setValues(emptyValues(activeTab))
    setEditingId(null)
  }

  return (
    <div style={{ padding: 16 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Purchase Management
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value: FormType) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Vendor Creation" value="vendors" />
          <Tab label="Quotation Comparison" value="quotation-comparisons" />
          <Tab label="Purchase Order" value="orders" />
          <Tab label="Advance Requisition" value="advance-requisitions" />
        </Tabs>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          {editingId ? `Update ${config.title}` : config.title}
        </Typography>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {config.fields.map((field) => (
            <TextField
              key={field.name}
              fullWidth
              size="small"
              label={field.label}
              type={field.type || 'text'}
              value={values[field.name] ?? ''}
              onChange={(event) =>
                handleChange(field.name, event.target.value)
              }
              multiline={field.multiline || false}
              rows={field.rows || 1}
              sx={
                field.type === 'date'
                  ? { '& input': { minHeight: '1.4em' } }
                  : undefined
              }
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <CircularProgress size={22} color="inherit" />
            ) : editingId ? (
              'Update'
            ) : (
              'Save'
            )}
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            onClick={handleCancel}
          >
            Clear
          </Button>
        </div>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          {config.title} Records
        </Typography>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <CircularProgress />
          </div>
        ) : records.length === 0 ? (
          <Typography color="text.secondary">
            No records found.
          </Typography>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  {config.fields.slice(0, 4).map((field) => (
                    <TableCell key={field.name}>{field.label}</TableCell>
                  ))}
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.id}</TableCell>

                    {config.fields.slice(0, 4).map((field) => (
                      <TableCell key={field.name}>
                        {record[field.name] == null
                          ? '-'
                          : typeof record[field.name] === 'object'
                            ? JSON.stringify(record[field.name])
                            : record[field.name]}
                      </TableCell>
                    ))}

                    <TableCell align="center">
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                          size="small"
                          onClick={() => handleEdit(record)}
                        >
                          Edit
                        </Button>

                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDelete(record.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() =>
          setSnackbar((previous) => ({
            ...previous,
            open: false,
          }))
        }
      >
        <Alert
          severity={snackbar.severity}
          onClose={() =>
            setSnackbar((previous) => ({
              ...previous,
              open: false,
            }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default PurchaseForm