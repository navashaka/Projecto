import type { GLFieldDefinition, GLResourceDefinition } from '../types'

const text = (
  name: string,
  label: string,
  required = false,
): GLFieldDefinition => ({
  name,
  label,
  kind: 'text',
  required,
})

const textarea = (
  name: string,
  label: string,
): GLFieldDefinition => ({
  name,
  label,
  kind: 'textarea',
})

const number = (
  name: string,
  label: string,
  options: Pick<GLFieldDefinition, 'required' | 'step'> = {},
): GLFieldDefinition => ({
  name,
  label,
  kind: 'number',
  step: 0.01,
  ...options,
})

const date = (
  name: string,
  label: string,
  required = false,
): GLFieldDefinition => ({
  name,
  label,
  kind: 'date',
  required,
})

const boolean = (
  name: string,
  label: string,
): GLFieldDefinition => ({
  name,
  label,
  kind: 'boolean',
})

const select = (
  name: string,
  label: string,
  optionEndpoint: string,
  optionLabelFields: string[],
  required = false,
): GLFieldDefinition => ({
  name,
  label,
  kind: 'select',
  optionEndpoint,
  optionLabelFields,
  required,
})

const glPrefix = '/gl'

export const glResources: GLResourceDefinition[] = [
  {
    key: 'groups',
    label: 'GL Groups',
    endpoint: `${glPrefix}-groups/`,
    fields: [
      text('name', 'Name', true),
      select('parent_group_id', 'Parent group', `${glPrefix}-groups/`, ['name']),
      boolean('is_default', 'Default'),
      boolean('tax_applicable', 'Tax applicable'),
      boolean('costing_applicable', 'Costing applicable'),
    ],
    columns: [
      { field: 'name', label: 'Name' },
      { field: 'parent_group_id', label: 'Parent group' },
      { field: 'tax_applicable', label: 'Tax applicable' },
      { field: 'costing_applicable', label: 'Costing applicable' },
    ],
  },
  {
    key: 'accounts',
    label: 'GL Accounts',
    endpoint: `${glPrefix}-accounts/`,
    fields: [
      text('name', 'Name', true),
      select('group_id', 'Group', `${glPrefix}-groups/`, ['name'], true),
      boolean('tax_applicable', 'Tax applicable'),
      select('tax_type_id', 'Tax type', `${glPrefix}-tax-types/`, ['name']),
      boolean('costing_applicable', 'Costing applicable'),
      text('hsn_sac_type', 'HSN/SAC type'),
      select('hsn_id', 'HSN', `${glPrefix}-hsn-masters/`, ['hsn_code']),
      select('sac_id', 'SAC', `${glPrefix}-sac-masters/`, ['sac_code']),
      number('igst_rate', 'IGST rate'),
      number('cgst_rate', 'CGST rate'),
      number('sgst_rate', 'SGST rate'),
      boolean('depreciation_applicable', 'Depreciation applicable'),
      date('loan_taken_date', 'Loan taken date'),
      number('interest_rate', 'Interest rate'),
      date('interest_effective_date', 'Interest effective date'),
      boolean('maintain_bill_wise', 'Maintain bill wise'),
      number('default_credit_days', 'Default credit days', { step: 1 }),
      boolean('check_credit_days_on_voucher', 'Check credit days on voucher'),
    ],
    columns: [
      { field: 'name', label: 'Name' },
      { field: 'group_id', label: 'Group' },
      { field: 'tax_applicable', label: 'Tax applicable' },
      { field: 'tax_type_id', label: 'Tax type' },
      { field: 'is_active', label: 'Active' },
    ],
  },
  {
    key: 'bank-accounts',
    label: 'GL Bank Accounts',
    endpoint: `${glPrefix}-bank-accounts/`,
    fields: [
      text('account_holder_name', 'Account holder name', true),
      text('account_number', 'Account number', true),
      text('bank_name', 'Bank name', true),
      text('branch', 'Branch'),
      text('ifsc_code', 'IFSC code'),
      text('swift_code', 'SWIFT code'),
      boolean('enable_cheque_issue', 'Enable cheque issue'),
      date('reconciliation_start_date', 'Reconciliation start date'),
      boolean('enable_e_payments', 'Enable e-payments'),
    ],
    columns: [
      { field: 'account_holder_name', label: 'Account holder' },
      { field: 'account_number', label: 'Account number' },
      { field: 'bank_name', label: 'Bank' },
      { field: 'branch', label: 'Branch' },
      { field: 'enable_cheque_issue', label: 'Cheque issue' },
    ],
  },
  {
    key: 'cheque-ranges',
    label: 'GL Cheque Ranges',
    endpoint: `${glPrefix}-cheque-ranges/`,
    fields: [
      select(
        'bank_account_id',
        'Bank account',
        `${glPrefix}-bank-accounts/`,
        ['account_holder_name', 'bank_name', 'account_number'],
        true,
      ),
      text('from_number', 'From number', true),
      text('to_number', 'To number', true),
      text('cheque_image', 'Cheque image'),
      text('default_company_name', 'Default company name'),
    ],
    columns: [
      { field: 'bank_account_id', label: 'Bank account' },
      { field: 'from_number', label: 'From number' },
      { field: 'to_number', label: 'To number' },
      { field: 'default_company_name', label: 'Company' },
    ],
  },
  {
    key: 'hsn-masters',
    label: 'GL HSN Master',
    endpoint: `${glPrefix}-hsn-masters/`,
    fields: [
      text('chapter', 'Chapter'),
      text('heading', 'Heading'),
      text('sub_heading', 'Sub-heading'),
      text('hsn_code', 'HSN code', true),
      textarea('description', 'Description'),
      number('cgst_rate', 'CGST rate'),
      number('sgst_utgst_rate', 'SGST/UTGST rate'),
      number('igst_rate', 'IGST rate'),
      number('compensation_cess', 'Compensation cess'),
      date('effective_date', 'Effective date'),
    ],
    columns: [
      { field: 'hsn_code', label: 'HSN code' },
      { field: 'description', label: 'Description' },
      { field: 'cgst_rate', label: 'CGST rate' },
      { field: 'igst_rate', label: 'IGST rate' },
      { field: 'is_active', label: 'Active' },
    ],
  },
  {
    key: 'sac-masters',
    label: 'GL SAC Master',
    endpoint: `${glPrefix}-sac-masters/`,
    fields: [
      text('chapter', 'Chapter'),
      text('heading', 'Heading'),
      text('sac_code', 'SAC code', true),
      textarea('description', 'Description'),
      number('cgst_rate', 'CGST rate'),
      number('sgst_utgst_rate', 'SGST/UTGST rate'),
      number('igst_rate', 'IGST rate'),
      number('compensation_cess', 'Compensation cess'),
      date('effective_date', 'Effective date'),
    ],
    columns: [
      { field: 'sac_code', label: 'SAC code' },
      { field: 'description', label: 'Description' },
      { field: 'cgst_rate', label: 'CGST rate' },
      { field: 'igst_rate', label: 'IGST rate' },
      { field: 'is_active', label: 'Active' },
    ],
  },
  {
    key: 'tax-types',
    label: 'GL Tax Types',
    endpoint: `${glPrefix}-tax-types/`,
    fields: [
      text('name', 'Name', true),
      number('rate', 'Rate', { required: true }),
      date('effective_date', 'Effective date', true),
      select('gl_account_id', 'GL account', `${glPrefix}-accounts/`, ['name']),
    ],
    columns: [
      { field: 'name', label: 'Name' },
      { field: 'rate', label: 'Rate' },
      { field: 'effective_date', label: 'Effective date' },
      { field: 'gl_account_id', label: 'GL account' },
      { field: 'is_active', label: 'Active' },
    ],
  },
  {
    key: 'od-limits',
    label: 'GL OD Limits',
    endpoint: `${glPrefix}-od-limits/`,
    fields: [
      select(
        'bank_account_id',
        'Bank account',
        `${glPrefix}-bank-accounts/`,
        ['account_holder_name', 'bank_name', 'account_number'],
        true,
      ),
      number('od_limit', 'OD limit'),
      number('rate_of_interest', 'Rate of interest'),
      date('effective_date', 'Effective date'),
    ],
    columns: [
      { field: 'bank_account_id', label: 'Bank account' },
      { field: 'od_limit', label: 'OD limit' },
      { field: 'rate_of_interest', label: 'Rate of interest' },
      { field: 'effective_date', label: 'Effective date' },
    ],
  },
]

export const glResourceMap = Object.fromEntries(
  glResources.map((resource) => [resource.key, resource]),
)
