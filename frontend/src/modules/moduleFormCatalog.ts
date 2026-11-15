import type { ModuleId } from './types'

export const moduleTemplateFiles: Record<ModuleId, string> = {
  hr: '/templates/hr-module-template.xlsx',
  gl: '/templates/gl-module-template.xlsx',
  ar: '/templates/ar-module-template.xlsx',
  inventory: '/templates/inventory-module-template.xlsx',
  purchase: '/templates/purchase-module-template.xlsx',
  bank: '/templates/bank-module-template.xlsx',
  profile: '/templates/profile-module-template.xlsx',
  production: '/templates/production-module-template.xlsx'
}

export const moduleFormTitles: Record<ModuleId, Record<string, string>> = {
  hr: {
    'candidate-enquiry': 'Candidate Enquiry',
    'bank-enquiry': 'Bank Enquiry',
    attendance: 'Attendance',
    employees: 'Employees',
    'company-holidays': 'Company Holidays',
    salary: 'Salary',
    designations: 'Designations',
    payroll: 'Payroll',
    leave: 'Leave',
    'on-employment': 'On Employment',
    'travelling-advance': 'Travelling Advance'
  },
  gl: {
    'tax-type': 'Tax Type',
    group: 'Group',
    'gl-account': 'GL Account',
    'hsn': 'Create HSN',
    sac: 'Create SAC',
    'bank-account': 'Bank Accounts',
    'bank-occ-account': 'Bank OCC Account / OD Account / CC Account',
    'cheque-range': 'Cheque Range',
    'od-limit': 'OD Limit',
    'tax-applicability': 'Tax Applicability',
    'fixed-assets': 'Fixed Assets',
    'secured-loans': 'Secured Loans',
    'unsecured-loans': 'Unsecured Loans',
    'sundry-creditors': 'Sundry Creditors',
    'sundry-debtors': 'Sundry Debtors',
    'contra-entry': 'Contra Entry',
    journal: 'Journal',
    'credit-note': 'Credit Note',
    'debit-note': 'Debit Note'
  },
  ar: {
    customer: 'Customer',
    invoice: 'Invoice',
    'proforma-invoice': 'Proforma Invoice',
    quotation: 'Quotation',
    'tax-invoice': 'Tax Invoice'
  },
  inventory: {
    'unit-of-measurement': 'Unit of Measurement',
    'gate-entry': 'Gate Entry',
    'stock-group': 'Stock Group',
    'stock-item': 'Stock Item',
    indent: 'Indent',
    'material-receipt-note': 'Material Receipt Note',
    'delivery-challan-inward': 'Delivery Challan (Inward)',
    'delivery-challan-outward': 'Delivery Challan (Outward)',
    'goods-issue-for-consumption': 'Goods Issue (For Consumption)',
    'goods-issue-for-sale': 'Goods Issue (For Sale)'
  },
  purchase: {
    vendor: 'Vendor',
    'advance-requisition': 'Advance Requisition',
    'quotation-comparison': 'Quotation Comparison',
    'purchase-order': 'Purchase Order'
  },
  bank: {
    'bank-passbook': 'Bank Passbook / Statement',
    'bank-receipt': 'Receipt',
    'bank-payment': 'Payment',
    'bank-book': 'Bank Book',
    'bank-reconciliation': 'Reconciliation'
  },
  profile: {
    profile: 'Profile'
  },
  production: {
    'production-output-product': 'Output Product',
    'production-entry': 'Production Entry'
  }
}

export const getModuleFormTitle = (module: ModuleId, page: string) =>
  moduleFormTitles[module][page]
