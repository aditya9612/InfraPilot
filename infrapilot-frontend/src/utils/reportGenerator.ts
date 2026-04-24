import type { Project, ProjectMember, Milestone, ProjectExpense, Task } from "../types/project";

/**
 * Generates and downloads a comprehensive Project Site Report in CSV format.
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
