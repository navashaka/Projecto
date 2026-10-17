import {
  Button,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import AdminPageNavigation from '../admin/shared/AdminPageNavigation'
import AdminResourceSelect from '../admin/shared/AdminResourceSelect'
import { useARRecords } from '../ar/hooks/useARRecords'
import ARAdminRecords from './ARAdminRecords'

const arAdminResources = [
  { key: 'customer-bank-accounts', label: 'Customer Bank Accounts' },
  { key: 'customers', label: 'Customers' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'invoice-items', label: 'Invoice Items' },
  { key: 'proforma-invoice-items', label: 'Proforma Invoice Items' },
  { key: 'proforma-invoices', label: 'Proforma Invoices' },
  { key: 'quotation-items', label: 'Quotation Items' },
  { key: 'quotations', label: 'Quotations' },
  { key: 'tax-invoices', label: 'Tax Invoices' },
  { key: 'tax-invoice-items', label: 'Tax Invoice Items' },
]

export default function ARAdminPage() {
  const [resource, setResource] = useState('customers')
  const selectedResource = arAdminResources.find((item) => item.key === resource)
  const { records, loading, error, reload } = useARRecords(resource)

  return (
    <Stack spacing={3} sx={{ p: { xs: 2, md: 4 } }}>
      <Stack spacing={2}>
        <Typography
          variant="h4"
          sx={{
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          AR Admin
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            rowGap: 1,
          }}
        >
          <AdminPageNavigation homePath="/admin" />
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <AdminResourceSelect
              label="AR record type"
              onChange={(key) => {
                if (key) setResource(key)
              }}
              options={arAdminResources}
              value={resource}
            />
            <Button
              disabled={loading}
              onClick={() => void reload()}
              variant="outlined"
            >
              Refresh
            </Button>
          </Stack>
        </Stack>
      </Stack>

      <ARAdminRecords
        error={error}
        label={selectedResource?.label ?? 'AR Records'}
        loading={loading}
        onReload={reload}
        records={records}
        resource={resource}
      />
    </Stack>
  )
}
