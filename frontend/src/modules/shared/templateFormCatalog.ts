import type { ModuleId } from '../types'

export type TemplateForm = {
  id: string
  title: string
  headers: string[]
  targetModule?: 'gl'
  targetResource?: string
}

export const templateModuleNames: Record<ModuleId, string> = {
  hr: 'Human Resources',
  gl: 'General Ledger',
  ar: 'Accounts Receivable',
  inventory: 'Inventory',
  purchase: 'Purchase',
  bank: 'Bank',
  production: 'Production',
  profile: 'Profile'
}

export const templateForms: Record<ModuleId, TemplateForm[]> = {
  hr: [
    { id: 'candidate-enquiry', title: 'Candidate Enquiry', headers: ['candidateName', 'fatherName', 'dob', 'bloodGroup', 'maritalStatus', 'religion', 'nationality', 'motherTongue', 'otherLanguages', 'phone', 'email', 'aadhaarNumber', 'panNumber', 'passportNumber', 'emergencyContact1', 'emergencyContact2', 'streetNumber', 'streetName', 'city', 'state', 'country', 'zipCode', 'highestQualification', 'yearOfPassing', 'attachDocuments', 'employmentType', 'currentEmployer', 'designation', 'department', 'currentWorkingFrom', 'currentCTC', 'currentTakeHome', 'employerDocuments', 'currentResponsibilities', 'previousEmployer', 'previousDesignation', 'previousDepartment', 'previousWorkingFrom', 'previousRelievedOn', 'previousCTC', 'previousTakeHome', 'previousEmployerDocuments', 'previousResponsibilities'] },
    { id: 'bank-enquiry', title: 'Bank Enquiry', headers: ['accountName', 'accountNumber', 'bank', 'branch', 'ifsc', 'salaryOfferedCtc', 'yearlyIncrement', 'incrementYear', 'basic', 'allowance1', 'allowance2', 'allowance3', 'allowance4', 'allowance5', 'allowance6', 'additionalAllowanceName', 'additionalAllowance', 'arrears', 'gross', 'epf', 'esiInsurance', 'tds', 'canteenDeductions', 'advance', 'loanEmi', 'otherDeductionName', 'otherDeduction', 'totalDeductions', 'netSalary', 'employerEpfShare', 'employerEsiShare', 'employerInsurance', 'transportAllowance', 'canteenAllowance', 'bonus', 'otherContributionName', 'otherContribution', 'totalCtc'] },
    { id: 'attendance', title: 'Attendance', headers: ['employeeCode', 'employeeName', 'attendanceDate', 'checkIn', 'checkOut', 'status', 'remarks'] },
    { id: 'employees', title: 'Employees', headers: ['employeeId', 'name', 'dateOfBirth', 'bloodGroup', 'maritalStatus', 'phone', 'personalEmail', 'pan', 'aadhaar', 'passportNumber', 'emergencyContact', 'nationality', 'highestQualification', 'yearOfPass', 'department', 'designation', 'streetNumber', 'streetName', 'city', 'state', 'country', 'zipCode'] },
    { id: 'company-holidays', title: 'Company Holidays', headers: ['holidayName', 'holidayDate', 'location', 'holidayType', 'description'] },
    { id: 'salary', title: 'Salary', headers: ['employeeCode', 'employeeName', 'month', 'salaryOfferedCtc', 'yearlyIncrement', 'basic', 'allowance1', 'allowance2', 'allowance3', 'allowance4', 'allowance5', 'allowance6', 'arrears', 'gross', 'epf', 'esiInsurance', 'tds', 'canteenDeductions', 'advance', 'loanEmi', 'totalDeductions', 'netSalary', 'employerEpf', 'employerEsi', 'employerInsurance', 'transportAllowance', 'canteenAllowance', 'bonus', 'totalCtc'] },
    { id: 'designations', title: 'Designations', headers: ['designationCode', 'designation', 'department', 'reportingHead', 'responsibilities', 'description'] },
    { id: 'payroll', title: 'Payroll', headers: ['employeeCode', 'employeeName', 'payPeriod', 'basic', 'allowance1', 'allowance2', 'allowance3', 'allowance4', 'allowance5', 'allowance6', 'arrears', 'grossPay', 'epf', 'esiInsurance', 'tds', 'canteenDeduction', 'advanceDeduction', 'loanEmi', 'totalDeductions', 'netPay'] },
    { id: 'leave', title: 'Leave', headers: ['employeeCode', 'employeeName', 'leaveType', 'startDate', 'endDate', 'status', 'reason'] },
    { id: 'on-employment', title: 'On Employment', headers: ['employeeCode', 'designation', 'department', 'reportingHead', 'departmentHead', 'epfUan', 'esi', 'healthInsurance', 'healthInsuranceDate', 'workEmail'] },
    { id: 'travelling-advance', title: 'Travelling Advance', headers: ['employee_code', 'employee_name', 'designation', 'department', 'from_date', 'to_date', 'place_to_be_visited', 'purpose_of_visit', 'budget_items', 'other_expense_type', 'other_expense_amount'] }
  ],
  gl: [
    { id: 'tax-type', title: 'Tax Type', headers: ['taxTypeName', 'taxRate', 'effectiveDate', 'glAccount'] },
    { id: 'group', title: 'Group', headers: ['groupName', 'parentGroup', 'groupCode'] },
    { id: 'gl-account', title: 'GL Account', headers: ['glAccountName', 'costApplicable', 'group', 'taxApplicable', 'taxType', 'costingApplicable', 'depreciationApplicable', 'loanDate', 'rateOfInterest', 'effectiveDate', 'maintainBillWise', 'defaultCreditDays', 'checkCreditDays'] },
    { id: 'hsn', title: 'Create HSN', headers: ['chapter', 'heading', 'subHeading', 'hsnCode', 'hsnDescription', 'cgstRate', 'sgstRate', 'igstRate', 'compensationCess', 'effectiveDate'] },
    { id: 'sac', title: 'Create SAC', headers: ['chapter', 'heading', 'sacCode', 'sacDescription', 'cgstRate', 'sgstRate', 'igstRate', 'compensationCess', 'effectiveDate'] },
    { id: 'tax-applicability', title: 'Tax Applicability', headers: ['accountId', 'taxType', 'hsnSacApplicable', 'taxTypeSelection', 'hsnSacType', 'hsnCode', 'sacCode', 'igstRate', 'cgstRate', 'sgstRate'] },
    { id: 'bank-account', title: 'Bank Accounts', headers: ['accountHolderName', 'accountNumber', 'bankName', 'branch', 'ifscCode', 'swiftCode', 'enableChequeIssue', 'reconciliationStartDate', 'enableEpayments'] },
    { id: 'bank-occ-account', title: 'Bank OCC Account / OD Account / CC Account', headers: ['odLimitEnabled', 'accountHolderName', 'accountNumber', 'bankName', 'branch', 'ifscCode', 'swiftCode', 'enableChequeIssue', 'reconciliationStartDate', 'enableEpayments'] },
    { id: 'cheque-range', title: 'Cheque Range', headers: ['chequeImage', 'accountNumber', 'fromNumber', 'toNumber'] },
    { id: 'od-limit', title: 'OD Limit', headers: ['accountNumber', 'odLimit', 'rateOfInterest', 'effectiveDate'] },
    { id: 'fixed-assets', title: 'Fixed Assets', headers: ['accountId', 'depreciationApplicable'] },
    { id: 'secured-loans', title: 'Secured Loans', headers: ['accountId', 'loanDate', 'rateOfInterest', 'effectiveDate'] },
    { id: 'unsecured-loans', title: 'Unsecured Loans', headers: ['accountId', 'loanDate', 'rateOfInterest', 'effectiveDate'] },
    { id: 'sundry-creditors', title: 'Sundry Creditors', headers: ['accountId', 'maintainBillWise', 'defaultCreditDays', 'checkCreditDays'] },
    { id: 'sundry-debtors', title: 'Sundry Debtors', headers: ['accountId', 'maintainBillWise', 'defaultCreditDays', 'checkCreditDays'] },
    { id: 'contra-entry', title: 'Contra Entry', headers: ['bankCashAccount1', 'bankCashAccount2', 'debitAmount', 'creditAmount'] },
    { id: 'journal', title: 'Journal', headers: ['date', 'items'] },
    { id: 'credit-note', title: 'Credit Note', headers: ['creditNoteNumber', 'date', 'partyName', 'inventoryRelated', 'items', 'accounts'] },
    { id: 'debit-note', title: 'Debit Note', headers: ['debitNoteNumber', 'date', 'partyName', 'inventoryRelated', 'items', 'accounts'] }
  ],
  ar: [
    { id: 'customer', title: 'Customer', headers: ['customerName', 'email', 'phone', 'billToAddress', 'billToStreetNumber', 'billToStreetName', 'billToCity', 'billToState', 'billToCountry', 'billToPin', 'region', 'billToPan', 'billToGstin', 'shipToAddress', 'shipToStreetNumber', 'shipToStreetName', 'shipToCity', 'shipToState', 'shipToCountry', 'shipToPin', 'shipToRegion', 'contactPerson', 'contactPhone', 'contactEmail', 'shipToPan', 'shipToGstin', 'bankAccountDetails', 'bankName', 'accountNumber', 'ifscCode', 'branch', 'MSMEDetails', 'msmestatus', 'msmeNumber', 'Activity'] },
    { id: 'invoice', title: 'Invoice', headers: ['invoiceNumber', 'invoiceDate', 'invoiceType', 'dispatchType', 'proformaInvoiceNumber', 'quotationNumber', 'orderby', 'ASM', 'orderApprovedBy', 'dueDate', 'amountDue', 'consignee', 'consigneeStreetNumber', 'consigneeStreetName', 'consigneeCity', 'consigneeState', 'consigneeCountry', 'consigneePin', 'consigneeRegion', 'consigneePan', 'consigneeGstin', 'buyer', 'buyerStreetNumber', 'buyerStreetName', 'buyerCity', 'buyerState', 'buyerCountry', 'buyerPin', 'buyerRegion', 'buyerPan', 'buyerGstin', 'serialNumber', 'item', 'description', 'quantity', 'rate', 'gstrate', 'hsn', 'uom', 'amount', 'ewayBillNumber', 'einvoiceNumber', 'serviceInvoice', 'exportInvoice'] },
    { id: 'proforma-invoice', title: 'Proforma Invoice', headers: ['proformaNumber', 'issueDate', 'validUntil', 'invoiceType', 'ocNumber', 'quotationNumber', 'orderBy', 'asm', 'orderApprovedBy', 'dueDate', 'consignee', 'consigneeStreetNumber', 'consigneeStreetName', 'consigneeCity', 'consigneeState', 'consigneeCountry', 'consigneePin', 'consigneeRegion', 'consigneePan', 'consigneeGstin', 'buyer', 'buyerStreetNumber', 'buyerStreetName', 'buyerCity', 'buyerState', 'buyerCountry', 'buyerPin', 'buyerRegion', 'buyerPan', 'buyerGstin', 'serialNumber', 'item', 'description', 'quantity', 'rate', 'gstrate', 'hsn', 'uom', 'amount'] },
    { id: 'quotation', title: 'Quotation', headers: ['quotationNumber', 'quotationDate', 'customer', 'streetNumber', 'streetName', 'city', 'state', 'country', 'pin', 'region', 'itemcount', 'item', 'quantity', 'rate', 'amount', 'gst', 'totalAmount', 'termsofdelivery', 'paymentterms', 'createdBy', 'checkedBy', 'approvedBy'] },
    { id: 'tax-invoice', title: 'Tax Invoice', headers: ['invoiceNumber', 'customer', 'invoiceDate', 'invoiceType', 'serialNumber', 'item', 'description', 'quantity', 'rate', 'amount', 'taxAmount', 'totalDue'] }
  ],
  inventory: [
    { id: 'unit-of-measurement', title: 'Unit of Measurement', headers: ['symbol', 'formalName', 'numberOfDecimals'] },
    { id: 'gate-entry', title: 'Gate Entry', headers: ['gateNumber', 'vehicleNumber', 'transporterName', 'entryTime', 'date', 'vendorName', 'vendorInvoiceDate', 'vendorInvoiceNumber', 'streetNumber', 'streetName', 'city', 'state', 'country', 'zipCode', 'item', 'quantity', 'rate', 'totalAmount', 'creation', 'createdBy', 'approvedBy'] },
    { id: 'stock-group', title: 'Stock Group', headers: ['nameOfGroup', 'underGroup'] },
    { id: 'stock-item', title: 'Stock Item', headers: ['nameOfItem', 'unitOfMeasurement', 'underGroup', 'reorderLevel'] },
    { id: 'indent', title: 'Indent', headers: ['indentNumber', 'department', 'item', 'quantity', 'indentDate', 'itemCount', 'estimatedTotal', 'createdBy', 'approvedBy'] },
    { id: 'material-receipt-note', title: 'Material Receipt Note', headers: ['gateEntryNumber', 'entryDate', 'entryTime', 'receiptNumber', 'receiptDate', 'vendorName', 'vendorInvoiceNumber', 'vendorInvoiceDate', 'streetNumber', 'streetName', 'city', 'state', 'country', 'zipCode', 'ewayBillNumber', 'ewayBillDate', 'transporterName', 'vehicleNumber', 'item', 'quantity', 'rate', 'amount', 'totalAmount', 'createdBy', 'checkedBy', 'approvedBy'] },
    { id: 'delivery-challan-inward', title: 'Delivery Challan (Inward)', headers: ['challanNumber', 'challanDate', 'purpose', 'streetNumber', 'streetName', 'city', 'state', 'country', 'zipCode', 'workOrder', 'date', 'itemCount', 'item', 'quantity', 'rate', 'amount', 'gst', 'totalAmount', 'TransporterName', 'vehicleNumber', 'ewayBill', 'ewayBillNumber', 'ewayBillDate', 'createdBy', 'checkedBy', 'approvedBy'] },
    { id: 'delivery-challan-outward', title: 'Delivery Challan (Outward)', headers: ['challanNumber', 'challanDate', 'purpose', 'itemCount', 'item', 'quantity', 'rate', 'amount', 'gst', 'totalAmount', 'TransporterName', 'vehicleNumber', 'ewayBill', 'ewayBillNumber', 'ewayBillDate', 'createdBy', 'checkedBy', 'approvedBy'] },
    { id: 'goods-issue-for-consumption', title: 'Goods Issue (For Consumption)', headers: ['issueNumber', 'indentId', 'department', 'issueDate', 'itemCount', 'item', 'quantity', 'rate', 'amount', 'gst', 'totalAmount'] },
    { id: 'goods-issue-for-sale', title: 'Goods Issue (For Sale)', headers: ['saleNumber', 'saleOrderDate', 'department', 'itemCount', 'item', 'quantity', 'costElementId', 'totalAmount', 'createdBy', 'checkedBy', 'approvedBy'] }
  ],
  purchase: [
    { id: 'vendor', title: 'Vendor', headers: ['vendorName', 'email', 'phone', 'streetNumber', 'streetName', 'city', 'state', 'country', 'zipcode', 'pan', 'gstin', 'bankDetails', 'bankName', 'accountNumber', 'ifscCode', 'msmeDetails', 'msmeStatus', 'msmeNumber', 'activity'] },
    { id: 'advance-requisition', title: 'Advance Requisition', headers: ['vendorname', 'streetNumber', 'streetName', 'city', 'state', 'country', 'zipcode', 'bankDetails', 'bankName', 'accountNumber', 'ifscCode', 'purchaseOrderNumber', 'purchaseOrderDate', 'PurchaseOrderValueBeforeGST', 'purchaseOrderValueAfterGST', 'advanceRequestedAmount', 'createdBy', 'checkedBy', 'approvedBy'] },
    { id: 'quotation-comparison', title: 'Quotation Comparison', headers: ['vendorname', 'streetNumber', 'streetName', 'city', 'state', 'country', 'zipcode', 'quotationNumber', 'quotationDate', 'item', 'description', 'quantity', 'uom', 'rate', 'amount', 'totalAmount', 'deliveryterms', 'paymentterms', 'additionalTerms&Conditions'] },
    { id: 'purchase-order', title: 'Purchase Order', headers: ['orderNumber', 'orderDate', 'indentNumber', 'indentDate', 'quotationNumber', 'quotationDate', 'vendorname', 'streetNumber', 'streetName', 'city', 'state', 'country', 'zipcode', 'bankDetails', 'bankName', 'accountNumber', 'ifscCode', 'item', 'description', 'quantity', 'uom', 'rate', 'amount', 'totalAmount', 'Deliveryterms', 'Paymentterms', 'defaultTerms&Conditions', 'additionalTerms&Conditions', 'createdBy', 'checkedBy', 'approvedBy'] }
  ],
  bank: [
    { id: 'bank-account', title: 'Bank Account', headers: ['accountHolderName', 'accountNumber', 'bankName', 'branch', 'ifscCode', 'swiftCode', 'enableChequeIssue', 'reconciliationStartDate', 'enableEpayments'], targetModule: 'gl', targetResource: 'bank-accounts' },
    { id: 'bank-occ-account', title: 'Bank OCC Account', headers: ['odLimitEnabled', 'accountHolderName', 'accountNumber', 'bankName', 'branch', 'ifscCode', 'swiftCode', 'enableChequeIssue', 'reconciliationStartDate', 'enableEpayments'], targetModule: 'gl', targetResource: 'bank-accounts' },
    { id: 'od-account', title: 'OD Account', headers: ['odLimitEnabled', 'accountHolderName', 'accountNumber', 'bankName', 'branch', 'ifscCode', 'swiftCode', 'enableChequeIssue', 'reconciliationStartDate', 'enableEpayments'], targetModule: 'gl', targetResource: 'bank-accounts' },
    { id: 'cc-account', title: 'CC Account', headers: ['odLimitEnabled', 'accountHolderName', 'accountNumber', 'bankName', 'branch', 'ifscCode', 'swiftCode', 'enableChequeIssue', 'reconciliationStartDate', 'enableEpayments'], targetModule: 'gl', targetResource: 'bank-accounts' },
    { id: 'cheque-range', title: 'Cheque Range', headers: ['chequeImage', 'accountNumber', 'fromNumber', 'toNumber'], targetModule: 'gl', targetResource: 'cheque-ranges' },
    { id: 'od-limit', title: 'OD Limit', headers: ['accountNumber', 'odLimit', 'rateOfInterest', 'effectiveDate'], targetModule: 'gl', targetResource: 'od-limits' },
    { id: 'bank-passbook', title: 'Bank Passbook / Statement', headers: ['bankPassbook', 'date', 'transactionDate', 'referenceNumber', 'description', 'debitAmount', 'creditAmount', 'balance', 'reconciled'] },
    { id: 'bank-receipt', title: 'Receipt', headers: ['bankPassbookId', 'receiptVoucherDate', 'bankDate', 'payerGLAccount', 'billReference', 'creditAmount', 'totalBankAmount', 'totalDebitAmount', 'description'] },
    { id: 'bank-payment', title: 'Payment', headers: ['bankPassbookId', 'paymentVoucherDate', 'bankDate', 'recipientGLAccount', 'billReference', 'debitAmount', 'totalBankAmount', 'totalCreditAmount', 'description'] },
    { id: 'bank-book', title: 'Bank Book', headers: ['bankPassbookId', 'voucherDate', 'voucherNumber', 'glAccount', 'description', 'debitAmount', 'creditAmount', 'balance', 'reconciled'] },
    { id: 'bank-reconciliation', title: 'Reconciliation', headers: ['bankPassbookId', 'closingBalanceBankBook', 'unreconciledFromBank', 'unreconciledFromBankBook', 'closingBalanceBank'] }
  ],
  production: [
    { id: 'production-output-product', title: 'Output Product', headers: ['outputProductName', 'uom', 'hsn', 'costElement', 'inputItem1', 'inputItem2', 'inputItem3'] },
    { id: 'production-entry', title: 'Production Entry', headers: ['productionProduct', 'productionDate', 'shiftA', 'shiftB', 'shiftC', 'totalQty', 'inputItemQtyConsumed'] }
  ],
  profile: [
    { id: 'profile', title: 'Profile', headers: ['nameOfOrganization', 'cinFirmRegistration', 'pan', 'gstRegistrationCorporateOffice', 'doorHouseFlatSurveyFloorNo', 'buildingName', 'landmark', 'streetNameRoadNo', 'areaColony', 'city', 'state', 'pinCode', 'country', 'typeOfAccount', 'glAccount', 'primaryBankAccountNo', 'primaryIfsc', 'secondaryBankAccountNo', 'secondaryIfsc', 'primaryCurrency', 'typeOfBusiness'] }
  ]
}
