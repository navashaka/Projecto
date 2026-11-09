import ModuleDataPage from '../../shared/ModuleDataPage'

export const BankPassbookPage = () => (
	<ModuleDataPage module="bank" title="Bank Passbook / Statement" fields={[
		{ name: 'bankPassbook', label: 'Select Bank', section: 'Bank Selection' },
		{ name: 'date', label: 'Date', type: 'date' },
		{ name: 'transactionDate', label: 'Transaction Date', type: 'date' },
		{ name: 'referenceNumber', label: 'Ref No. / Chq No.' },
		{ name: 'description', label: 'Description' },
		{ name: 'debitAmount', label: 'Debit Rs.', type: 'number' },
		{ name: 'creditAmount', label: 'Credit Rs.', type: 'number' },
		{ name: 'balance', label: 'Balance Rs.', type: 'number' },
		{ name: 'reconciled', label: 'Reconciled' },
	]} />
)

export const BankReceiptPage = () => (
	<ModuleDataPage module="bank" title="Receipt" fields={[
		{ name: 'bankPassbookId', label: 'Bank to be taken from above selection' },
		{ name: 'receiptVoucherDate', label: 'Receipt Voucher Date', type: 'date' },
		{ name: 'bankDate', label: 'Bank Date', type: 'date' },
		{ name: 'payerGLAccount', label: 'Payer / GL Account', section: 'Receipt Items' },
		{ name: 'billReference', label: 'Select Bills / Give New Reference' },
		{ name: 'creditAmount', label: 'Credit Rs.', type: 'number' },
		{ name: 'totalBankAmount', label: 'Total Bank', type: 'number' },
		{ name: 'totalDebitAmount', label: 'Debit Rs.', type: 'number' },
		{ name: 'description', label: 'Description' },
	]} />
)

export const BankPaymentPage = () => (
	<ModuleDataPage module="bank" title="Payment" fields={[
		{ name: 'bankPassbookId', label: 'Bank to be taken from above selection' },
		{ name: 'paymentVoucherDate', label: 'Payment Voucher Date', type: 'date' },
		{ name: 'bankDate', label: 'Bank Date', type: 'date' },
		{ name: 'recipientGLAccount', label: 'Recipient / GL Account', section: 'Payment Items' },
		{ name: 'billReference', label: 'Select Bills / Give New Reference' },
		{ name: 'debitAmount', label: 'Debit Rs.', type: 'number' },
		{ name: 'totalBankAmount', label: 'Total Bank', type: 'number' },
		{ name: 'totalCreditAmount', label: 'Credit Rs.', type: 'number' },
		{ name: 'description', label: 'Description' },
	]} />
)

export const BankBookPage = () => (
	<ModuleDataPage module="bank" title="Bank Book" fields={[
		{ name: 'bankPassbookId', label: 'Bank from database' },
		{ name: 'voucherDate', label: 'Voucher Date', type: 'date' },
		{ name: 'voucherNumber', label: 'Voucher Number' },
		{ name: 'glAccount', label: 'GL Account' },
		{ name: 'description', label: 'Description' },
		{ name: 'debitAmount', label: 'Debit Rs.', type: 'number' },
		{ name: 'creditAmount', label: 'Credit Rs.', type: 'number' },
		{ name: 'balance', label: 'Balance Rs.', type: 'number' },
		{ name: 'reconciled', label: 'Reconciled' },
	]} />
)

export const BankReconciliationPage = () => (
	<ModuleDataPage module="bank" title="Reconciliation" fields={[
		{ name: 'bankPassbookId', label: 'Bank from database' },
		{ name: 'closingBalanceBankBook', label: 'Closing Balance as per Bank Book', type: 'number' },
		{ name: 'unreconciledFromBank', label: 'Unreconciled Transactions from Bank' },
		{ name: 'unreconciledFromBankBook', label: 'Unreconciled Transactions from Bank Book' },
		{ name: 'closingBalanceBank', label: 'Closing Balance as per Bank', type: 'number' },
	]} />
)