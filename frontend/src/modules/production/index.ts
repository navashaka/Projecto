import type { ComponentType } from 'react'
import ProductionPage from './ProductionPages'

export const productionPages: Record<string, ComponentType> = {
  production: ProductionPage,
}