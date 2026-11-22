import type { ComponentType } from 'react'

import { BankModulePage } from './BankPages'
import {
  BankAccountPage,
  BankODCCAccountPage,
  ChequeRangePage,
  ODLimitPage
} from '../../gl/pages/GLPages'

export const bankPages: Record<string, ComponentType> = {
	'bank-account': BankAccountPage,
	'bank-occ-account': BankODCCAccountPage,
	'od-account': BankODCCAccountPage,
	'cc-account': BankODCCAccountPage,
	'cheque-range': ChequeRangePage,
	'od-limit': ODLimitPage,
	'bank-module': BankModulePage,
	'bank-book': BankModulePage,
	'bank-passbook': BankModulePage,
	'bank-receipt': BankModulePage,
	'bank-payment': BankModulePage,
	'bank-reconciliation': BankModulePage,
}