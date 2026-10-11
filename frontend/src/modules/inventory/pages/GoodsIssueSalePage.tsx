import InventoryResourceForm from '../components/InventoryResourceForm'
import { getInventoryResourceDefinition } from '../constants/inventoryConstants'

function GoodsIssueSalePage() {
  return (
    <InventoryResourceForm
      resource={getInventoryResourceDefinition('goods-issue-sales')}
    />
  )
}

export default GoodsIssueSalePage
