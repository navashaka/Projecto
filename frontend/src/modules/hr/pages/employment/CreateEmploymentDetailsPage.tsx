import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import * as XLSX from "xlsx";
import HRBackButton from "../../components/HRBackButton";

const API_URL = "http://localhost:8000/api/v1/employment/";
const PAGE_SIZE = 10;

type EmploymentRecord = {
  id: number;
  user_id: number;
  employee_code?: string | null;
  designation?: string | null;
  department?: string | null;
  health_insurance_date?: string | null;
  work_email?: string | null;
};

const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

const toExcelDate = (value: unknown) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "Invalid date";
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (!date) return "Invalid date";
    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }

  return String(value ?? "").trim();
};

const employmentSchema = z.object({
  user_id: z.number().int().positive("User ID is required"),
  employee_code: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  immediate_reporting_head: z.string().optional(),
  department_head: z.string().optional(),
  location: z.string().optional(),
  epf_uan: z.string().optional(),
  esi: z.string().optional(),
  health_insurance: z.string().optional(),
  health_insurance_date: z
    .string()
    .refine((value) => !value || isValidDate(value), "Enter a valid date")
    .optional(),
  work_email: z.union([z.string().email("Enter a valid email"), z.literal("")]).optional(),
  bank_account_name: z.string().optional(),
  account_number: z.string().optional(),
  bank: z.string().optional(),
  branch: z.string().optional(),
  ifsc: z.string().optional(),
});

type EmploymentFormData = z.infer<typeof employmentSchema>;

const emptyValues: EmploymentFormData = {
  user_id: 0,
  employee_code: "",
  designation: "",
  department: "",
  immediate_reporting_head: "",
  department_head: "",
  location: "",
  epf_uan: "",
  esi: "",
  health_insurance: "",
  health_insurance_date: "",
  work_email: "",
  bank_account_name: "",
  account_number: "",
  bank: "",
  branch: "",
  ifsc: "",
};

type FieldName = keyof EmploymentFormData;

const employmentFields: {
  name: FieldName;
  label: string;
  placeholder: string;
  type?: string;
}[] = [
  { name: "user_id", label: "User ID", placeholder: "Enter User ID", type: "number" },
  { name: "employee_code", label: "Employee Code", placeholder: "Enter Employee Code" },
  { name: "designation", label: "Designation", placeholder: "Enter Designation" },
  { name: "department", label: "Department", placeholder: "Enter Department" },
  {
    name: "immediate_reporting_head",
    label: "Immediate Reporting Head",
    placeholder: "Enter Immediate Reporting Head",
  },
  { name: "department_head", label: "Department Head", placeholder: "Enter Department Head" },
  { name: "location", label: "Location", placeholder: "Enter Location" },
];

const statutoryFields: {
  name: FieldName;
  label: string;
  placeholder: string;
  type?: string;
}[] = [
  { name: "epf_uan", label: "EPF UAN", placeholder: "Enter EPF UAN" },
  { name: "esi", label: "ESI", placeholder: "Enter ESI Number" },
  {
    name: "health_insurance",
    label: "Health Insurance",
    placeholder: "Enter Health Insurance Details",
  },
  {
    name: "health_insurance_date",
    label: "Health Insurance Date",
    placeholder: "Select Health Insurance Date",
    type: "date",
  },
  { name: "work_email", label: "Work Email", placeholder: "Enter Work Email", type: "email" },
];

const bankFields: {
  name: FieldName;
  label: string;
  placeholder: string;
}[] = [
  { name: "bank_account_name", label: "Bank Account Name", placeholder: "Enter Bank Account Name" },
  { name: "account_number", label: "Account Number", placeholder: "Enter Account Number" },
  { name: "bank", label: "Bank", placeholder: "Enter Bank Name" },
  { name: "branch", label: "Branch", placeholder: "Enter Branch Name" },
  { name: "ifsc", label: "IFSC", placeholder: "Enter IFSC Code" },
];

const excelHeaders: FieldName[] = [
  "user_id",
  "employee_code",
  "designation",
  "department",
  "immediate_reporting_head",
  "department_head",
  "location",
  "epf_uan",
  "esi",
  "health_insurance",
  "health_insurance_date",
  "work_email",
  "bank_account_name",
  "account_number",
  "bank",
  "branch",
  "ifsc",
];

export default function CreateEmploymentDetailsPage() {
  const [excelRows, setExcelRows] = useState<Record<string, unknown>[]>([]);
  const [excelFileName, setExcelFileName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState<EmploymentRecord[]>([]);
  const [recordsError, setRecordsError] = useState("");
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmploymentFormData>({
    resolver: zodResolver(employmentSchema),
    defaultValues: emptyValues,
  });

  const loadRecords = useCallback(async () => {
    setLoadingRecords(true);
    setRecordsError("");

    try {
      const response = await fetch(API_URL);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.detail || "Unable to load employment records.");
      }
      if (!Array.isArray(result)) {
        throw new Error("The API returned an invalid employment record list.");
      }

      setRecords(result);
      setCurrentPage(1);
    } catch (error) {
      setRecordsError(
        error instanceof Error
          ? error.message
          : "Unable to load employment records.",
      );
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const pageRecords = records.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const renderFields = (
    fields: {
      name: FieldName;
      label: string;
      placeholder: string;
      type?: string;
    }[]
  ) =>
    fields.map((field) => (
      <div className="col-md-6" key={field.name}>
        <label className="form-label" htmlFor={field.name}>
          {field.label}
        </label>
        <input
          id={field.name}
          type={field.type ?? "text"}
          className={`form-control ${errors[field.name] ? "is-invalid" : ""}`}
          placeholder={field.placeholder}
          {...register(field.name, {
            valueAsNumber: field.type === "number",
          })}
        />
        {errors[field.name] && (
          <div className="invalid-feedback">
            {String(errors[field.name]?.message ?? "Invalid value")}
          </div>
        )}
      </div>
    ));

  const uploadExcel = async (file?: File) => {
    setUploadError("");
    setMessage("");
    setExcelRows([]);
    setExcelFileName("");

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "xlsx" && extension !== "xls") {
      setUploadError("Please select an Excel file (.xlsx or .xls).");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) {
        setUploadError("Excel worksheet not found.");
        return;
      }

      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      if (rawRows.length === 0) {
        setUploadError("Excel file has no data rows.");
        return;
      }

      const normalizedRows = rawRows.map((row) => {
        const normalized: Record<string, unknown> = {};

        Object.entries(row).forEach(([key, value]) => {
          normalized[key.trim().toLowerCase().replace(/\s+/g, "_")] = value;
        });

        return normalized;
      });

      const receivedHeaders = Object.keys(normalizedRows[0]);
      const missingHeaders = excelHeaders.filter(
        (header) => !receivedHeaders.includes(header)
      );
      const unexpectedHeaders = receivedHeaders.filter(
        (header) => !excelHeaders.includes(header as FieldName)
      );

      if (missingHeaders.length > 0 || unexpectedHeaders.length > 0) {
        const issues = [
          ...(missingHeaders.length
            ? [`Missing Excel columns: ${missingHeaders.join(", ")}`]
            : []),
          ...(unexpectedHeaders.length
            ? [`Unsupported Excel columns: ${unexpectedHeaders.join(", ")}`]
            : []),
        ];
        setUploadError(issues.join(". "));
        return;
      }

      const rowErrors: string[] = [];
      const preparedRows = normalizedRows.flatMap((row, index) => {
        const prepared: Record<string, unknown> = {};

        excelHeaders.forEach((header) => {
          const value = row[header];

          if (header === "user_id") {
            prepared[header] = value === "" ? "" : Number(value);
          } else if (header === "health_insurance_date") {
            prepared[header] = toExcelDate(value);
          } else {
            prepared[header] = value == null ? "" : String(value).trim();
          }
        });

        const parsed = employmentSchema.safeParse({
          ...emptyValues,
          ...prepared,
          user_id: Number(prepared.user_id),
        });

        if (!parsed.success) {
          rowErrors.push(
            `Row ${index + 2}: ${parsed.error.issues
              .map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`)
              .join(", ")}`,
          );
          return [];
        }

        return [parsed.data];
      });

      if (rowErrors.length > 0) {
        setUploadError(rowErrors.join("\n"));
        return;
      }

      if (preparedRows.length === 0) {
        setUploadError("Excel file has no valid data rows.");
        return;
      }

      setExcelRows(preparedRows);
      setExcelFileName(file.name);
      setMessage(`${preparedRows.length} rows loaded from Excel.`);
    } catch {
      setUploadError("Unable to read Excel file. Check the selected file.");
    }
  };

  const saveRows = async (
    rows: Record<string, unknown>[],
    isExcelUpload = false,
  ) => {
    if (saving || rows.length === 0) return;

    setSaving(true);
    setUploadError("");
    setMessage("");

    try {
      let savedCount = 0;
      const failedRows: Record<string, unknown>[] = [];
      const failures: string[] = [];

      for (let index = 0; index < rows.length; index++) {
        const raw = rows[index];
        const payload = {
          ...emptyValues,
          ...raw,
          user_id: Number(raw.user_id),
        };

        const parsed = employmentSchema.safeParse(payload);

        if (!parsed.success) {
          failures.push(
            `Row ${index + 1}: ${parsed.error.issues
              .map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`)
              .join(", ")}`,
          );
          failedRows.push(raw);
          continue;
        }

        try {
          const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed.data),
          });

          if (!response.ok) {
            const details = await response.text();
            throw new Error(`Save failed (${response.status}): ${details}`);
          }
          savedCount++;
        } catch (error) {
          failedRows.push(raw);
          failures.push(
            `Row ${index + 1}: ${
              error instanceof Error ? error.message : "Unable to save record."
            }`,
          );
        }
      }

      if (savedCount > 0) {
        setMessage(`${savedCount} employment record(s) saved successfully.`);
        await loadRecords();
      }

      if (isExcelUpload) {
        setExcelRows(failedRows);
        if (failedRows.length === 0) setExcelFileName("");
      }

      if (failures.length > 0) {
        setUploadError(failures.join("\n"));
      } else {
        reset(emptyValues);
        if (isExcelUpload) {
          setExcelRows([]);
          setExcelFileName("");
        }
      }
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Unable to save records."
      );
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (data: EmploymentFormData) => {
    await saveRows([data as unknown as Record<string, unknown>]);
  };

  const clearForm = () => {
    reset(emptyValues);
    setExcelRows([]);
    setExcelFileName("");
    setUploadError("");
    setMessage("");
  };

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 mb-4">Create Employment Details</h1>

      {message && <div className="alert alert-success">{message}</div>}
      {uploadError && <div className="alert alert-danger">{uploadError}</div>}

      <form className="row g-3" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="col-12">
          <section className="border rounded bg-white p-3 p-md-4">
            <h2 className="h4 mb-3">Employment Information</h2>
            <div className="row g-3">{renderFields(employmentFields)}</div>
          </section>
        </div>

        <div className="col-12">
          <section className="border rounded bg-white p-3 p-md-4">
            <h2 className="h4 mb-3">Statutory &amp; Insurance Details</h2>
            <div className="row g-3">{renderFields(statutoryFields)}</div>
          </section>
        </div>

        <div className="col-12">
          <section className="border rounded bg-white p-3 p-md-4">
            <h2 className="h4 mb-3">Bank Details</h2>
            <div className="row g-3">{renderFields(bankFields)}</div>
          </section>
        </div>

        {/* Upload Details appears after Bank Details */}
        <div className="col-12">
          <section className="border rounded bg-white p-3 p-md-4">
            <h2 className="h4 mb-3">Upload Details</h2>
            <input
              id="employmentExcel"
              type="file"
              accept=".xlsx,.xls"
              className="form-control"
              disabled={saving}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                void uploadExcel(file);
              }}
            />

            {excelFileName && (
              <p className="mt-2 mb-3">
                Selected file: <strong>{excelFileName}</strong>
              </p>
            )}

            {excelRows.length > 0 && (
              <>
                <div className="table-responsive mt-3">
                  <table className="table table-bordered table-sm align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        {excelHeaders.map((header) => (
                          <th key={header}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {excelRows.map((row, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          {excelHeaders.map((header) => (
                            <td key={header}>{String(row[header] ?? "")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={saving}
                  onClick={() => saveRows(excelRows, true)}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            )}
          </section>
        </div>

        <div className="col-12 d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={clearForm}
            disabled={saving}
          >
            Clear
          </button>

          <HRBackButton />
        </div>
      </form>

      <section className="border rounded bg-white p-3 p-md-4 mt-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h2 className="h4 mb-0">Saved Employment Records</h2>
          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={loadingRecords}
            onClick={() => void loadRecords()}
          >
            {loadingRecords ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {recordsError && (
          <div className="alert alert-danger" role="alert">
            {recordsError}
          </div>
        )}

        {loadingRecords ? (
          <p className="text-muted mb-0">Loading employment records...</p>
        ) : records.length === 0 ? (
          <p className="text-muted mb-0">No employment records found.</p>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>User ID</th>
                    <th>Employee Code</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Health Insurance Date</th>
                    <th>Work Email</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.id}</td>
                      <td>{record.user_id}</td>
                      <td>{record.employee_code || "—"}</td>
                      <td>{record.designation || "—"}</td>
                      <td>{record.department || "—"}</td>
                      <td>{record.health_insurance_date || "—"}</td>
                      <td>{record.work_email || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <span className="small text-muted">
                Page {currentPage} of {totalPages} · {records.length} records
              </span>
              <div className="btn-group">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}