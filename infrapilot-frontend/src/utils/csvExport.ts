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

  // Ensure "Sr. No." is present as the first column sequentially
  const hasSrNo = "Sr. No." in (data[0] || {}) || "sr_no" in (data[0] || {}) || "Sr No" in (data[0] || {});
  const processedData = hasSrNo
    ? data
    : data.map((item, idx) => ({ "Sr. No.": idx + 1, ...item }));

  const processedHeaders = headers
    ? (hasSrNo ? headers : { "Sr. No.": "Sr. No.", ...headers })
    : undefined;

  // 1. Determine columns (keys)
  const keys = processedHeaders ? Object.keys(processedHeaders) : Object.keys(processedData[0]);
  const headerRow = processedHeaders ? Object.values(processedHeaders) : keys;

  // 2. Build rows
  const rows = processedData.map((item) =>
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
