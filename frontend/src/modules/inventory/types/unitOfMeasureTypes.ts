export interface UnitOfMeasure {
  id: number
  symbol: string
  name: string
  number_of_decimals: number
  created_at?: string
  updated_at?: string
}

export interface CreateUnitOfMeasurePayload {
  symbol: string
  name: string
  number_of_decimals: number
}