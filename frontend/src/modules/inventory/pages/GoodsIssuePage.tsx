import InventoryResourceForm from '../components/InventoryResourceForm'
import { getInventoryResourceDefinition } from '../constants/inventoryConstants'

function GoodsIssuePage() {
  return (
    <InventoryResourceForm
      resource={getInventoryResourceDefinition('goods-issues')}
    />
  )
}

export default GoodsIssuePage
