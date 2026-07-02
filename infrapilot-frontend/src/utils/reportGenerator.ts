import type { Project, ProjectMember, Milestone, ProjectExpense, Task } from "../types/project";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generates and downloads a comprehensive Project Site Report in CSV/Excel format.
 */
export const generateProjectReport = (
  project: Project,
  members: ProjectMember[],
  milestones: Milestone[],
  expenses: ProjectExpense[],
  tasks: Task[]
) => {
  const sections: string[] = [];

  // 1. Project Overview Section
  sections.push("--- PROJECT OVERVIEW ---");
  sections.push("Project Name,ID,Status,Progress,Start Date,End Date,Budget");
  sections.push(
    `"${project.project_name}","PRJ-${project.id}","${project.status}","${project.completion_percentage}%","${project.start_date}","${project.end_date}","₹${project.budget?.toLocaleString() || 0}"`
  );
  sections.push("");

  // 2. Team Members Section
  sections.push("--- TEAM MEMBERS ---");
  sections.push("Name,Email,Role");
  members.forEach(m => {
    sections.push(`"${m.full_name}","${m.email}","${m.role}"`);
  });
  sections.push("");

  // 3. Milestones Section
  sections.push("--- MILESTONES ---");
  sections.push("Title,Status,Target Date");
  milestones.forEach(m => {
    sections.push(`"${m.title}","${m.status || 'Pending'}","${m.end_date}"`);
  });
  sections.push("");

  // 4. Work Items (Tasks) Section
  sections.push("--- WORK ITEMS (TASKS) ---");
  sections.push("Title,Status,Completion %,Deadline");
  tasks.forEach(t => {
    sections.push(`"${t.title}","${t.status}","${t.completion_percentage}%","${t.end_date}"`);
  });
  sections.push("");

  // 5. Financial Status Section
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  sections.push("--- FINANCIAL SUMMARY ---");
  sections.push(`Total Site Expenses,"₹${totalExpense.toLocaleString()}"`);
  sections.push("");
  sections.push("Date,Description,Category,Status,Amount");
  expenses.forEach(e => {
    sections.push(`"${e.date}","${e.description}","${e.category}","${e.status}","₹${e.amount.toLocaleString()}"`);
  });

  const csvContent = sections.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  const date = new Date().toISOString().split('T')[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `SiteReport_${project.project_name.replace(/\s+/g, '_')}_${date}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generates and downloads a Project Site Report as Excel (CSV).
 */
export const generateProjectReportExcel = generateProjectReport;

/**
 * Generates and downloads a Project Site Report as PDF.
 */
export const generateProjectReportPDF = (
  project: Project,
  members: ProjectMember[],
  milestones: Milestone[],
  expenses: ProjectExpense[],
  tasks: Task[]
) => {
  const doc = new jsPDF();
  const date = new Date().toISOString().split('T')[0];
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Header
  doc.setFontSize(18);
  doc.setTextColor(37, 99, 235);
  doc.text("Site Report", 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text(`${project.project_name}  |  PRJ-${project.id}  |  ${date}`, 14, 26);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 29, 196, 29);

  let y = 36;

  // Project Overview
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.text("Project Overview", 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Status", "Progress", "Start Date", "End Date", "Budget"]],
    body: [[
      project.status,
      `${project.completion_percentage}%`,
      project.start_date,
      project.end_date,
      `₹${(project.budget || 0).toLocaleString()}`,
    ]],
    headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Team Members
  doc.setFont("helvetica", "bold");
  doc.text("Team Members", 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Name", "Email", "Role"]],
    body: members.map(m => [m.full_name, m.email, m.role]),
    headStyles: { fillColor: [99, 102, 241], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Milestones
  doc.setFont("helvetica", "bold");
  doc.text("Milestones", 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Title", "Status", "Target Date"]],
    body: milestones.map(m => [m.title, m.status || "Pending", m.end_date]),
    headStyles: { fillColor: [16, 185, 129], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Tasks
  doc.setFont("helvetica", "bold");
  doc.text("Work Items (Tasks)", 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Title", "Status", "Completion %", "Deadline"]],
    body: tasks.map(t => [t.title, t.status, `${t.completion_percentage}%`, t.end_date]),
    headStyles: { fillColor: [245, 158, 11], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Financial Summary
  doc.setFont("helvetica", "bold");
  doc.text(`Financial Summary  —  Total: ₹${totalExpense.toLocaleString()}`, 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Date", "Description", "Category", "Status", "Amount"]],
    body: expenses.map(e => [e.date, e.description, e.category, e.status, `₹${e.amount.toLocaleString()}`]),
    headStyles: { fillColor: [239, 68, 68], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  doc.save(`SiteReport_${project.project_name.replace(/\s+/g, '_')}_${date}.pdf`);
};
