import type { ComponentType } from 'react'

import {
	BankBookPage,
	BankPassbookPage,
	BankReceiptPage,
	BankPaymentPage,
	BankReconciliationPage,
} from './BankPages'

export const bankPages: Record<string, ComponentType> = {
	'bank-book': BankBookPage,
	'bank-passbook': BankPassbookPage,
	'bank-receipt': BankReceiptPage,
	'bank-payment': BankPaymentPage,
	'bank-reconciliation': BankReconciliationPage,
}