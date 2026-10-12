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
- employment: current employer, position, department, working period, responsibilities, CTC, employer documents
- previous employment: previous company, designation, department, period, salary, documents
- audit fields: created_at, updated_at, is_active

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

## Administrator authentication and record management

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `AUTH_SECRET` in the private
`backend/.env` file. `ADMIN_PASSWORD` is the initial temporary password;
`AUTH_SECRET` must be a randomly generated value of at least 32 characters.
The checked-in `backend/.env.example` contains empty placeholders only. Never
commit real credentials or signing secrets.

On the first successful login, the backend stores the administrator email,
a salted scrypt password hash, password-change state, and token version in the
new `admin_credentials` table. Existing credentials are not reseeded from the
environment on subsequent startups, so changing `ADMIN_PASSWORD` does not
reset a password changed by an administrator. The app creates this new table
using SQLAlchemy `create_all`; existing tables and records are not reset.

`POST /api/v1/auth/login` verifies the persisted credentials and returns a
signed bearer token that expires after one hour. First login must change the
temporary password before accessing admin records. The frontend URLs are:

- `/login` — administrator sign-in
- `/change-password` — authenticated password change (also required at first
  login)
- `/admin` — administrator dashboard
- `/hr-admin`
- `/gl-admin`
- `/inventory-admin`

Change-password requests are sent to `POST /api/v1/auth/change-password`;
`GET /api/v1/auth/me` verifies the current session and
`POST /api/v1/auth/logout` revokes it. Password changes and logout increment
the stored token version, invalidating existing tokens. Passwords are never
returned by the API or stored in plaintext.

The administrator-only API exposes model-backed resource metadata and records
under `/api/v1/admin/{hr|gl|inventory}/...`. Collection listing, individual
record details, updates, and deletes all require the signed administrator
token. Existing form submission and list endpoints remain unchanged; update,
patch, and delete operations on the existing HR, GL, and Inventory APIs also
require administrator authorization.

The existing regular-user option is explicitly a demo session and receives no
administrator token. The project does not currently provide a separate
regular-user authentication service.

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
