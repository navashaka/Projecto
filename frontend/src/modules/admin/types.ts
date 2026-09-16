export type AdminFieldKind = 'text' | 'number' | 'date' | 'boolean'

export type AdminField = {
	name: string
	label: string
	kind: AdminFieldKind
	required?: boolean
	multiline?: boolean
}

export type AdminRecord = Record<string, unknown> & {
	id?: number | string
}

export type AdminResource = {
	key: string
	label: string
	endpoint: string
	fields: AdminField[]
}
