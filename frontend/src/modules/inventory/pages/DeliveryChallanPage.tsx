import InventoryResourceForm from '../components/InventoryResourceForm'
import { getInventoryResourceDefinition } from '../constants/inventoryConstants'

function DeliveryChallanPage() {
  return (
    <InventoryResourceForm
      resource={getInventoryResourceDefinition('delivery-challans')}
    />
  )
}

export default DeliveryChallanPage
