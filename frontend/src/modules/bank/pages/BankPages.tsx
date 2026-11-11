import { ChevronDown } from 'lucide-react'
import type { ComponentType } from 'react'
import ModuleDataPage from '../../shared/ModuleDataPage'

type BankFormProps = {
	embedded?: boolean
}

export const BankPassbookPage = ({ embedded }: BankFormProps) => (
	<ModuleDataPage module="bank" title="Bank Passbook / Statement" embedded={embedded} fields={[
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

export const BankReceiptPage = ({ embedded }: BankFormProps) => (
	<ModuleDataPage module="bank" title="Receipt" embedded={embedded} fields={[
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

export const BankPaymentPage = ({ embedded }: BankFormProps) => (
	<ModuleDataPage module="bank" title="Payment" embedded={embedded} fields={[
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

export const BankBookPage = ({ embedded }: BankFormProps) => (
	<ModuleDataPage module="bank" title="Bank Book" embedded={embedded} fields={[
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

export const BankReconciliationPage = ({ embedded }: BankFormProps) => (
	<ModuleDataPage module="bank" title="Reconciliation" embedded={embedded} fields={[
		{ name: 'bankPassbookId', label: 'Bank from database' },
		{ name: 'closingBalanceBankBook', label: 'Closing Balance as per Bank Book', type: 'number' },
		{ name: 'unreconciledFromBank', label: 'Unreconciled Transactions from Bank' },
		{ name: 'unreconciledFromBankBook', label: 'Unreconciled Transactions from Bank Book' },
		{ name: 'closingBalanceBank', label: 'Closing Balance as per Bank', type: 'number' },
	]} />
)

const bankForms: {
	id: string
	title: string
	Page: ComponentType<BankFormProps>
}[] = [
	{ id: 'bank-passbook', title: 'Bank Passbook / Statement', Page: BankPassbookPage },
	{ id: 'bank-receipt', title: 'Receipt', Page: BankReceiptPage },
	{ id: 'bank-payment', title: 'Payment', Page: BankPaymentPage },
	{ id: 'bank-book', title: 'Bank Book', Page: BankBookPage },
	{ id: 'bank-reconciliation', title: 'Reconciliation', Page: BankReconciliationPage },
]

export const BankModulePage = () => (
	<section aria-labelledby="bank-module-title" className="space-y-3">
		<header>
			<p className="mb-1 text-sm font-semibold uppercase tracking-wide text-blue-700">
				Bank
			</p>
			<h1 id="bank-module-title" className="mb-1 text-2xl font-semibold text-slate-900">
				Bank Forms
			</h1>
			<p className="mb-0 text-sm text-slate-600">
				Expand a form to enter and submit its details. Forms can be opened independently.
			</p>
		</header>

		<div className="space-y-2">
			{bankForms.map(({ id, title, Page }, index) => (
				<details
					key={id}
					className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
					open={index === 0}
				>
					<summary className="flex cursor-pointer list-none items-center justify-between gap-2 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
						<span>{title}</span>
						<ChevronDown
							aria-hidden="true"
							size={20}
							className="shrink-0 text-slate-500 transition-transform group-open:rotate-180"
						/>
					</summary>
					<div className="border-t border-slate-200 p-3">
						<Page embedded />
					</div>
				</details>
			))}
		</div>
	</section>
)