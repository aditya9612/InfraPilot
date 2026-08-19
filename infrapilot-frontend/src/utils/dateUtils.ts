/**
 * Utility to reliably convert a date/time string (assumed to be UTC if no TZ is present)
 * to Indian Standard Time (IST) in a human-readable format.
 */

/**
 * Returns current local date in YYYY-MM-DD format.
 */
export const getLocalDateString = (d: Date = new Date()): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Returns current local time in HH:mm:ss format (24-hour).
 */
export const getLocalTimeString = (d: Date = new Date()): string => {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

/**
 * Returns current date in YYYY-MM-DD format for Indian Standard Time (IST).
 */
export const getISTDateString = (d: Date = new Date()): string => {
    try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        return formatter.format(d);
    } catch {
        return getLocalDateString(d);
    }
};

/**
 * Returns current date/time formatted as "YYYY-MM-DDTHH:mm" for <input type="datetime-local">
 * using Indian Standard Time (IST) / Asia/Kolkata timezone.
 */
export const getLocalDateTimeString = (d: Date = new Date()): string => {
    try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        const parts = formatter.formatToParts(d);
        const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
        const year = getPart('year');
        const month = getPart('month');
        const day = getPart('day');
        let hour = getPart('hour');
        if (hour === '24') hour = '00';
        const minute = getPart('minute');
        return `${year}-${month}-${day}T${hour}:${minute}`;
    } catch {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
};

/**
 * Returns current local datetime in ISO-like format YYYY-MM-DDTHH:mm:ss
 */
export const getLocalISOString = (d: Date = new Date()): string => {
    return `${getLocalDateString(d)}T${getLocalTimeString(d)}`;
};

/**
 * Parse any time or datetime string (assumed to be UTC from server if no timezone is specified)
 * into a JavaScript Date object.
 */
export const parseUTCToDate = (timeStr: string | null | undefined, baseDate?: string): Date | null => {
    if (!timeStr || timeStr === "--:--" || timeStr === "null" || timeStr === "undefined" || timeStr === "-") return null;
    let str = String(timeStr).trim();

    // 1. Already 12-hour format string (e.g., "03:21 PM" or "3:21:00 PM")
    const ampmMatch = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(str);
    if (ampmMatch) {
        let h = parseInt(ampmMatch[1], 10);
        const m = parseInt(ampmMatch[2], 10);
        const s = ampmMatch[3] ? parseInt(ampmMatch[3], 10) : 0;
        const period = ampmMatch[4].toUpperCase();
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        const d = new Date();
        d.setHours(h, m, s, 0);
        return d;
    }

    // 2. If it's a time-only string like "09:51:00", "09:51", "09:51:00.123456"
    const timeOnlyMatch = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/.exec(str);
    if (timeOnlyMatch) {
        const todayStr = baseDate || new Date().toISOString().split('T')[0];
        const h = timeOnlyMatch[1].padStart(2, '0');
        const m = timeOnlyMatch[2].padStart(2, '0');
        const s = (timeOnlyMatch[3] || '00').padStart(2, '0');
        str = `${todayStr}T${h}:${m}:${s}Z`;
    } else {
        // Standardize datetime string: "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS"
        if (!str.includes('T') && str.includes(' ')) {
            str = str.replace(' ', 'T');
        }
        // If no timezone offset is present, treat as UTC (append 'Z')
        if (!str.includes('Z') && !str.includes('+') && !/[-+]\d{2}:\d{2}$/.test(str)) {
            str += 'Z';
        }
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

/**
 * Formats any UTC time representation into standard Indian Standard Time (IST) 12-hour format (e.g. 03:21 PM).
 */
export const formatToIST = (dateStr: string | null | undefined): string => {
    if (!dateStr || dateStr === "--:--" || dateStr === "null" || dateStr === "undefined" || dateStr === "-") return "-";

    try {
        const date = parseUTCToDate(dateStr);
        if (!date) return "-";

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

/**
 * Format time directly in Indian Standard Time (IST).
 */
export const formatDisplayTime = (timeStr: string | null | undefined): string => {
    return formatToIST(timeStr);
};

export const formatDateToIST = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "";

    try {
        const date = parseUTCToDate(dateStr);
        if (!date) return "-";

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
