import {
  Alert,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import {
  createInventoryRecord,
  getInventoryCollection,
} from '../actions/inventoryActions'
import type { InventoryRecord } from '../types/inventoryTypes'
import { formatInventoryError } from '../utils/inventoryFormUtils'

const unitOfMeasureEndpoint = '/inventory/unit-of-measures'

function UnitOfMeasurePage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<InventoryRecord[]>([])
  const [selectedUnits, setSelectedUnits] = useState<InventoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [newUomMode, setNewUomMode] = useState(false)
  const [newSymbol, setNewSymbol] = useState('')
  const [newName, setNewName] = useState('')
  const [newDecimals, setNewDecimals] = useState('0')

  const loadUnits = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const data = await getInventoryCollection(unitOfMeasureEndpoint)
      setRecords(data)
    } catch (error) {
      setErrorMessage(
        formatInventoryError(
          error,
          'Unable to load units of measure from the backend.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadUnits)
  }, [loadUnits])

  const selectedUnit = records.find(
    (record) => String(record.id) === selectedUnitId,
  )

  const clearSelection = () => setSelectedUnitId('')

  const addSelectedUnit = () => {
    if (!selectedUnit) {
      return
    }

    const alreadyAdded = selectedUnits.some(
      (unit) =>
        unit.id === selectedUnit.id ||
        unit.symbol === selectedUnit.symbol,
    )

    if (alreadyAdded) {
      setErrorMessage('This unit of measure has already been added.')
      return
    }

    setSelectedUnits((units) => [...units, selectedUnit])
    setErrorMessage('')
    setSuccessMessage('')
    clearSelection()
  }

  const removeSelectedUnit = (unitToRemove: InventoryRecord) => {
    setSelectedUnits((units) =>
      units.filter(
        (unit) =>
          unit.id !== unitToRemove.id &&
          unit.symbol !== unitToRemove.symbol,
      ),
    )
  }

  const startCreatingUnit = () => {
    setNewSymbol('')
    setNewName('')
    setNewDecimals('0')
    setNewUomMode(true)
    setErrorMessage('')
    setSuccessMessage('')
  }

  const createNewUnit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreating(true)
    setErrorMessage('')
    setSuccessMessage('')

    const decimals = Number(newDecimals)
    if (
      !Number.isFinite(decimals) ||
      decimals < 0 ||
      decimals > 9.9 ||
      Math.round(decimals * 10) !== decimals * 10
    ) {
      setErrorMessage(
        'Number of decimals must be from 0.0 to 9.9 with one decimal place at most.',
      )
      setCreating(false)
      return
    }

    try {
      const createdUnit = await createInventoryRecord(
        unitOfMeasureEndpoint,
        {
          symbol: newSymbol.trim(),
          name: newName.trim(),
          number_of_decimals: decimals,
        },
      )
      setSuccessMessage('Saved successfully!')
      await loadUnits()
      setNewUomMode(false)

      if (createdUnit.id !== undefined && createdUnit.id !== null) {
        setSelectedUnitId(String(createdUnit.id))
      }
    } catch (error) {
      setErrorMessage(
        formatInventoryError(
          error,
          'Unable to create the Unit of Measure.',
        ),
      )
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <Stack spacing={3}>
        <Paper sx={{ p: { xs: 2, md: 4 } }}>
          <Stack spacing={3}>
          <Typography variant="h5">Unit of Measure</Typography>

          {loading && (
            <Alert icon={<CircularProgress size={20} />} severity="info">
              Loading units of measure...
            </Alert>
          )}

          {errorMessage && (
            <Alert severity="error">{errorMessage}</Alert>
          )}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl
                disabled={loading || records.length === 0}
                fullWidth
                required
                size="small"
              >
                <InputLabel id="uom-name-label">Name *</InputLabel>
                <Select
                  label="Name *"
                  labelId="uom-name-label"
                  onChange={(event) =>
                    setSelectedUnitId(String(event.target.value))
                  }
                  value={selectedUnitId}
                >
                  <MenuItem value="">
                    {loading
                      ? 'Loading UOM names...'
                      : records.length === 0
                        ? 'No UOM names available'
                        : 'Select name'}
                  </MenuItem>
                  {records.map((record, index) => (
                    <MenuItem
                      key={
                        typeof record.id === 'number'
                          ? record.id
                          : `uom-name-${index}`
                      }
                      value={
                        typeof record.id === 'number' ||
                        typeof record.id === 'string'
                          ? record.id
                          : ''
                      }
                    >
                      {typeof record.name === 'string' ? record.name : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Symbol"
                size="small"
                value={
                  typeof selectedUnit?.symbol === 'string'
                    ? selectedUnit.symbol
                    : ''
                }
                slotProps={{
                  input: { readOnly: true },
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Number of decimals"
                size="small"
                type="number"
                value={
                  selectedUnit?.number_of_decimals === null ||
                  selectedUnit?.number_of_decimals === undefined
                    ? ''
                    : String(selectedUnit.number_of_decimals)
                }
                slotProps={{
                  input: { readOnly: true },
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>
          </Grid>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
          >
            <Button
              disabled={!selectedUnit || loading}
              onClick={addSelectedUnit}
              type="button"
              variant="contained"
            >
              Add
            </Button>
            <Button
              disabled={loading}
              onClick={() => void loadUnits()}
              type="button"
              variant="outlined"
            >
              Refresh
            </Button>
            <Button
              disabled={newUomMode}
              onClick={startCreatingUnit}
              type="button"
              variant="outlined"
            >
              Create New UOM
            </Button>
          </Stack>

            <Stack spacing={1}>
              <Typography variant="h6">Selected Units of Measure</Typography>
              {selectedUnits.map((unit, index) => (
                <Paper
                  key={
                    typeof unit.id === 'number'
                      ? unit.id
                      : `${String(unit.symbol)}-${index}`
                  }
                  sx={{ p: 2 }}
                  variant="outlined"
                >
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography>
                      {String(unit.name ?? '')} ({String(unit.symbol ?? '')})
                      {' · '}
                      Number of decimals:{' '}
                      {String(unit.number_of_decimals ?? '')}
                    </Typography>
                    <IconButton
                      aria-label={`Remove ${String(unit.name ?? 'unit')}`}
                      color="error"
                      onClick={() => removeSelectedUnit(unit)}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>
        </Paper>
        {newUomMode && (
          <Paper
            component="form"
            id="uom-create-form"
            onSubmit={createNewUnit}
            sx={{ p: { xs: 2, md: 4 } }}
          >
            <Stack spacing={2}>
              <Typography variant="h6">Create New UOM</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Symbol"
                    onChange={(event) => setNewSymbol(event.target.value)}
                    required
                    size="small"
                    slotProps={{ htmlInput: { maxLength: 20 } }}
                    value={newSymbol}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Name"
                    onChange={(event) => setNewName(event.target.value)}
                    required
                    size="small"
                    slotProps={{ htmlInput: { maxLength: 100 } }}
                    value={newName}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Number of decimals"
                    onChange={(event) => setNewDecimals(event.target.value)}
                    size="small"
                    slotProps={{
                      htmlInput: { max: 9.9, min: 0, step: 0.1 },
                    }}
                    type="number"
                    value={newDecimals}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Paper>
        )}
        <Stack
          direction="row"
          spacing={1}
          sx={{ justifyContent: 'flex-end' }}
        >
          <Button
            disabled={(!newUomMode && selectedUnits.length === 0) || creating}
            form={newUomMode ? 'uom-create-form' : undefined}
            onClick={() => {
              if (!newUomMode) {
                setErrorMessage(
                  'The selected UOMs are only staged on this page. The backend does not provide an operation to save a selected UOM list.',
                )
              }
            }}
            type={newUomMode ? 'submit' : 'button'}
            variant="contained"
          >
            {creating ? 'Saving...' : 'Save'}
          </Button>
          <Button
            onClick={() => navigate('/inventory')}
            type="button"
            variant="outlined"
          >
            Back
          </Button>
        </Stack>
      </Stack>

      <Snackbar
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
        open={successMessage !== ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccessMessage('')}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default UnitOfMeasurePage
