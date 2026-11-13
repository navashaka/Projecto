import ModuleDataPage from '../shared/ModuleDataPage'
import type { ModulePageField } from '../types'

const fields : ModulePageField[] = [
  { name: 'nameOfOrganization', label: 'Name of the Organization', section: 'Organization Details', required: true },
  { name: 'cinFirmRegistration', label: 'CIN / Firm Registration' },
  { name: 'pan', label: 'PAN', uppercase: true },
  { name: 'gstRegistrationCorporateOffice', label: 'GST Registration of Corporate Office' },
  { name: 'doorHouseFlatSurveyFloorNo', label: 'Door No. / House No. / Flat No. / Survey No. / Floor No.', section: 'Address of Corporate Office / Registered Office' },
  { name: 'buildingName', label: 'Name of the Building' },
  { name: 'landmark', label: 'Landmark' },
  { name: 'streetNameRoadNo', label: 'Street Name / Road No.' },
  { name: 'areaColony', label: 'Area / Colony' },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State', type: 'select', lookup: 'states' },
  { name: 'pinCode', label: 'PIN Code', type: 'select', lookup: 'pincodes' },
  { name: 'country', label: 'Country', type: 'select', lookup: 'countries' },
  { name: 'typeOfAccount', label: 'Type of Account', section: 'Banks & Accounts at Corporate Office / Registered Office', type: 'select', options: ['Current', 'OD', 'OCC'] },
  { name: 'glAccount', label: 'GL Account' },
  { name: 'primaryBankAccountNo', label: 'Primary Bank Account No.' },
  { name: 'primaryIfsc', label: 'Primary IFSC' },
  { name: 'secondaryBankAccountNo', label: 'Secondary Bank Account No.' },
  { name: 'secondaryIfsc', label: 'Secondary IFSC' },
  { name: 'primaryCurrency', label: 'Primary Currency', type: 'select', options: ['INR'] },
  { name: 'typeOfBusiness', label: 'Type of Business', section: 'Business Details', type: 'select', options: ['Manufacturing', 'Trading', 'Service Provider', 'All'] },
]

const ProfilePage = () => (
  <ModuleDataPage module="profile" title="Profile" fields={fields} />
)

export default ProfilePage