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

const parseDateComponents = (dateStr: any): { d: string; m: string; y: string } | null => {
    if (!dateStr || (typeof dateStr !== 'string' && !(dateStr instanceof Date))) return null;

    if (dateStr instanceof Date) {
        if (isNaN(dateStr.getTime())) return null;
        return {
            d: dateStr.getDate().toString().padStart(2, '0'),
            m: (dateStr.getMonth() + 1).toString().padStart(2, '0'),
            y: dateStr.getFullYear().toString()
        };
    }

    const str = String(dateStr).trim().split('T')[0];

    // 1. Check YYYY-MM-DD or YYYY/MM/DD
    const ymd = /^(\d{4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})/.exec(str);
    if (ymd) {
        return {
            y: ymd[1],
            m: ymd[2].padStart(2, '0'),
            d: ymd[3].padStart(2, '0')
        };
    }

    // 2. Check DD-MM-YYYY or MM-DD-YYYY or DD/MM/YYYY or MM/DD/YYYY
    const dmy = /^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})/.exec(str);
    if (dmy) {
        let first = parseInt(dmy[1], 10);
        let second = parseInt(dmy[2], 10);
        let year = dmy[3];

        if (first > 12) {
            return { d: dmy[1].padStart(2, '0'), m: dmy[2].padStart(2, '0'), y: year };
        }
        if (second > 12) {
            return { m: dmy[1].padStart(2, '0'), d: dmy[2].padStart(2, '0'), y: year };
        }
        return { d: dmy[1].padStart(2, '0'), m: dmy[2].padStart(2, '0'), y: year };
    }

    // 3. Fallback to JS new Date
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
        return {
            d: parsed.getDate().toString().padStart(2, '0'),
            m: (parsed.getMonth() + 1).toString().padStart(2, '0'),
            y: parsed.getFullYear().toString()
        };
    }

    return null;
};

export const formatDateBySettings = (dateStr: any): string => {
    if (!dateStr || dateStr === "-" || dateStr === "N/A" || dateStr === "NA" || dateStr === "null") return "-";

    const comp = parseDateComponents(dateStr);
    if (!comp) return typeof dateStr === 'string' ? dateStr : "-";

    let format = "DD/MM/YYYY";
    try {
        const direct = localStorage.getItem("user_date_format");
        if (direct) {
            format = direct;
        } else {
            const localSettings = localStorage.getItem("mock_settings");
            if (localSettings) {
                const parsed = JSON.parse(localSettings);
                if (parsed?.preferences?.date_format) {
                    format = parsed.preferences.date_format;
                }
            }
        }
    } catch (e) {
        // ignore
    }

    switch (format) {
        case "MM/DD/YYYY":
            return `${comp.m}/${comp.d}/${comp.y}`;
        case "YYYY-MM-DD":
            return `${comp.y}-${comp.m}-${comp.d}`;
        case "DD/MM/YYYY":
        default:
            return `${comp.d}/${comp.m}/${comp.y}`;
    }
};
