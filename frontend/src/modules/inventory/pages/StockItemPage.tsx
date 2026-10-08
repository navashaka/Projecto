import InventoryResourceForm from '../components/InventoryResourceForm'
import { getInventoryResourceDefinition } from '../constants/inventoryConstants'

function StockItemPage() {
  return (
    <InventoryResourceForm
      resource={getInventoryResourceDefinition('stock-items')}
    />
  )
}

export default StockItemPage
