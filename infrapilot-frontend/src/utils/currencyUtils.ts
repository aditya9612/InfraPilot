/**
 * Formats a number as an Indian Rupee currency string.
 * e.g., 100000 -> ₹1,00,000.00
 * 
 * @param amount - The numerical value to format
 * @param showFraction - Whether to show decimal places (default: true)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, showFraction = true): string => {
    const formatter = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: showFraction ? 2 : 0,
        maximumFractionDigits: showFraction ? 2 : 0,
    });

    return formatter.format(amount || 0);
};

/**
 * Formats a number without compact notation as requested (full whole number).
 * 
 * @param amount - The numerical value to format
 * @returns Formatted currency string
 */
export const formatCompactCurrency = (amount: number): string => {
    return formatCurrency(amount, true);
};
