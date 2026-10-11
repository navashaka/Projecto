import InventoryResourceForm from '../components/InventoryResourceForm'
import { getInventoryResourceDefinition } from '../constants/inventoryConstants'

function DeliveryChallanInwardPage() {
  return (
    <InventoryResourceForm
      resource={getInventoryResourceDefinition('delivery-challan-inwards')}
    />
  )
}

export default DeliveryChallanInwardPage
