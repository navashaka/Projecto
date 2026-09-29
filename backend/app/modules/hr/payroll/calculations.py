from decimal import Decimal


def calculate_employee_epf(
    basic_salary: Decimal,
) -> Decimal:
    return basic_salary * Decimal("0.12")


def calculate_employee_esi(
    gross_salary: Decimal,
) -> Decimal:
    # ESI employee contribution:
    # 0.75% when gross salary is within the configured limit.
    if gross_salary <= Decimal("21000"):
        return gross_salary * Decimal("0.0075")

    return Decimal("0")


def calculate_salary(
    basic_salary: Decimal,
    allowances: Decimal,
    other_income: Decimal,
    tds: Decimal,
    other_deductions: Decimal,
) -> dict:
    gross_salary = (
        basic_salary
        + allowances
        + other_income
    )

    employee_epf = calculate_employee_epf(
        basic_salary
    )

    employee_esi = calculate_employee_esi(
        gross_salary
    )

    total_deductions = (
        employee_epf
        + employee_esi
        + tds
        + other_deductions
    )

    net_salary = (
        gross_salary
        - total_deductions
    )

    return {
        "gross_salary": gross_salary,
        "employee_epf": employee_epf,
        "employee_esi": employee_esi,
        "total_deductions": total_deductions,
        "net_salary": net_salary,
    }