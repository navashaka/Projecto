import InventoryResourceForm from '../components/InventoryResourceForm'
import { getInventoryResourceDefinition } from '../constants/inventoryConstants'

function StockGroupPage() {
  return (
    <InventoryResourceForm
      resource={getInventoryResourceDefinition('stock-groups')}
    />
  )
}

export default StockGroupPage
