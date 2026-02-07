// Indian Number Formatting (Lakhs/Crores)
export const formatIndianNumber = (num) => {
  if (!num && num !== 0) return '0.00'
  
  const number = parseFloat(num)
  const isNegative = number < 0
  const absolute = Math.abs(number)
  
  // Split into integer and decimal parts
  const [integerPart, decimalPart] = absolute.toFixed(2).split('.')
  
  // Apply Indian formatting
  let formatted = integerPart
  
  if (integerPart.length > 3) {
    // First group of 3 from right
    const lastThree = integerPart.slice(-3)
    // Remaining part grouped by 2
    const otherNumbers = integerPart.slice(0, -3)
    
    if (otherNumbers !== '') {
      formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    } else {
      formatted = lastThree
    }
  }
  
  return `${isNegative ? '-' : ''}${formatted}.${decimalPart}`
}

// Compact version (₹12.5L, ₹3.2Cr)
export const formatIndianCompact = (num) => {
  if (!num && num !== 0) return '0'
  
  const number = parseFloat(num)
  const isNegative = number < 0
  const absolute = Math.abs(number)
  
  if (absolute >= 10000000) {
    return `${isNegative ? '-' : ''}${(absolute / 10000000).toFixed(2)}Cr`
  } else if (absolute >= 100000) {
    return `${isNegative ? '-' : ''}${(absolute / 100000).toFixed(2)}L`
  } else if (absolute >= 1000) {
    return `${isNegative ? '-' : ''}${(absolute / 1000).toFixed(2)}K`
  }
  
  return `${isNegative ? '-' : ''}${absolute.toFixed(2)}`
}
