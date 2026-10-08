import InventoryResourceForm from '../components/InventoryResourceForm'
import { getInventoryResourceDefinition } from '../constants/inventoryConstants'

function MaterialReceiptNotePage() {
  return (
    <InventoryResourceForm
      resource={getInventoryResourceDefinition('material-receipt-notes')}
    />
  )
}

export default MaterialReceiptNotePage
