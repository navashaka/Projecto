import ModuleDataPage from '../shared/ModuleDataPage'
import type { ModulePageField } from '../types'

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

const ProductionPage = () => (
  <ModuleDataPage
    module="production"
    title="Production"
    fields={fields}
  />
)

export default ProductionPage