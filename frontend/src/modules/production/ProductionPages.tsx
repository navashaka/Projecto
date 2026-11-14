import { Fragment, useEffect, useRef, useState, type FormEvent } from 'react'
import ModulePageFrame from '../shared/ModulePageFrame'
import type { ModulePageField } from '../types'
import {
  createProduction,
  createProductionEntry,
  deleteProduction,
  getProductionEntries,
  getProductions,
  updateProduction,
  type ProductionEntryRecord,
  type ProductionPayload,
  type ProductionRecord
} from './api'

const fields: ModulePageField[] = [
  {
    name: 'outputProductName',
    label: 'Name of Output Product',
    section: 'Product Details',
    required: true,
  },
  { name: 'uom', label: 'UOM' },
  { name: 'hsn', label: 'Select HSN' },
  { name: 'costElement', label: 'Select Cost Element' },

  { name: 'inputItem1', label: 'Input Item 1', section: 'Input Items' },
  { name: 'inputItem2', label: 'Input Item 2' },
  { name: 'inputItem3', label: 'Input Item 3' },

  {
    name: 'productionProduct',
    label: 'Select Name of Output Product',
    section: 'Production Entry',
  },
  { name: 'productionDate', label: 'Date', type: 'date' },
  { name: 'shiftA', label: 'Shift A Qty', type: 'number' },
  { name: 'shiftB', label: 'Shift B Qty', type: 'number' },
  { name: 'shiftC', label: 'Shift C Qty', type: 'number' },
  { name: 'totalQty', label: 'Total Qty', type: 'number' },

  {
    name: 'inputItemQtyConsumed',
    label: 'Input Item Qty Consumed',
    section: 'Input Consumption',
    type: 'number',
  },
]

const productFields = fields.slice(0, 7)
const entryFields = fields.slice(7)
const inputItemNames = ['inputItem1', 'inputItem2', 'inputItem3'] as const

const ProductionPage = () => {
  const [products, setProducts] = useState<ProductionRecord[]>([])
  const [entries, setEntries] = useState<ProductionEntryRecord[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [shiftA, setShiftA] = useState('0')
  const [shiftB, setShiftB] = useState('0')
  const [shiftC, setShiftC] = useState('0')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const productFormRef = useRef<HTMLFormElement>(null)
  const entryFormRef = useRef<HTMLFormElement>(null)

  const totalQty = (
    (Number(shiftA) || 0) +
    (Number(shiftB) || 0) +
    (Number(shiftC) || 0)
  ).toFixed(2)
  const selectedProduct = products.find(
    (product) => String(product.id) === selectedProductId
  )

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const loadedProducts = await getProductions()
        const loadedEntries = await Promise.all(
          loadedProducts.map((product) => getProductionEntries(product.id))
        )
        if (!cancelled) {
          setProducts(loadedProducts)
          setEntries(loadedEntries.flat())
          if (loadedProducts.length) {
            setSelectedProductId(String(loadedProducts[0].id))
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? `Unable to load Production data: ${loadError.message}`
              : 'Unable to load Production data.'
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

  const resetProductForm = () => {
    productFormRef.current?.reset()
    setEditingProductId(null)
  }

  const resetEntryForm = () => {
    entryFormRef.current?.reset()
    setSelectedProductId(products[0] ? String(products[0].id) : '')
    setShiftA('0')
    setShiftB('0')
    setShiftC('0')
  }

  const editProduct = (product: ProductionRecord) => {
    const form = productFormRef.current
    if (!form) return

    const values: Record<string, string> = {
      outputProductName: product.output_product_name,
      uom: product.uom ?? '',
      hsn: product.hsn ?? '',
      costElement: product.cost_element ?? ''
    }
    inputItemNames.forEach((name, index) => {
      values[name] = product.input_items[index]?.input_item_name ?? ''
    })
    Object.entries(values).forEach(([name, value]) => {
      const input = form.querySelector<HTMLInputElement>(
        `[name="${CSS.escape(name)}"]`
      )
      if (input) input.value = value
    })

    setEditingProductId(String(product.id))
    setError('')
    setSuccess('')
  }

  const submitProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const inputItems = inputItemNames
      .map((name) => String(formData.get(name) ?? '').trim())
      .filter(Boolean)
      .map((input_item_name) => ({ input_item_name }))
    const payload: ProductionPayload = {
      output_product_name: String(formData.get('outputProductName') ?? '').trim(),
      uom: String(formData.get('uom') ?? '').trim() || null,
      hsn: String(formData.get('hsn') ?? '').trim() || null,
      cost_element: String(formData.get('costElement') ?? '').trim() || null,
      input_items: inputItems
    }

    setIsSaving(true)
    setError('')
    setSuccess('')
    try {
      const saved = editingProductId
        ? await updateProduction(editingProductId, payload)
        : await createProduction(payload)
      setProducts((current) =>
        editingProductId
          ? current.map((product) => product.id === saved.id ? saved : product)
          : [...current, saved]
      )
      setSelectedProductId(String(saved.id))
      setSuccess(
        editingProductId
          ? 'Output product updated successfully.'
          : 'Output product saved successfully.'
      )
      resetProductForm()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? `Unable to save output product: ${saveError.message}`
          : 'Unable to save output product.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const removeProduct = async (product: ProductionRecord) => {
    if (!window.confirm('Delete this output product?')) return

    setIsSaving(true)
    setError('')
    setSuccess('')
    try {
      await deleteProduction(String(product.id))
      const remaining = products.filter((item) => item.id !== product.id)
      setProducts(remaining)
      if (selectedProductId === String(product.id)) {
        setSelectedProductId(remaining[0] ? String(remaining[0].id) : '')
      }
      if (editingProductId === String(product.id)) resetProductForm()
      setSuccess('Output product deleted successfully.')
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? `Unable to delete output product: ${deleteError.message}`
          : 'Unable to delete output product.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const submitEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const consumed = Number(formData.get('inputItemQtyConsumed'))
    const firstInputItem = selectedProduct?.input_items[0]?.input_item_name

    if (consumed > 0 && !firstInputItem) {
      setError('Add an input item to this output product before recording consumption.')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')
    try {
      const saved = await createProductionEntry({
        production_id: Number(selectedProductId),
        production_date: String(formData.get('productionDate') ?? ''),
        shift_a: Number(formData.get('shiftA')),
        shift_b: Number(formData.get('shiftB')),
        shift_c: Number(formData.get('shiftC')),
        consumption: firstInputItem
          ? [{ input_item_name: firstInputItem, qty_consumed: consumed }]
          : []
      })
      setEntries((current) => [...current, saved])
      setSuccess('Production entry saved successfully.')
      resetEntryForm()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? `Unable to save Production entry: ${saveError.message}`
          : 'Unable to save Production entry.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ModulePageFrame module="production" page="Production">
      <div className="alert alert-info" role="status">
        Output products and production entries are loaded and saved through the Production API.
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="status">{success}</div>}
      {isLoading && <p className="text-muted" role="status">Loading Production records…</p>}

      <section aria-labelledby="production-products-title" className="mb-5">
        <h2 id="production-products-title" className="h5 mb-3">Output Product</h2>
        <form
          ref={productFormRef}
          className="row g-3 mb-4"
          onSubmit={(event) => void submitProduct(event)}
        >
          {productFields.map((field, index) => (
            <Fragment key={`${field.name}-${index}`}>
              {field.section && (
                <div className="col-12 mt-2">
                  <h3 className="h5 border-bottom pb-2 mb-0">{field.section}</h3>
                </div>
              )}
              <div className="col-md-6">
                <label className="form-label" htmlFor={`production-${field.name}-${index}`}>
                  {field.label}
                </label>
                <input
                  className="form-control"
                  id={`production-${field.name}-${index}`}
                  name={field.name}
                  type={field.type ?? 'text'}
                  required={field.required ?? true}
                  onChange={(event) => {
                    if (field.uppercase) {
                      event.currentTarget.value = event.currentTarget.value.toUpperCase()
                    }
                  }}
                />
              </div>
            </Fragment>
          ))}
          <div className="col-12">
            <button className="btn btn-primary" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : editingProductId ? 'Update Output Product' : 'Add Output Product'}
            </button>
            {editingProductId && (
              <button className="btn btn-secondary ms-2" type="button" onClick={resetProductForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                {productFields.map((field) => <th key={field.name} scope="col">{field.label}</th>)}
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td className="text-center text-muted py-4" colSpan={productFields.length + 1}>
                    {isLoading ? 'Loading output products…' : 'No output products have been added.'}
                  </td>
                </tr>
              ) : products.map((product) => (
                <tr key={product.id}>
                  <td>{product.output_product_name}</td>
                  <td>{product.uom ?? ''}</td>
                  <td>{product.hsn ?? ''}</td>
                  <td>{product.cost_element ?? ''}</td>
                  {inputItemNames.map((name, index) => (
                    <td key={name}>{product.input_items[index]?.input_item_name ?? ''}</td>
                  ))}
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      type="button"
                      onClick={() => editProduct(product)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger ms-2"
                      type="button"
                      disabled={isSaving}
                      onClick={() => void removeProduct(product)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="production-entries-title">
        <h2 id="production-entries-title" className="h5 mb-3">Production Entry</h2>
        <form
          ref={entryFormRef}
          className="row g-3 mb-4"
          onSubmit={(event) => void submitEntry(event)}
        >
          {entryFields.map((field, index) => (
            <Fragment key={`${field.name}-${index}`}>
              {field.section && (
                <div className="col-12 mt-2">
                  <h3 className="h5 border-bottom pb-2 mb-0">{field.section}</h3>
                </div>
              )}
              <div className="col-md-6">
                <label className="form-label" htmlFor={`production-entry-${field.name}-${index}`}>
                  {field.label}
                </label>
                {field.name === 'productionProduct' ? (
                  <select
                    className="form-select"
                    id={`production-entry-${field.name}-${index}`}
                    name={field.name}
                    value={selectedProductId}
                    required={field.required ?? true}
                    onChange={(event) => setSelectedProductId(event.currentTarget.value)}
                  >
                    <option value="" disabled>Select an output product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.output_product_name}
                      </option>
                    ))}
                  </select>
                ) : field.name === 'totalQty' ? (
                  <input
                    className="form-control"
                    id={`production-entry-${field.name}-${index}`}
                    name={field.name}
                    type="number"
                    value={totalQty}
                    readOnly
                  />
                ) : (
                  <input
                    className="form-control"
                    id={`production-entry-${field.name}-${index}`}
                    name={field.name}
                    type={field.type ?? 'text'}
                    required={field.required ?? true}
                    min={field.type === 'number' ? 0 : undefined}
                    step={field.type === 'number' ? '0.01' : undefined}
                    value={
                      field.name === 'shiftA' ? shiftA
                        : field.name === 'shiftB' ? shiftB
                          : field.name === 'shiftC' ? shiftC
                            : undefined
                    }
                    onChange={(event) => {
                      const value = event.currentTarget.value
                      if (field.name === 'shiftA') setShiftA(value)
                      if (field.name === 'shiftB') setShiftB(value)
                      if (field.name === 'shiftC') setShiftC(value)
                    }}
                  />
                )}
                {field.name === 'inputItemQtyConsumed' && (
                  <div className="form-text">
                    {selectedProduct?.input_items[0]
                      ? `Recorded against ${selectedProduct.input_items[0].input_item_name}.`
                      : 'Configure an input item on the output product to record consumption.'}
                  </div>
                )}
              </div>
            </Fragment>
          ))}
          <div className="col-12">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={isSaving || products.length === 0}
            >
              {isSaving ? 'Saving…' : 'Add Production Entry'}
            </button>
          </div>
        </form>

        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th scope="col">Name of Output Product</th>
                <th scope="col">Date</th>
                <th scope="col">Shift A Qty</th>
                <th scope="col">Shift B Qty</th>
                <th scope="col">Shift C Qty</th>
                <th scope="col">Total Qty</th>
                <th scope="col">Input Item Qty Consumed</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td className="text-center text-muted py-4" colSpan={7}>
                    {isLoading ? 'Loading Production entries…' : 'No Production entries have been added.'}
                  </td>
                </tr>
              ) : entries.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    {products.find((product) => product.id === entry.production_id)?.output_product_name
                      ?? entry.production_id}
                  </td>
                  <td>{entry.production_date}</td>
                  <td>{entry.shift_a}</td>
                  <td>{entry.shift_b}</td>
                  <td>{entry.shift_c}</td>
                  <td>{entry.total_qty}</td>
                  <td>
                    {entry.consumption
                      .map((item) => `${item.input_item_name}: ${item.qty_consumed}`)
                      .join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </ModulePageFrame>
  )
}

export default ProductionPage
