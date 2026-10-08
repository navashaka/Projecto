import InventoryResourceForm from '../components/InventoryResourceForm'
import { getInventoryResourceDefinition } from '../constants/inventoryConstants'

function IndentPage() {
  return (
    <InventoryResourceForm
      resource={getInventoryResourceDefinition('indents')}
    />
  )
}

export default IndentPage
