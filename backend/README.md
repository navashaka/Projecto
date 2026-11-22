# Projecto Backend

FastAPI backend for Projecto.

## Overview

This backend includes the HR recruitment/user enquiry flow for candidate and employment details. The data is stored in PostgreSQL in the table `hr_user_enquiries`.

## Project structure

```text
app/
  api/
    deps.py
    v1/
      router.py
  core/
    config.py
    database.py
  hr/
    recruitment/
      models.py
      schemas.py
      repository.py
      service.py
      router.py
  main.py
```

## Database model

The main table is defined in `app/hr/recruitment/models.py` and is named:

```text
hr_user_enquiries
```

It stores fields for:
- personal details: candidate name, father name, DOB, blood group, marital status, address, phone, email
- identity details: PAN, Aadhaar, passport, nationality, religion, mother tongue
- education: highest qualification, pass year, documents
- address: individual street, city, state, country, and ZIP fields
- education: repeatable qualification details
- employment: employment type, current employer, position, department, start date, responsibilities, CTC, take-home pay, employer documents
- previous employment: repeatable company, designation, department, dates, salary, take-home pay, responsibilities, and documents
- audit fields: created_at, updated_at, is_active

Existing PostgreSQL databases must apply the additive migration at
`scripts/migrations/20261109_candidate_enquiry_fields.sql` before running code
that uses the added Candidate Enquiry columns. The migration preserves all
existing columns and records.

## API endpoints

The router is available under the versioned API prefix:

```text
/api/v1/user-enquiries/
```

### Create enquiry

```http
POST /api/v1/user-enquiries/
```

### List enquiries

```http
GET /api/v1/user-enquiries/
```

### Get one enquiry

```http
GET /api/v1/user-enquiries/{enquiry_id}
```

### Update enquiry

```http
PUT /api/v1/user-enquiries/{enquiry_id}
```

### Upload a Candidate Enquiry document

```http
POST /api/v1/user-enquiries/uploads
```

The other HR forms use the HR form records API. Supported form types are
`bank-enquiry`, `attendance`, `employees`, `company-holidays`, `salary`,
`designations`, `payroll`, `leave`, `on-employment`, and `travelling-advance`.
Each uses `GET /api/v1/hr/forms/{form_type}`, `POST /api/v1/hr/forms/{form_type}`,
`GET /api/v1/hr/forms/{form_type}/{record_id}`, and
`PUT /api/v1/hr/forms/{form_type}/{record_id}`. These records are stored in the
new `hr_form_records` table with their form fields retained in JSON.

## Inventory, AR, and GL form APIs

The Inventory, Accounts Receivable (AR), and General Ledger (GL) forms use
the existing PostgreSQL tables. Before deploying this version, apply the
idempotent additive migration
`scripts/migrations/20261111_module_form_payload.sql`. It adds JSONB payload
columns for fields that do not have normalized columns, item-name columns for
AR document lines, and customer foreign keys for invoice consignee selections.
It does not drop or rewrite existing columns or records.

All forms support the following routes:

```text
GET    /api/v1/module-forms/{module}/{resource}
GET    /api/v1/module-forms/{module}/{resource}/{record_id}
POST   /api/v1/module-forms/{module}/{resource}
PUT    /api/v1/module-forms/{module}/{resource}/{record_id}
DELETE /api/v1/module-forms/{module}/{resource}/{record_id}
GET    /api/v1/module-forms/{module}/lookups/{resource}
```

Create and update requests use `{"payload": {...}}`. Inventory resources are
`units`, `stock-groups`, `stock-items`, `indents`, `gate-entries`,
`material-receipt-notes`, `delivery-challans-inward`,
`delivery-challans-outward`, `goods-issues`, and `goods-issue-sales`.
AR resources are `customers`, `quotations`, `proforma-invoices`, `invoices`,
and `tax-invoices`. GL resources are `tax-types`, `groups`, `accounts`,
`hsn-masters`, `sac-masters`, `bank-accounts`, `cheque-ranges`, `od-limits`,
`fixed-assets`, `secured-loans`, `unsecured-loans`, `sundry-creditors`, and
`sundry-debtors`, and `tax-applicability`.

Document item rows and customer bank accounts are written together with their
parent record in a database transaction. Dropdown lookups return database IDs
and labels; foreign keys are checked by the API and PostgreSQL. Deleting a
record referenced by a restrictive foreign key returns HTTP 409. The
`fixed-assets` and `tax-applicability` resources update the selected GL
account rather than creating or deleting a second account record, so DELETE
is intentionally unavailable for those resources. Cheque images can be uploaded to
`POST /api/v1/module-forms/gl/uploads` and are stored under the ignored
backend uploads folder with generated filenames.

Candidate Enquiry document uploads accept PDF, DOC, DOCX, JPG, JPEG, and PNG
files up to 10 MB. The upload API returns a path that is stored with the
enquiry and can be retrieved through the corresponding uploads GET path.

## Example request body

```json
{
  "candidate_name": "Ravi Kumar",
  "father_name": "Suresh Kumar",
  "date_of_birth": "1995-02-15",
  "blood_group": "O+",
  "marital_status": "Single",
  "address": "Chennai",
  "phone": "9876543210",
  "personal_email": "ravi@example.com",
  "pan": "ABCDE1234F",
  "aadhaar": "123456789012",
  "passport_no": "P1234567",
  "mother_tongue": "Tamil",
  "other_languages_known": "English, Hindi",
  "religion": "Hindu",
  "nationality": "Indian",
  "highest_qualification": "B.E.",
  "year_of_pass": "2018",
  "highest_qualification_document": "degree.pdf",
  "current_employer": "ABC Corp",
  "current_position": "Software Engineer",
  "department": "Engineering",
  "working_period": "2 years",
  "role_responsibilities": "Backend API development",
  "current_ctc": "1200000",
  "employer_documents": "offer-letter.pdf",
  "previous_employer_name": "XYZ Pvt Ltd",
  "previous_employer_position": "Junior Developer",
  "previous_employer_department": "IT",
  "previous_employer_working_period": "1 year",
  "previous_employer_role": "Application support",
  "previous_employer_ctc": "700000",
  "previous_employer_documents": "experience-letter.pdf"
}
```

## PostgreSQL connection setup

Set the database URL in your environment or `.env` file:

```env
DATABASE_URL=postgresql+psycopg://postgres:your_password@localhost:5432/projecto
```

Important: the password must match the actual local PostgreSQL user password. If the password is incorrect, the app will fail at startup with a PostgreSQL authentication error.

## Run locally

```powershell
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

If you are using the project virtual environment:

```powershell
cd backend
..\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Module pattern for a new API

For one new feature, the clean structure is:

1. create model in `app/hr/<feature>/models.py`
2. create schema in `app/hr/<feature>/schemas.py`
3. create router in `app/hr/<feature>/router.py`
4. register the router in `app/api/v1/router.py`
5. ensure the model is imported in `app/main.py` so the table is created

This keeps the database schema and API together in one module and makes future changes easier to maintain.

## Notes

- The app uses FastAPI + SQLAlchemy + PostgreSQL.
- The recruitment model is currently the real HR scenario, replacing the old placeholder department structure.
- If you add more modules later, follow the same pattern for consistency.
