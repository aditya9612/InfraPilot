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
 * Formats a number with Indian compact notation (L for Lakhs, Cr for Crores).
 * e.g., 150000 -> ₹1.5L
 *       15000000 -> ₹1.5Cr
 * 
 * @param amount - The numerical value to format
 * @returns Compact formatted currency string
 */
export const formatCompactCurrency = (amount: number): string => {
    const absAmount = Math.abs(amount || 0);
    const sign = amount < 0 ? "-" : "";

    if (absAmount >= 10000000) {
        // Crores
        return `${sign}₹${(absAmount / 10000000).toLocaleString("en-IN", {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0
        })}Cr`;
    } else if (absAmount >= 100000) {
        // Lakhs
        return `${sign}₹${(absAmount / 100000).toLocaleString("en-IN", {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0
        })}L`;
    }

    // Default standard formatting for < 1 Lakh
    return formatCurrency(amount, false);
};
