/**
 * Utility to export an array of objects to a CSV file and trigger a download.
 * 
 * @param data - The array of objects to export.
 * @param filename - The name of the file (e.g., "projects.csv").
 * @param headers - Optional mapping of keys to display names (e.g., { id: "Project ID" }).
 */
export const exportToCSV = (data: any[], filename: string, headers?: Record<string, string>) => {
  if (!data || data.length === 0) {
    console.warn("No data provided for CSV export.");
    return;
  }

  // 1. Determine columns (keys)
  const keys = headers ? Object.keys(headers) : Object.keys(data[0]);
  const headerRow = headers ? Object.values(headers) : keys;

  // 2. Build rows
  const rows = data.map((item) =>
    keys
      .map((key) => {
        let val = item[key] !== undefined && item[key] !== null ? item[key] : "";
        // Escape quotes and wrap in quotes if contains comma
        const stringVal = String(val).replace(/"/g, '""');
        return `"${stringVal}"`;
      })
      .join(",")
  );

  // 3. Combine to CSV string
  const csvContent = [headerRow.map(h => `"${h}"`).join(","), ...rows].join("\n");

  // 4. Create Blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
