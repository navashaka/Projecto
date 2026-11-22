ALTER TABLE purchase_vendor_creation
    ADD COLUMN IF NOT EXISTS bank_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS bank_details TEXT,
    ADD COLUMN IF NOT EXISTS msme_details TEXT;
