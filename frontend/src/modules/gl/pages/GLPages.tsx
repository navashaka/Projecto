import ModuleDataPage from '../../shared/ModuleDataPage'

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

export const GLAccountPage = () => (
  <ModuleDataPage module="gl" title="GL Account" fields={[
    { name: 'glAccountName', label: 'Name of GL Account', required: true },
    { name: 'group', label: 'Select Group', type: 'select', lookup: 'groups', required: true },
    { name: 'glAccountCode', label: 'GL Account Code (Auto generated)' },
    { name: 'taxApplicable', label: 'Tax applicable?', type: 'select', options: ['Yes', 'No'], required: true },
    { name: 'taxType', label: 'Select Tax Type', type: 'select', lookup: 'tax-types' },
    { name: 'costingApplicable', label: 'Costing applicable?', type: 'select', options: ['Yes', 'No'], required: true },
  ]} />
)

export const HSNPage = () => (
  <ModuleDataPage module="gl" title="Create HSN" fields={[
    { name: 'chapter', label: 'Chapter', required: true },
    { name: 'heading', label: 'Heading', required: true },
    { name: 'subHeading', label: 'Sub-Heading', required: true },
    { name: 'hsnCode', label: 'HSN_CD / Tariff Item', required: true },
    { name: 'hsnDescription', label: 'HSN_Description', required: true },
    { name: 'cgstRate', label: 'CGST Rate (%)', type: 'number', required: true },
    { name: 'sgstRate', label: 'SGST / UTGST Rate (%)', type: 'number', required: true },
    { name: 'igstRate', label: 'IGST Rate (%)', type: 'number', required: true },
    { name: 'compensationCess', label: 'Compensation Cess', type: 'number' },
    { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
  ]} />
)

export const SACPage = () => (
  <ModuleDataPage module="gl" title="Create SAC" fields={[
    { name: 'chapter', label: 'Chapter', required: true },
    { name: 'heading', label: 'Heading', required: true },
    { name: 'sacCode', label: 'SAC_CD', required: true },
    { name: 'sacDescription', label: 'SAC_Description', required: true },
    { name: 'cgstRate', label: 'CGST Rate (%)', type: 'number', required: true },
    { name: 'sgstRate', label: 'SGST / UTGST Rate (%)', type: 'number', required: true },
    { name: 'igstRate', label: 'IGST Rate (%)', type: 'number', required: true },
    { name: 'compensationCess', label: 'Compensation Cess', type: 'number' },
    { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
  ]} />
)

export const TaxApplicabilityPage = () => (
  <ModuleDataPage module="gl" title="Tax Applicability" fields={[
    { name: 'accountId', label: 'GL Account', type: 'select', lookup: 'accounts', required: true },
    { name: 'taxType', label: 'Select Tax Type', type: 'select', lookup: 'tax-types', required: true },
    { name: 'hsnSacApplicable', label: 'Select from HSN/SAC', type: 'select', options: ['Applicable', 'Not Applicable'], required: true },
    { name: 'taxTypeSelection', label: 'Select from Tax Type', type: 'select', options: ['HSN', 'SAC'] },
    { name: 'hsnSacType', label: 'HSN / SAC', type: 'select', options: ['Goods - HSN', 'Services - SAC', 'Not Applicable'] },
    { name: 'hsnCode', label: 'HSN Code', type: 'select', lookup: 'hsn-masters' },
    { name: 'sacCode', label: 'SAC Code', type: 'select', lookup: 'sac-masters' },
    { name: 'igstRate', label: 'IGST', type: 'number' },
    { name: 'cgstRate', label: 'CGST', type: 'number' },
    { name: 'sgstRate', label: 'SGST', type: 'number' },
  ]} />
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
    { name: 'defaultCreditDays', label: 'Default Credit Days', type: 'number', required: true },
    { name: 'checkCreditDays', label: 'Check Credit Days', type: 'select', options: ['Yes', 'No'], required: true },
  ]} />
)

export const SundryDebtorsPage = () => (
  <ModuleDataPage module="gl" title="Sundry Debtors" fields={[
    { name: 'accountId', label: 'GL Account', type: 'select', lookup: 'accounts', required: true },
    { name: 'maintainBillWise', label: 'Maintain Bill Wise', type: 'select', options: ['Yes', 'No'], required: true },
    { name: 'defaultCreditDays', label: 'Default Credit Days', type: 'number', required: true },
    { name: 'checkCreditDays', label: 'Check Credit Days', type: 'select', options: ['Yes', 'No'], required: true },
  ]} />
)