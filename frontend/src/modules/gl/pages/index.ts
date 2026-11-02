import type { ComponentType } from 'react'
import {
  TaxTypePage,
  GroupPage,
  GLAccountPage,
  HSNPage,
  SACPage,
  BankAccountPage,
  ChequeRangePage,
  ODLimitPage,
  FixedAssetsPage,
  SecuredLoansPage,
  UnsecuredLoansPage,
  SundryCreditorsPage,
  SundryDebtorsPage,
} from './GLPages'

export const glPages: Record<string, ComponentType> = {
  'tax-type': TaxTypePage,
  group: GroupPage,
  'gl-account': GLAccountPage,
  'hsn': HSNPage,
  'sac': SACPage,
  'bank-account': BankAccountPage,
  'cheque-range': ChequeRangePage,
  'od-limit': ODLimitPage,
  'fixed-assets': FixedAssetsPage,
  'secured-loans': SecuredLoansPage,
  'unsecured-loans': UnsecuredLoansPage,
  'sundry-creditors': SundryCreditorsPage,
  'sundry-debtors': SundryDebtorsPage,
}