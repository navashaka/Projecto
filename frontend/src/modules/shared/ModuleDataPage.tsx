import { Fragment, useState, type FormEvent } from 'react'
import ModulePageFrame from './ModulePageFrame'
import type { ModuleId, ModulePageField } from '../types'

type ModuleDataPageProps = {
  module: ModuleId
  title: string
  fields: ModulePageField[]
}

type PageRecord = {
  id: string
  values: Record<string, string>
}

const ModuleDataPage = ({ module, title, fields }: ModuleDataPageProps) => {
  const [records, setRecords] = useState<PageRecord[]>([])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const values = Object.fromEntries(
      Array.from(new FormData(event.currentTarget).entries()).map(([key, value]) => [
        key,
        String(value)
      ])
    )
    setRecords((currentRecords) => [
      ...currentRecords,
      { id: crypto.randomUUID(), values }
    ])
    event.currentTarget.reset()
  }

  return (
    <ModulePageFrame module={module} page={title}>
      <div className="alert alert-info" role="status">
        Entries on this page are held in the current browser session and are not saved to the database yet.
      </div>

      <form className="row g-3 mb-4" onSubmit={handleSubmit}>
        {fields.map((field, index) => (
          <Fragment key={field.name}>
            {field.section && (index === 0 || fields[index - 1].section !== field.section) && (
              <div className="col-12 mt-2">
                <h2 className="h5 border-bottom pb-2 mb-0">{field.section}</h2>
              </div>
            )}
            <div className="col-md-6">
              <label className="form-label" htmlFor={`${module}-${field.name}`}>
                {field.label}
              </label>
              {field.type === 'select' ? (
                <select
                  className="form-select"
                  id={`${module}-${field.name}`}
                  name={field.name}
                  required={field.required ?? true}
                  defaultValue=""
                >
                  <option value="" disabled>Select {field.label.toLowerCase()}</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  className="form-control"
                  id={`${module}-${field.name}`}
                  name={field.name}
                  required={field.required ?? true}
                  rows={3}
                />
              ) : (
                <input
                  className="form-control"
                  id={`${module}-${field.name}`}
                  name={field.name}
                  type={field.type ?? 'text'}
                  required={field.required ?? true}
                />
              )}
            </div>
          </Fragment>
        ))}
        <div className="col-12">
          <button className="btn btn-primary" type="submit">
            Add {title}
          </button>
        </div>
      </form>

      <div className="table-responsive">
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              {fields.map((field) => <th key={field.name} scope="col">{field.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td className="text-center text-muted py-4" colSpan={fields.length}>
                  No {title.toLowerCase()} records have been added.
                </td>
              </tr>
            ) : records.map((record) => (
              <tr key={record.id}>
                {fields.map((field) => (
                  <td key={field.name}>{record.values[field.name]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModulePageFrame>
  )
}

export default ModuleDataPage
