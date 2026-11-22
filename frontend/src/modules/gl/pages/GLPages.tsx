import ModuleDataPage from '../../shared/ModuleDataPage'
import ModulePageFrame from '../../shared/ModulePageFrame'
import type { ModulePageField, ModulePageSelection } from '../../types'

const hsnFields: ModulePageField[] = [
  { name: 'chapter', label: 'Chapter', required: true },
  { name: 'heading', label: 'Heading', required: true },
  { name: 'subHeading', label: 'Sub-Heading', required: true },
  { name: 'hsnCode', label: 'HSN_CD / Tariff Item', required: true },
  { name: 'hsnDescription', label: 'HSN Description', required: true },
  { name: 'cgstRate', label: 'CGST Rate (%)', type: 'number', required: true },
  { name: 'sgstRate', label: 'SGST / UTGST Rate (%)', type: 'number', required: true },
  { name: 'igstRate', label: 'IGST Rate (%)', type: 'number', required: true },
  { name: 'compensationCess', label: 'Compensation Cess', type: 'number' },
  { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
]

const sacFields: ModulePageField[] = [
  { name: 'chapter', label: 'Chapter', required: true },
  { name: 'heading', label: 'Heading', required: true },
  { name: 'sacCode', label: 'SAC_CD', required: true },
  { name: 'sacDescription', label: 'SAC Description', required: true },
  { name: 'cgstRate', label: 'CGST Rate (%)', type: 'number', required: true },
  { name: 'sgstRate', label: 'SGST / UTGST Rate (%)', type: 'number', required: true },
  { name: 'igstRate', label: 'IGST Rate (%)', type: 'number', required: true },
  { name: 'compensationCess', label: 'Compensation Cess', type: 'number' },
  { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
]

const taxableGroups = [
  'Sales Accounts',
  'Direct Incomes',
  'Indirect Incomes',
  'Purchase Accounts',
  'Direct Expenses',
  'Indirect Expenses',
]
const sundryGroups = ['Sundry Creditors', 'Sundry Debtors']
const loanGroups = ['Secured Loans', 'Unsecured Loans']
const groupVisibility = (values: string[]): NonNullable<ModulePageField['visibleWhen']> => [
  { field: 'group', values, lookupLabel: true },
]

type GLPageNavigationProps = {
  onSelectPage?: (selection: ModulePageSelection) => void
}

export const TaxTypePage = () => (
  <ModuleDataPage module="gl" title="Tax Type" fields={[
    { name: 'taxTypeName', label: 'Name of Tax Type', required: true },
    { name: 'taxRate', label: 'Rate of Tax Type', type: 'number', required: true },
    { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
    { name: 'glAccount', label: 'Select GL Account', type: 'select', lookup: 'accounts', required: true },
  ]} />
)

export const GroupPage = () => (
  <ModuleDataPage module="gl" title="Group" fields={[
    { name: 'groupName', label: 'Name of Group', required: true },
    { name: 'parentGroup', label: 'Select Group', type: 'select', lookup: 'groups' },
    { name: 'groupCode', label: 'Create Group Code', required: true },
  ]} />
)

export const GLAccountPage = ({ onSelectPage }: GLPageNavigationProps = {}) => (
  <ModuleDataPage module="gl" title="GL Account" fields={[
    { name: 'glAccountName', label: 'Name of GL Account', required: true },
    { name: 'costApplicable', label:'Costing Applicable', type: 'select', options: ['Yes', 'No']},
    { name: 'group', label: 'Select Group', type: 'select', lookup: 'groups', required: true },
    {
      name: 'taxApplicable',
      label: 'Tax Applicable?',
      type: 'select',
      options: ['Yes', 'No'],
      required: true,
    },
    {
      name: 'taxType',
      label: 'Select Tax Type',
      type: 'select',
      lookup: 'tax-types',
      required: true,
      visibleWhen: [
        ...groupVisibility(taxableGroups),
        { field: 'taxApplicable', values: ['Yes'] },
      ],
      actionOption: {
        label: 'Open Tax Applicability',
        onSelect: () => onSelectPage?.({ module: 'gl', page: 'tax-applicability' }),
      },
    },
    {
      name: 'costingApplicable',
      label: 'Costing applicable?',
      type: 'select',
      options: ['Yes', 'No'],
      required: true,
      visibleWhen: groupVisibility(taxableGroups),
    },
    {
      name: 'depreciationApplicable',
      label: 'Depreciation applicable?',
      type: 'select',
      options: ['Yes', 'No'],
      required: true,
      visibleWhen: groupVisibility(['Fixed Assets']),
    },
    {
      name: 'loanDate',
      label: 'Date of Loan taken',
      type: 'date',
      required: true,
      visibleWhen: groupVisibility(loanGroups),
    },
    {
      name: 'rateOfInterest',
      label: 'Rate of Interest',
      type: 'number',
      required: true,
      visibleWhen: groupVisibility(loanGroups),
    },
    {
      name: 'effectiveDate',
      label: 'Effective Date for Interest',
      type: 'date',
      required: true,
      visibleWhen: groupVisibility(loanGroups),
    },
    {
      name: 'maintainBillWise',
      label: 'Maintain Bill Wise',
      type: 'select',
      options: ['Yes', 'No'],
      required: true,
      visibleWhen: groupVisibility(sundryGroups),
    },
    {
      name: 'defaultCreditDays',
      label: 'Default Credit Days',
      type: 'number',
      required: true,
      visibleWhen: [
        ...groupVisibility(sundryGroups),
        { field: 'maintainBillWise', values: ['Yes'] },
      ],
    },
    {
      name: 'checkCreditDays',
      label: 'Check Credit Days',
      type: 'select',
      options: ['Yes', 'No'],
      required: true,
      visibleWhen: [
        ...groupVisibility(sundryGroups),
        { field: 'maintainBillWise', values: ['Yes'] },
      ],
    },
  ]}
    onFieldChange={(fieldName, value) => {
      if (fieldName === 'taxApplicable' && value === 'Yes') {
        onSelectPage?.({ module: 'gl', page: 'tax-applicability' })
      }
    }}
  />
)

export const HSNPage = () => (
  <ModuleDataPage module="gl" title="Create HSN" fields={hsnFields} />
)

export const SACPage = () => (
  <ModuleDataPage module="gl" title="Create SAC" fields={sacFields} />
)

export const TaxApplicabilityPage = ({ onSelectPage }: GLPageNavigationProps = {}) => (
  <ModulePageFrame module="gl" page="Tax Applicability">
    <div className="d-flex gap-2">
      <button
        className="btn btn-outline-primary"
        type="button"
        onClick={() => onSelectPage?.({ module: 'gl', page: 'hsn' })}
      >
        Select HSN
      </button>
      <button
        className="btn btn-outline-primary"
        type="button"
        onClick={() => onSelectPage?.({ module: 'gl', page: 'sac' })}
      >
        Select SAC
      </button>
    </div>
  </ModulePageFrame>
)

export const BankAccountPage = () => (
  <ModuleDataPage module="gl" title="Bank Accounts" fields={[
    { name: 'accountHolderName', label: 'Account Holder Name', required: true },
    { name: 'accountNumber', label: 'Account Number', required: true },
    { name: 'bankName', label: 'Bank Name', required: true },
    { name: 'branch', label: 'Branch', required: true },
    { name: 'ifscCode', label: 'IFS Code', required: true },
    { name: 'swiftCode', label: 'SWIFT Code' },
    { name: 'enableChequeIssue', label: 'Enable Cheque Issue', type: 'select', options: ['Yes', 'No'], required: true },
    { name: 'reconciliationStartDate', label: 'Reconciliation Starts from Date', type: 'date', required: true },
    { name: 'enableEpayments', label: 'Enable E Payments', type: 'select', options: ['Yes', 'No'], required: true },
  ]} />
)

export const ChequeRangePage = () => (
  <ModuleDataPage module="gl" title=" Cheque Range" fields={[
    { name: 'chequeImage', label: 'Upload Cheque Image', type: 'file' },
    { name: 'accountNumber', label: 'Select Account Number', type: 'select', lookup: 'bank-accounts', required: true },
    { name: 'fromNumber', label: 'From Number', type: 'number', required: true },
    { name: 'toNumber', label: 'To Number', type: 'number', required: true },
  ]} />
)

export const BankODCCAccountPage = () => (
  <ModuleDataPage module="gl" title="Bank OCC Account / OD Account / CC Account" fields={[
    { name: 'odLimitEnabled', label: 'OD Limit Enabled', type: 'select', options: ['Yes', 'No'], required: true },
    { name: 'accountHolderName', label: 'Account Holder Name (Default Company Name)', required: true },
    { name: 'accountNumber', label: 'Account Number', required: true },
    { name: 'bankName', label: 'Bank Name', required: true },
    { name: 'branch', label: 'Branch', required: true },
    { name: 'ifscCode', label: 'IFS Code', required: true },
    { name: 'swiftCode', label: 'SWIFT Code' },
    { name: 'enableChequeIssue', label: 'Enable Cheque Issue', type: 'select', options: ['Yes', 'No'], required: true },
    { name: 'reconciliationStartDate', label: 'Reconciliation Starts from Date', type: 'date', required: true },
    { name: 'enableEpayments', label: 'Enable E Payments', type: 'select', options: ['Yes', 'No'], required: true },
  ]} />
)

export const ODLimitPage = () => (
  <ModuleDataPage module="gl" title="OD Limit" fields={[
    { name: 'accountNumber', label: 'Select Account Number', type: 'select', lookup: 'bank-accounts', required: true },
    { name: 'odLimit', label: 'OD Limit', type: 'number', required: true },
    { name: 'rateOfInterest', label: 'Rate of Interest', type: 'number', required: true },
    { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
  ]} />
)

export const FixedAssetsPage = () => (
  <ModuleDataPage module="gl" title="Fixed Assets" fields={[
    { name: 'accountId', label: 'GL Account', type: 'select', lookup: 'accounts', required: true },
    { name: 'depreciationApplicable', label: 'Depreciation Applicable?', type: 'select', options: ['Yes', 'No'], required: true },
  ]} />
)

export const SecuredLoansPage = () => (
  <ModuleDataPage module="gl" title="Secured Loans" fields={[
    { name: 'accountId', label: 'GL Account', type: 'select', lookup: 'accounts', required: true },
    { name: 'loanDate', label: 'Date of Loan Taken', type: 'date', required: true },
    { name: 'rateOfInterest', label: 'Rate of Interest', type: 'number', required: true },
    { name: 'effectiveDate', label: 'Effective Date for Interest', type: 'date', required: true },
  ]} />
)

export const UnsecuredLoansPage = () => (
  <ModuleDataPage module="gl" title="Unsecured Loans" fields={[
    { name: 'accountId', label: 'GL Account', type: 'select', lookup: 'accounts', required: true },
    { name: 'loanDate', label: 'Date of Loan Taken', type: 'date', required: true },
    { name: 'rateOfInterest', label: 'Rate of Interest', type: 'number', required: true },
    { name: 'effectiveDate', label: 'Effective Date for Interest', type: 'date', required: true },
  ]} />
)

export const SundryCreditorsPage = () => (
  <ModuleDataPage module="gl" title="Sundry Creditors" fields={[
    { name: 'accountId', label: 'GL Account', type: 'select', lookup: 'accounts', required: true },
    { name: 'maintainBillWise', label: 'Maintain Bill Wise', type: 'select', options: ['Yes', 'No'], required: true },
    {
      name: 'defaultCreditDays',
      label: 'Default Credit Days',
      type: 'number',
      required: true,
      visibleWhen: [{ field: 'maintainBillWise', values: ['Yes'] }],
    },
    {
      name: 'checkCreditDays',
      label: 'Check Credit Days',
      type: 'select',
      options: ['Yes', 'No'],
      required: true,
      visibleWhen: [{ field: 'maintainBillWise', values: ['Yes'] }],
    },
  ]} />
)

export const SundryDebtorsPage = () => (
  <ModuleDataPage module="gl" title="Sundry Debtors" fields={[
    { name: 'accountId', label: 'GL Account', type: 'select', lookup: 'accounts', required: true },
    { name: 'maintainBillWise', label: 'Maintain Bill Wise', type: 'select', options: ['Yes', 'No'], required: true },
    {
      name: 'defaultCreditDays',
      label: 'Default Credit Days',
      type: 'number',
      required: true,
      visibleWhen: [{ field: 'maintainBillWise', values: ['Yes'] }],
    },
    {
      name: 'checkCreditDays',
      label: 'Check Credit Days',
      type: 'select',
      options: ['Yes', 'No'],
      required: true,
      visibleWhen: [{ field: 'maintainBillWise', values: ['Yes'] }],
    },
  ]} />
)