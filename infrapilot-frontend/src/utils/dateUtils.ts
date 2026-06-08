/**
 * Utility to reliably convert a date string (assumed to be UTC if no TZ is present)
 * to Indian Standard Time (IST) in a human-readable format.
 */

export const formatToIST = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "";

    try {
        // Standardize the string to ISO format if it looks like "YYYY-MM-DD HH:MM:SS"
        // and ensure it's treated as UTC (Z suffix)
        let standardizedStr = dateStr.trim();

        if (!standardizedStr.includes('T') && standardizedStr.includes(' ')) {
            standardizedStr = standardizedStr.replace(' ', 'T');
        }

        // Append 'Z' only if no timezone info is present
        if (!standardizedStr.includes('Z') && !standardizedStr.includes('+') && !/[-+]\d{2}:\d{2}$/.test(standardizedStr)) {
            standardizedStr += 'Z';
        }

        const date = new Date(standardizedStr);

        // If date is invalid, fallback to raw string or "-"
        if (isNaN(date.getTime())) return "-";

        return date.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (e) {
        console.error("IST Conversion Error:", e);
        return "-";
    }
};

export const formatDateToIST = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "";

    try {
        let standardizedStr = dateStr.trim();
        if (!standardizedStr.includes('T') && standardizedStr.includes(' ')) {
            standardizedStr = standardizedStr.replace(' ', 'T');
        }
        if (!standardizedStr.includes('Z') && !standardizedStr.includes('+') && !/[-+]\d{2}:\d{2}$/.test(standardizedStr)) {
            standardizedStr += 'Z';
        }

        const date = new Date(standardizedStr);
        if (isNaN(date.getTime())) return "-";

        return date.toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return "-";
    }
};
