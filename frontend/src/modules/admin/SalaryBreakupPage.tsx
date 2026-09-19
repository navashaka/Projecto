import React, { useMemo, useState } from 'react'
import {
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    MenuItem,
    TextField,
    Typography,
} from '@mui/material'

type ComponentRow = {
    id: number
    component: string
    baseAmount: number
    percentage: number
    amount: number
}

const allowanceComponents = [
    'Basic',
    'Allowance 1',
    'Allowance 2',
    'Allowance 3',
    'Allowance 4',
    'Allowance 5',
    'Allowance 6',
    'Other Allowance',
    'Arrears',
]

const deductionComponents = [
    'EPF - Employee Share',
    'ESI - Employee Share',
    'Insurance - Employee Share',
    'TDS',
    'Canteen Deduction',
    'Advance',
    'Loan EMI',
    'Other Deduction',
]

const employerComponents = [
    'EPF - Employer Share',
    'EPS - Employer Share',
    'ESI - Employer Share',
    'Insurance - Employer Share',
    'Transport Allowance',
    'Canteen Allowance',
    'Bonus',
    'Other Employer Contribution',
]

const defaultPercentage = (component: string): number => {
    switch (component) {
        case 'EPF - Employee Share':
            return 12

        case 'ESI - Employee Share':
            return 0.75

        case 'EPF - Employer Share':
            return 3.67

        case 'EPS - Employer Share':
            return 8.33

        case 'ESI - Employer Share':
            return 3.25

        default:
            return 0
    }
}

const roundValue = (value: number): number => {
    return Math.round(value)
}

const SalaryBreakupPage: React.FC = () => {
    const [userId, setUserId] = useState('')

    const [allowances, setAllowances] =
        useState<ComponentRow[]>([])

    const [deductions, setDeductions] =
        useState<ComponentRow[]>([])

    const [employerShare, setEmployerShare] =
        useState<ComponentRow[]>([])

    const [effectiveDate, setEffectiveDate] =
        useState('')

    const [allowanceComponent, setAllowanceComponent] =
        useState('')

    const [allowanceAmount, setAllowanceAmount] =
        useState('')

    const [deductionComponent, setDeductionComponent] =
        useState('')

    const [deductionBase, setDeductionBase] =
        useState('')

    const [deductionPercentage, setDeductionPercentage] =
        useState('')

    const [employerComponent, setEmployerComponent] =
        useState('')

    const [employerBase, setEmployerBase] =
        useState('')

    const [employerPercentage, setEmployerPercentage] =
        useState('')

    const [saving, setSaving] = useState(false)

    const basic = useMemo(() => {
        return allowances
            .filter(
                (row) => row.component === 'Basic'
            )
            .reduce(
                (total, row) => total + row.amount,
                0
            )
    }, [allowances])

    const totalAllowances = useMemo(() => {
        return roundValue(
            allowances.reduce(
                (total, row) => total + row.amount,
                0
            )
        )
    }, [allowances])

    const grossSalary = useMemo(() => {
        return totalAllowances
    }, [totalAllowances])

    const employeeEpf = useMemo(() => {
        const row = deductions.find(
            (item) =>
                item.component ===
                'EPF - Employee Share'
        )

        if (row) {
            return row.amount
        }

        return roundValue(basic * 0.12)
    }, [deductions, basic])

    const employeeEsi = useMemo(() => {
        if (grossSalary > 21000) {
            return 0
        }

        const row = deductions.find(
            (item) =>
                item.component ===
                'ESI - Employee Share'
        )

        if (row) {
            return row.amount
        }

        return roundValue(
            grossSalary * 0.0075
        )
    }, [deductions, grossSalary])

    const otherDeductions = useMemo(() => {
        return deductions
            .filter(
                (row) =>
                    row.component !==
                        'EPF - Employee Share' &&
                    row.component !==
                        'ESI - Employee Share'
            )
            .reduce(
                (total, row) => total + row.amount,
                0
            )
    }, [deductions])

    const totalDeductions = useMemo(() => {
        return roundValue(
            employeeEpf +
                employeeEsi +
                otherDeductions
        )
    }, [
        employeeEpf,
        employeeEsi,
        otherDeductions,
    ])

    const netSalary = useMemo(() => {
        return roundValue(
            grossSalary - totalDeductions
        )
    }, [grossSalary, totalDeductions])

    const employerEpf = useMemo(() => {
        const row = employerShare.find(
            (item) =>
                item.component ===
                'EPF - Employer Share'
        )

        if (row) {
            return row.amount
        }

        return roundValue(basic * 0.0367)
    }, [employerShare, basic])

    const employerEps = useMemo(() => {
        const row = employerShare.find(
            (item) =>
                item.component ===
                'EPS - Employer Share'
        )

        if (row) {
            return row.amount
        }

        return roundValue(basic * 0.0833)
    }, [employerShare, basic])

    const employerEsi = useMemo(() => {
        if (grossSalary > 21000) {
            return 0
        }

        const row = employerShare.find(
            (item) =>
                item.component ===
                'ESI - Employer Share'
        )

        if (row) {
            return row.amount
        }

        return roundValue(
            grossSalary * 0.0325
        )
    }, [employerShare, grossSalary])

    const otherEmployerContribution =
        useMemo(() => {
            return employerShare
                .filter(
                    (row) =>
                        row.component !==
                            'EPF - Employer Share' &&
                        row.component !==
                            'EPS - Employer Share' &&
                        row.component !==
                            'ESI - Employer Share'
                )
                .reduce(
                    (total, row) =>
                        total + row.amount,
                    0
                )
        }, [employerShare])

    const totalEmployerShare = useMemo(() => {
        return roundValue(
            employerEpf +
                employerEps +
                employerEsi +
                otherEmployerContribution
        )
    }, [
        employerEpf,
        employerEps,
        employerEsi,
        otherEmployerContribution,
    ])

    const totalCtc = useMemo(() => {
        return roundValue(
            grossSalary +
                totalEmployerShare
        )
    }, [
        grossSalary,
        totalEmployerShare,
    ])

    const calculatePercentageAmount = (
        base: string,
        percentage: string
    ) => {
        const baseValue =
            Number(base) || 0

        const percentageValue =
            Number(percentage) || 0

        return roundValue(
            (baseValue * percentageValue) /
                100
        )
    }

    const handleAddAllowance = () => {
        if (!allowanceComponent) {
            alert(
                'Please select Allowance Component'
            )
            return
        }

        const amount =
            Number(allowanceAmount) || 0

        if (amount <= 0) {
            alert('Please enter amount')
            return
        }

        const newRow: ComponentRow = {
            id: Date.now(),
            component: allowanceComponent,
            baseAmount: amount,
            percentage: 0,
            amount: roundValue(amount),
        }

        setAllowances((previous) => [
            ...previous,
            newRow,
        ])

        setAllowanceComponent('')
        setAllowanceAmount('')
    }

    const handleAddDeduction = () => {
        if (!deductionComponent) {
            alert(
                'Please select Deduction Component'
            )
            return
        }

        let percentage =
            Number(deductionPercentage) || 0

        let base =
            Number(deductionBase) || 0

        let amount = 0

        if (
            deductionComponent ===
            'EPF - Employee Share'
        ) {
            percentage = 12
            base = basic
            amount = roundValue(
                basic * 0.12
            )
        } else if (
            deductionComponent ===
            'ESI - Employee Share'
        ) {
            percentage = 0.75
            base = grossSalary

            amount =
                grossSalary > 21000
                    ? 0
                    : roundValue(
                          grossSalary *
                              0.0075
                      )
        } else {
            amount =
                percentage > 0
                    ? calculatePercentageAmount(
                          deductionBase,
                          deductionPercentage
                      )
                    : base
        }

        const newRow: ComponentRow = {
            id: Date.now(),
            component: deductionComponent,
            baseAmount: base,
            percentage,
            amount,
        }

        setDeductions((previous) => [
            ...previous,
            newRow,
        ])

        setDeductionComponent('')
        setDeductionBase('')
        setDeductionPercentage('')
    }

    const handleAddEmployer = () => {
        if (!employerComponent) {
            alert(
                'Please select Employer Component'
            )
            return
        }

        let percentage =
            Number(employerPercentage) || 0

        let base =
            Number(employerBase) || 0

        let amount = 0

        if (
            employerComponent ===
            'EPF - Employer Share'
        ) {
            percentage = 3.67
            base = basic
            amount = roundValue(
                basic * 0.0367
            )
        } else if (
            employerComponent ===
            'EPS - Employer Share'
        ) {
            percentage = 8.33
            base = basic
            amount = roundValue(
                basic * 0.0833
            )
        } else if (
            employerComponent ===
            'ESI - Employer Share'
        ) {
            percentage = 3.25
            base = grossSalary

            amount =
                grossSalary > 21000
                    ? 0
                    : roundValue(
                          grossSalary *
                              0.0325
                      )
        } else {
            amount =
                percentage > 0
                    ? calculatePercentageAmount(
                          employerBase,
                          employerPercentage
                      )
                    : base
        }

        const newRow: ComponentRow = {
            id: Date.now(),
            component: employerComponent,
            baseAmount: base,
            percentage,
            amount,
        }

        setEmployerShare((previous) => [
            ...previous,
            newRow,
        ])

        setEmployerComponent('')
        setEmployerBase('')
        setEmployerPercentage('')
    }

    const handleDeleteAllowance = (
        id: number
    ) => {
        setAllowances((previous) =>
            previous.filter(
                (row) => row.id !== id
            )
        )
    }

    const handleDeleteDeduction = (
        id: number
    ) => {
        setDeductions((previous) =>
            previous.filter(
                (row) => row.id !== id
            )
        )
    }

    const handleDeleteEmployer = (
        id: number
    ) => {
        setEmployerShare((previous) =>
            previous.filter(
                (row) => row.id !== id
            )
        )
    }

    const handleSave = async () => {
        if (!userId) {
            alert('Please enter User ID')
            return
        }

        if (!effectiveDate) {
            alert(
                'Please select Effective Date From'
            )
            return
        }

        if (
            allowances.length === 0 &&
            deductions.length === 0 &&
            employerShare.length === 0
        ) {
            alert(
                'Please add at least one salary component'
            )
            return
        }

        const getAllowance = (
            component: string
        ) => {
            return (
                allowances.find(
                    (row) =>
                        row.component ===
                        component
                )?.amount || 0
            )
        }

        const getDeduction = (
            component: string
        ) => {
            return (
                deductions.find(
                    (row) =>
                        row.component ===
                        component
                )?.amount || 0
            )
        }

        const getEmployer = (
            component: string
        ) => {
            return (
                employerShare.find(
                    (row) =>
                        row.component ===
                        component
                )?.amount || 0
            )
        }

        const payload = {
            user_id: Number(userId),

            effective_date: effectiveDate,

            salary_offered_ctc: totalCtc,

            yearly_increment: 0,

            increment_year:
                new Date(
                    effectiveDate
                ).getFullYear(),

            basic:
                getAllowance('Basic'),

            allowance1:
                getAllowance(
                    'Allowance 1'
                ),

            allowance2:
                getAllowance(
                    'Allowance 2'
                ),

            allowance3:
                getAllowance(
                    'Allowance 3'
                ),

            allowance4:
                getAllowance(
                    'Allowance 4'
                ),

            allowance5:
                getAllowance(
                    'Allowance 5'
                ),

            allowance6:
                getAllowance(
                    'Allowance 6'
                ),

            other_allowance:
                getAllowance(
                    'Other Allowance'
                ),

            arrears:
                getAllowance('Arrears'),

            gross: grossSalary,

            epf_deduction:
                employeeEpf,

            esi_insurance_deduction:
                employeeEsi +
                getDeduction(
                    'Insurance - Employee Share'
                ),

            tds:
                getDeduction('TDS'),

            canteen_deduction:
                getDeduction(
                    'Canteen Deduction'
                ),

            advance_deduction:
                getDeduction('Advance'),

            loan_emi:
                getDeduction('Loan EMI'),

            other_deduction:
                getDeduction(
                    'Other Deduction'
                ),

            total_deductions:
                totalDeductions,

            net_salary:
                netSalary,

            epf_employer_share:
                employerEpf,

            esi_employer_share:
                employerEsi,

            insurance_employer_share:
                getEmployer(
                    'Insurance - Employer Share'
                ),

            transport_allowance:
                getEmployer(
                    'Transport Allowance'
                ),

            canteen_allowance:
                getEmployer(
                    'Canteen Allowance'
                ),

            bonus:
                getEmployer('Bonus'),

            other_employer_contribution:
                getEmployer(
                    'Other Employer Contribution'
                ) + employerEps,

            total_ctc:
                totalCtc,
        }

        try {
            setSaving(true)

            const response = await fetch(
                'http://localhost:8000/api/v1/salary-details/',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',
                    },

                    body: JSON.stringify(
                        payload
                    ),
                }
            )

            const result =
                await response.json()

            if (!response.ok) {
                throw new Error(
                    result?.detail ||
                        'Failed to save salary details'
                )
            }

            console.log(
                'Salary Details Saved:',
                result
            )

            alert(
                'Salary Break-up saved successfully'
            )
        } catch (error) {
            console.error(
                'Salary Break-up Save Error:',
                error
            )

            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to save Salary Break-up'
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography
                variant="h5"
                sx={{ mb: 3 }}
            >
                Salary Break-up
            </Typography>

            {/* USER ID */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography
                        variant="h6"
                        sx={{ mb: 2 }}
                    >
                        Employee
                    </Typography>

                    <TextField
                        label="User ID"
                        type="number"
                        value={userId}
                        onChange={(event) =>
                            setUserId(
                                event.target.value
                            )
                        }
                        fullWidth
                    />
                </CardContent>
            </Card>

            {/* ALLOWANCES */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography
                        variant="h6"
                        sx={{ mb: 2 }}
                    >
                        Allowances
                    </Typography>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                md: '1fr 1fr 1fr',
                            },
                            gap: 2,
                        }}
                    >
                        <TextField
                            select
                            label="Salary Component"
                            value={
                                allowanceComponent
                            }
                            onChange={(event) =>
                                setAllowanceComponent(
                                    event.target.value
                                )
                            }
                            fullWidth
                        >
                            {allowanceComponents.map(
                                (item) => (
                                    <MenuItem
                                        key={item}
                                        value={item}
                                    >
                                        {item}
                                    </MenuItem>
                                )
                            )}
                        </TextField>

                        <TextField
                            label="Amount"
                            type="number"
                            value={
                                allowanceAmount
                            }
                            onChange={(event) =>
                                setAllowanceAmount(
                                    event.target.value
                                )
                            }
                            fullWidth
                        />

                        <Button
                            variant="contained"
                            onClick={
                                handleAddAllowance
                            }
                        >
                            Add Allowance
                        </Button>
                    </Box>

                    {allowances.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            {allowances.map(
                                (row) => (
                                    <Box
                                        key={
                                            row.id
                                        }
                                        sx={{
                                            display:
                                                'flex',
                                            justifyContent:
                                                'space-between',
                                            alignItems:
                                                'center',
                                            mb: 1,
                                            p: 1,
                                            border:
                                                '1px solid #ddd',
                                            borderRadius:
                                                1,
                                        }}
                                    >
                                        <Typography>
                                            {
                                                row.component
                                            }
                                        </Typography>

                                        <Typography>
                                            ₹
                                            {
                                                row.amount
                                            }
                                        </Typography>

                                        <Button
                                            color="error"
                                            size="small"
                                            onClick={() =>
                                                handleDeleteAllowance(
                                                    row.id
                                                )
                                            }
                                        >
                                            Delete
                                        </Button>
                                    </Box>
                                )
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* DEDUCTIONS */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography
                        variant="h6"
                        sx={{ mb: 2 }}
                    >
                        Deductions
                    </Typography>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                md: '1fr 1fr 1fr',
                            },
                            gap: 2,
                        }}
                    >
                        <TextField
                            select
                            label="Salary Component"
                            value={
                                deductionComponent
                            }
                            onChange={(event) => {
                                const value =
                                    event.target.value

                                setDeductionComponent(
                                    value
                                )

                                const defaultValue =
                                    defaultPercentage(
                                        value
                                    )

                                setDeductionPercentage(
                                    defaultValue > 0
                                        ? String(
                                              defaultValue
                                          )
                                        : ''
                                )
                            }}
                            fullWidth
                        >
                            {deductionComponents.map(
                                (item) => (
                                    <MenuItem
                                        key={item}
                                        value={item}
                                    >
                                        {item}
                                    </MenuItem>
                                )
                            )}
                        </TextField>

                        <TextField
                            label="Base Amount"
                            type="number"
                            value={
                                deductionBase
                            }
                            onChange={(event) =>
                                setDeductionBase(
                                    event.target.value
                                )
                            }
                            fullWidth
                        />

                        <TextField
                            label="Percentage"
                            type="number"
                            value={
                                deductionPercentage
                            }
                            onChange={(event) =>
                                setDeductionPercentage(
                                    event.target.value
                                )
                            }
                            fullWidth
                        />

                        <Button
                            variant="contained"
                            onClick={
                                handleAddDeduction
                            }
                        >
                            Add Deduction
                        </Button>
                    </Box>

                    {deductions.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            {deductions.map(
                                (row) => (
                                    <Box
                                        key={
                                            row.id
                                        }
                                        sx={{
                                            display:
                                                'flex',
                                            justifyContent:
                                                'space-between',
                                            alignItems:
                                                'center',
                                            mb: 1,
                                            p: 1,
                                            border:
                                                '1px solid #ddd',
                                            borderRadius:
                                                1,
                                        }}
                                    >
                                        <Typography>
                                            {
                                                row.component
                                            }
                                        </Typography>

                                        <Typography>
                                            {row.percentage >
                                            0
                                                ? `${row.percentage}% → `
                                                : ''}
                                            ₹
                                            {
                                                row.amount
                                            }
                                        </Typography>

                                        <Button
                                            color="error"
                                            size="small"
                                            onClick={() =>
                                                handleDeleteDeduction(
                                                    row.id
                                                )
                                            }
                                        >
                                            Delete
                                        </Button>
                                    </Box>
                                )
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* EMPLOYER SHARE */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography
                        variant="h6"
                        sx={{ mb: 2 }}
                    >
                        Employer Share
                    </Typography>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                md: '1fr 1fr 1fr',
                            },
                            gap: 2,
                        }}
                    >
                        <TextField
                            select
                            label="Salary Component"
                            value={
                                employerComponent
                            }
                            onChange={(event) => {
                                const value =
                                    event.target.value

                                setEmployerComponent(
                                    value
                                )

                                const defaultValue =
                                    defaultPercentage(
                                        value
                                    )

                                setEmployerPercentage(
                                    defaultValue > 0
                                        ? String(
                                              defaultValue
                                          )
                                        : ''
                                )
                            }}
                            fullWidth
                        >
                            {employerComponents.map(
                                (item) => (
                                    <MenuItem
                                        key={item}
                                        value={item}
                                    >
                                        {item}
                                    </MenuItem>
                                )
                            )}
                        </TextField>

                        <TextField
                            label="Base Amount"
                            type="number"
                            value={
                                employerBase
                            }
                            onChange={(event) =>
                                setEmployerBase(
                                    event.target.value
                                )
                            }
                            fullWidth
                        />

                        <TextField
                            label="Percentage"
                            type="number"
                            value={
                                employerPercentage
                            }
                            onChange={(event) =>
                                setEmployerPercentage(
                                    event.target.value
                                )
                            }
                            fullWidth
                        />

                        <Button
                            variant="contained"
                            onClick={
                                handleAddEmployer
                            }
                        >
                            Add Employer Share
                        </Button>
                    </Box>

                    {employerShare.length >
                        0 && (
                        <Box sx={{ mt: 3 }}>
                            {employerShare.map(
                                (row) => (
                                    <Box
                                        key={
                                            row.id
                                        }
                                        sx={{
                                            display:
                                                'flex',
                                            justifyContent:
                                                'space-between',
                                            alignItems:
                                                'center',
                                            mb: 1,
                                            p: 1,
                                            border:
                                                '1px solid #ddd',
                                            borderRadius:
                                                1,
                                        }}
                                    >
                                        <Typography>
                                            {
                                                row.component
                                            }
                                        </Typography>

                                        <Typography>
                                            {row.percentage >
                                            0
                                                ? `${row.percentage}% → `
                                                : ''}
                                            ₹
                                            {
                                                row.amount
                                            }
                                        </Typography>

                                        <Button
                                            color="error"
                                            size="small"
                                            onClick={() =>
                                                handleDeleteEmployer(
                                                    row.id
                                                )
                                            }
                                        >
                                            Delete
                                        </Button>
                                    </Box>
                                )
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* SALARY SUMMARY */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography
                        variant="h6"
                        sx={{ mb: 2 }}
                    >
                        Salary Summary
                    </Typography>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: '1fr 1fr',
                                md: '1fr 1fr 1fr',
                            },
                            gap: 2,
                        }}
                    >
                        <TextField
                            label="Basic"
                            value={basic}
                            disabled
                        />

                        <TextField
                            label="Total Allowances"
                            value={
                                totalAllowances
                            }
                            disabled
                        />

                        <TextField
                            label="Gross Salary"
                            value={
                                grossSalary
                            }
                            disabled
                        />

                        <TextField
                            label="EPF - Employee"
                            value={
                                employeeEpf
                            }
                            disabled
                        />

                        <TextField
                            label="ESI - Employee"
                            value={
                                employeeEsi
                            }
                            disabled
                        />

                        <TextField
                            label="Total Deductions"
                            value={
                                totalDeductions
                            }
                            disabled
                        />

                        <TextField
                            label="Net Salary"
                            value={
                                netSalary
                            }
                            disabled
                        />

                        <TextField
                            label="EPF - Employer"
                            value={
                                employerEpf
                            }
                            disabled
                        />

                        <TextField
                            label="EPS - Employer"
                            value={
                                employerEps
                            }
                            disabled
                        />

                        <TextField
                            label="ESI - Employer"
                            value={
                                employerEsi
                            }
                            disabled
                        />

                        <TextField
                            label="Total Employer Share"
                            value={
                                totalEmployerShare
                            }
                            disabled
                        />

                        <TextField
                            label="Total CTC"
                            value={
                                totalCtc
                            }
                            disabled
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* EFFECTIVE DATE */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography
                        variant="h6"
                        sx={{ mb: 2 }}
                    >
                        Effective Date
                    </Typography>

                    <TextField
                        label="Effective Date From"
                        type="date"
                        value={
                            effectiveDate
                        }
                        onChange={(event) =>
                            setEffectiveDate(
                                event.target.value
                            )
                        }
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        fullWidth
                    />
                </CardContent>
            </Card>

            <Divider sx={{ mb: 3 }} />

            {/* FINAL SAVE */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent:
                        'flex-end',
                }}
            >
                <Button
                    variant="contained"
                    size="large"
                    onClick={
                        handleSave
                    }
                    disabled={
                        saving ||
                        !effectiveDate ||
                        !userId
                    }
                >
                    {saving
                        ? 'Saving...'
                        : 'Save'}
                </Button>
            </Box>
        </Box>
    )
}

export default SalaryBreakupPage