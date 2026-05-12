/**
 * Generic CSV parser that returns an array of objects based on headers.
 */
export const parseCSV = (content: string): any[] => {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const results = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim());
        if (cols.length !== headers.length) continue;

        const obj: any = {};
        headers.forEach((header, index) => {
            // Basic cleaning for quotes
            let value = cols[index].replace(/^["'](.+)["']$/, '$1');
            obj[header] = value;
        });
        results.push(obj);
    }

    return results;
};
