import type { ComponentType } from 'react'

import { BankModulePage } from './BankPages'

export const bankPages: Record<string, ComponentType> = {
	'bank-module': BankModulePage,
	'bank-book': BankModulePage,
	'bank-passbook': BankModulePage,
	'bank-receipt': BankModulePage,
	'bank-payment': BankModulePage,
	'bank-reconciliation': BankModulePage,
}