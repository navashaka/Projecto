import { Fragment, useEffect, useRef, useState, type FormEvent } from 'react'
import {
  createProfile,
  deleteProfile,
  getProfileLookups,
  getProfiles,
  updateProfile,
  type ProfileLookupOption,
  type ProfileRecord
} from './api'
import ModulePageFrame from '../shared/ModulePageFrame'
import type { ModulePageField } from '../types'

const fields: ModulePageField[] = [
  { name: 'nameOfOrganization', label: 'Name of the Organization', section: 'Organization Details', required: true },
  { name: 'cinFirmRegistration', label: 'CIN / Firm Registration' },
  { name: 'pan', label: 'PAN', uppercase: true },
  { name: 'gstRegistrationCorporateOffice', label: 'GST Registration of Office' },
  { name: 'doorHouseFlatSurveyFloorNo', label: 'Flat No', section: 'Address of Registered Office' },
  { name: 'buildingName', label: 'Name of the Building' },
  { name: 'landmark', label: 'Landmark' },
  { name: 'streetNameRoadNo', label: 'Street Name ' },
  { name: 'areaColony', label: 'Area' },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State', type: 'select', lookup: 'states' },
  { name: 'pinCode', label: 'PIN Code', type: 'select', lookup: 'pincodes' },
  { name: 'country', label: 'Country', type: 'select', lookup: 'countries' },
  { name: 'typeOfAccount', label: 'Type of Account', section: 'Banks & Accounts at Registered Office', type: 'select', options: ['Current', 'OD', 'OCC'] },
  { name: 'glAccount', label: 'GL Account' },
  { name: 'primaryBankAccountNo', label: 'Primary Bank Account No.' },
  { name: 'primaryIfsc', label: 'Primary IFSC' },
  { name: 'secondaryBankAccountNo', label: 'Secondary Bank Account No.' },
  { name: 'secondaryIfsc', label: 'Secondary IFSC' },
  { name: 'primaryCurrency', label: 'Primary Currency', type: 'select', options: ['INR'] },
  { name: 'typeOfBusiness', label: 'Type of Business', section: 'Business Details', type: 'select', options: ['Manufacturing', 'Trading', 'Service Provider', 'All'] },
]

const toSnakeCase = (value: string) =>
  value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)

const ProfilePage = () => {
  const [records, setRecords] = useState<ProfileRecord[]>([])
  const [lookups, setLookups] = useState<Record<string, ProfileLookupOption[]>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [profileRecords, states, pincodes, countries] = await Promise.all([
          getProfiles(),
          getProfileLookups('states'),
          getProfileLookups('pincodes'),
          getProfileLookups('countries')
        ])
        if (!cancelled) {
          setRecords(profileRecords)
          setLookups({ states, pincodes, countries })
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? `Unable to load Profile data: ${loadError.message}`
              : 'Unable to load Profile data.'
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const resetForm = () => {
    formRef.current?.reset()
    setEditingId(null)
  }

  const editRecord = (record: ProfileRecord) => {
    const form = formRef.current
    if (!form) return

    fields.forEach((field) => {
      const control = form.querySelector<HTMLInputElement | HTMLSelectElement>(
        `[name="${CSS.escape(field.name)}"]`
      )
      const value = record[toSnakeCase(field.name)]
      if (control) control.value = value === null || value === undefined ? '' : String(value)
    })

    setEditingId(String(record.id))
    setError('')
    setSuccess('')
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const payload = Object.fromEntries(
      fields.map((field) => {
        const value = String(formData.get(field.name) ?? '').trim()
        return [toSnakeCase(field.name), value || null]
      })
    )

    setIsSaving(true)
    setError('')
    setSuccess('')
    try {
      const saved = editingId
        ? await updateProfile(editingId, payload)
        : await createProfile(payload)
      setRecords((current) =>
        editingId
          ? current.map((record) => record.id === saved.id ? saved : record)
          : [...current, saved]
      )
      setSuccess(editingId ? 'Profile updated successfully.' : 'Profile saved successfully.')
      resetForm()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? `Unable to save Profile: ${saveError.message}`
          : 'Unable to save Profile.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const removeRecord = async (record: ProfileRecord) => {
    if (!window.confirm('Delete this profile record?')) return

    setIsSaving(true)
    setError('')
    setSuccess('')
    try {
      await deleteProfile(String(record.id))
      setRecords((current) => current.filter((item) => item.id !== record.id))
      if (editingId === String(record.id)) resetForm()
      setSuccess('Profile deleted successfully.')
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? `Unable to delete Profile: ${deleteError.message}`
          : 'Unable to delete Profile.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ModulePageFrame module="profile" page="Profile">
      <div className="alert alert-info" role="status">
        Profile records are loaded and saved through the Profile API.
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="status">{success}</div>}
      {isLoading && <p className="text-muted" role="status">Loading Profile records…</p>}

      <form ref={formRef} className="row g-3 mb-4" onSubmit={(event) => void submit(event)}>
        {fields.map((field, index) => (
          <Fragment key={`${field.name}-${index}`}>
            {field.section && (
              <div className="col-12 mt-2">
                <h2 className="h5 border-bottom pb-2 mb-0">{field.section}</h2>
              </div>
            )}
            <div className="col-md-6">
              <label className="form-label" htmlFor={`profile-${field.name}-${index}`}>
                {field.label}
              </label>
              {field.type === 'select' ? (
                <select
                  className="form-select"
                  id={`profile-${field.name}-${index}`}
                  name={field.name}
                  required={field.required ?? true}
                  defaultValue={field.name === 'primaryCurrency' ? 'INR' : ''}
                >
                  <option value="" disabled>Select {field.label.toLowerCase()}</option>
                  {field.lookup
                    ? lookups[field.lookup]?.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))
                    : field.options?.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                </select>
              ) : (
                <input
                  className="form-control"
                  id={`profile-${field.name}-${index}`}
                  name={field.name}
                  type={field.type ?? 'text'}
                  required={field.required ?? true}
                  onChange={(event) => {
                    if (field.uppercase) {
                      event.currentTarget.value = event.currentTarget.value.toUpperCase()
                    }
                  }}
                />
              )}
            </div>
          </Fragment>
        ))}
        <div className="col-12">
          <button className="btn btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : editingId ? 'Update Profile' : 'Add Profile'}
          </button>
          {editingId && (
            <button className="btn btn-secondary ms-2" type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="table-responsive">
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              {fields.map((field) => <th key={field.name} scope="col">{field.label}</th>)}
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td className="text-center text-muted py-4" colSpan={fields.length + 1}>
                  {isLoading ? 'Loading Profile records…' : 'No Profile records have been added.'}
                </td>
              </tr>
            ) : records.map((record) => (
              <tr key={record.id}>
                {fields.map((field) => (
                  <td key={field.name}>
                    {field.lookup
                      ? lookups[field.lookup]?.find(
                          (option) => option.value === String(record[toSnakeCase(field.name)] ?? '')
                        )?.label ?? record[toSnakeCase(field.name)] ?? ''
                      : record[toSnakeCase(field.name)] ?? ''}
                  </td>
                ))}
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    type="button"
                    onClick={() => editRecord(record)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger ms-2"
                    type="button"
                    disabled={isSaving}
                    onClick={() => void removeRecord(record)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModulePageFrame>
  )
}

export default ProfilePage
