// Centralized Indian Rupee (INR) currency formatter
// Use this across the entire application instead of hardcoding $ or formatting inline

/**
 * Format a number as Indian Rupees (INR)
 * @param {number} amount - The amount to format
 * @param {object} options - Optional overrides for toLocaleString
 * @returns {string} Formatted string like "₹1,299.00"
 */
export const formatINR = (amount, options = {}) => {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
};

/**
 * Format a number as INR without decimal places (for whole rupee amounts)
 * @param {number} amount
 * @returns {string} e.g. "₹1,299"
 */
export const formatINRWhole = (amount) => {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export default formatINR;
