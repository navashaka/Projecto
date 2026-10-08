import InventoryResourceForm from '../components/InventoryResourceForm'
import { getInventoryResourceDefinition } from '../constants/inventoryConstants'

function GateEntryPage() {
  return (
    <InventoryResourceForm
      resource={getInventoryResourceDefinition('gate-entries')}
    />
  )
}

export default GateEntryPage
