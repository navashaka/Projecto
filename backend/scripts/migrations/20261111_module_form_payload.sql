BEGIN;

ALTER TABLE inventory_unit_of_measures ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE inventory_stock_groups ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE inventory_stock_items ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE inventory_indents ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE inventory_gate_entries ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE inventory_material_receipt_notes ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE inventory_delivery_challans ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE inventory_delivery_challan_inwards ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE inventory_goods_issues ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE inventory_goods_issue_sales ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE ar_customers ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE ar_quotations ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE ar_proforma_invoices ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE ar_invoices ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE ar_tax_invoices ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE ar_invoice_items ADD COLUMN IF NOT EXISTS item_name VARCHAR(250);
ALTER TABLE ar_proforma_invoice_items ADD COLUMN IF NOT EXISTS item_name VARCHAR(250);
ALTER TABLE ar_tax_invoice_items ADD COLUMN IF NOT EXISTS item_name VARCHAR(250);
ALTER TABLE ar_invoices ADD COLUMN IF NOT EXISTS consignee_customer_id BIGINT REFERENCES ar_customers(id) ON DELETE SET NULL;
ALTER TABLE ar_proforma_invoices ADD COLUMN IF NOT EXISTS consignee_customer_id BIGINT REFERENCES ar_customers(id) ON DELETE SET NULL;

ALTER TABLE gl_tax_types ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE gl_groups ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE gl_accounts ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE gl_hsn_master ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE gl_sac_master ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE gl_bank_accounts ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE gl_cheque_ranges ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE gl_od_limits ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE gl_secured_loans ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE gl_unsecured_loans ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE gl_sundry_creditors ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE gl_sundry_debtors ADD COLUMN IF NOT EXISTS form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMIT;
