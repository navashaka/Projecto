const ones = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
]

const teens = [
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
]

const tens = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
]

function belowThousandWords(value: number): string {
  const words: string[] = []
  let remainder = value

  if (remainder >= 100) {
    words.push(`${ones[Math.floor(remainder / 100)]} Hundred`)
    remainder %= 100
  }
  if (remainder >= 20) {
    const remainderOnes = remainder % 10
    words.push(
      `${tens[Math.floor(remainder / 10)]}${remainderOnes ? ` ${ones[remainderOnes]}` : ''}`,
    )
  } else if (remainder >= 10) {
    words.push(teens[remainder - 10])
  } else if (remainder > 0) {
    words.push(ones[remainder])
  }
  return words.join(' ')
}

function integerToIndianWords(value: number): string {
  if (value === 0) return 'Zero'

  const groups = [
    { divisor: 1_00_00_00_000, label: 'Arab' },
    { divisor: 1_00_00_000, label: 'Crore' },
    { divisor: 1_00_000, label: 'Lakh' },
    { divisor: 1_000, label: 'Thousand' },
    { divisor: 1, label: '' },
  ]
  const words: string[] = []
  let remainder = value

  for (const { divisor, label } of groups) {
    const groupValue = Math.floor(remainder / divisor)
    if (groupValue > 0) {
      words.push(belowThousandWords(groupValue))
      if (label) words.push(label)
      remainder %= divisor
    }
  }
  return words.join(' ')
}

export function numberToIndianRupeesWords(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new RangeError('Amount must be a finite number.')
  }

  const roundedAmount = Math.round((amount + Number.EPSILON) * 100) / 100
  const absoluteAmount = Math.abs(roundedAmount)
  const rupees = Math.floor(absoluteAmount)
  const paise = Math.round((absoluteAmount - rupees) * 100)
  const sign = roundedAmount < 0 ? 'Minus ' : ''
  const rupeeWords = `${integerToIndianWords(rupees)} Rupees`
  const paiseWords = paise
    ? ` and ${integerToIndianWords(paise)} Paise`
    : ''
  return `${sign}${rupeeWords}${paiseWords} Only`
}
