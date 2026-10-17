import { Autocomplete, TextField } from '@mui/material'
import { sortOptionsByLabel } from '../../../utils/sortOptions'

export interface AdminResourceOption {
  key: string
  label: string
}

interface AdminResourceSelectProps {
  options: AdminResourceOption[]
  value: string
  label: string
  disabled?: boolean
  onChange: (key: string) => void
}

export default function AdminResourceSelect({
  options,
  value,
  label,
  disabled = false,
  onChange,
}: AdminResourceSelectProps) {
  const selectedOption = options.find((option) => option.key === value) ?? null

  return (
    <Autocomplete<AdminResourceOption, false, true, false, 'div', string>
      autoHighlight
      disableClearable
      disabled={disabled}
      getOptionValue={(option) => option.key}
      getOptionLabel={(option) => option.label}
      noOptionsText="No results found"
      onChange={(_event, option) => {
        if (option) onChange(option)
      }}
      options={sortOptionsByLabel(options, (option) => option.label)}
      renderInput={(params) => (
        <TextField {...params} label={label} size="small" />
      )}
      value={selectedOption?.key ?? ''}
      sx={{ minWidth: 240 }}
    />
  )
}
