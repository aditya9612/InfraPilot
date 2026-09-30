import { projectService } from "../services/projectService";
import { ownerService } from "../services/ownerService";
import { financeService } from "../services/financeService";
import { quotationService } from "../services/quotationService";

/**
 * Filters a list of projects so that only projects assigned or linked to the given client are returned.
 * 
 * Linkages resolved:
 * 1. Explicit project ID (user.project_id / profile.project_id)
 * 2. Explicit project Name (user.project_name / profile.project_name / user.address)
 * 3. Matching Owner records (by user id, phone, email, or full name) -> project.owner_id
 * 4. Project direct IDs (project.owner_id, project.client_id, project.client_user_id, project.user_id)
 * 5. Project owner/client name matching client name
 * 6. Financial records (invoices, quotations) linking client to a project
 * 7. Project team/members matching client ID, email, or phone
 */
export function filterProjectsForClient(
  allProjects: any[],
  user?: any,
  profile?: any,
  owners: any[] = [],
  invoices: any[] = [],
  quotations: any[] = []
): any[] {
  if (!Array.isArray(allProjects) || allProjects.length === 0) return [];

  // Fallback to localStorage user if user is missing
  let activeUser = user;
  if (!activeUser) {
    try {
      const stored = localStorage.getItem("infrapilot_user");
      if (stored) activeUser = JSON.parse(stored);
    } catch {
      activeUser = null;
    }
  }

  const cleanPhone = (str: any) => String(str || "").replace(/\D/g, "");
  const norm = (str: any) => String(str || "").trim().toLowerCase();

  const userIds = new Set<string>();
  if (activeUser?.id != null) userIds.add(String(activeUser.id).trim());
  if (activeUser?.user_id != null) userIds.add(String(activeUser.user_id).trim());
  if (profile?.user_id != null) userIds.add(String(profile.user_id).trim());
  if (profile?.id != null) userIds.add(String(profile.id).trim());

  const userNames = new Set<string>();
  if (activeUser?.name) userNames.add(norm(activeUser.name));
  if (activeUser?.full_name) userNames.add(norm(activeUser.full_name));
  if (profile?.full_name) userNames.add(norm(profile.full_name));
  if (profile?.name) userNames.add(norm(profile.name));

  const userPhones = new Set<string>();
  if (activeUser?.mobile) {
    const cp = cleanPhone(activeUser.mobile);
    if (cp.length >= 7) userPhones.add(cp);
  }
  if (activeUser?.mobile_number) {
    const cp = cleanPhone(activeUser.mobile_number);
    if (cp.length >= 7) userPhones.add(cp);
  }
  if (profile?.mobile_number) {
    const cp = cleanPhone(profile.mobile_number);
    if (cp.length >= 7) userPhones.add(cp);
  }
  if (profile?.mobile) {
    const cp = cleanPhone(profile.mobile);
    if (cp.length >= 7) userPhones.add(cp);
  }

  const userEmails = new Set<string>();
  if (activeUser?.email) userEmails.add(norm(activeUser.email));
  if (profile?.email) userEmails.add(norm(profile.email));

  const userCompanies = new Set<string>();
  if (activeUser?.designation) userCompanies.add(norm(activeUser.designation));
  if (profile?.designation) userCompanies.add(norm(profile.designation));

  // Match Owner records with this client
  const clientOwnerIds = new Set<string>();
  (owners || []).forEach((o: any) => {
    const oId = String(o.id || o.owner_id || "").trim();
    const oName = norm(o.name || o.owner_name);
    const oPhone = cleanPhone(o.mobile || o.mobile_number || o.phone);
    const oEmail = norm(o.email);

    let isMatch = false;
    if (oId && userIds.has(oId)) isMatch = true;
    if (oName && userNames.has(oName)) isMatch = true;
    if (oEmail && userEmails.has(oEmail)) isMatch = true;
    if (oPhone && oPhone.length >= 7) {
      for (const up of userPhones) {
        if (up === oPhone || up.endsWith(oPhone) || oPhone.endsWith(up)) {
          isMatch = true;
          break;
        }
      }
    }
    if (isMatch && oId) {
      clientOwnerIds.add(oId);
    }
  });

  const clientProjectIds = new Set<string>();
  const clientProjectNames = new Set<string>();

  // Explicit user / profile assigned project
  if (activeUser?.project_id) clientProjectIds.add(String(activeUser.project_id).trim());
  if (profile?.project_id) clientProjectIds.add(String(profile.project_id).trim());
  if (activeUser?.project_name) clientProjectNames.add(norm(activeUser.project_name));
  if (profile?.project_name) clientProjectNames.add(norm(profile.project_name));
  if (activeUser?.address) clientProjectNames.add(norm(activeUser.address));

  // Invoices linking client to projects
  (invoices || []).forEach((inv: any) => {
    const invOwnerId = String(inv.owner_id || inv.client_id || inv.user_id || "").trim();
    const invClientName = norm(inv.client_name || inv.customer_name || inv.owner_name);
    const invPid = inv.project_id != null ? String(inv.project_id).trim() : null;
    const invPname = inv.project_name ? norm(inv.project_name) : null;

    let isMatch = false;
    if (invOwnerId && (userIds.has(invOwnerId) || clientOwnerIds.has(invOwnerId))) isMatch = true;
    if (invClientName && userNames.has(invClientName)) isMatch = true;

    if (isMatch) {
      if (invPid) clientProjectIds.add(invPid);
      if (invPname) clientProjectNames.add(invPname);
    }
  });

  // Quotations linking client to projects
  (quotations || []).forEach((q: any) => {
    const qUserId = String(q.client_user_id || q.client_id || q.user_id || "").trim();
    const qName = norm(q.client_name || q.customer_name || q.client);
    const qCompany = norm(q.company_name || q.company);
    const qPhone = cleanPhone(q.mobile_number || q.mobile || q.phone);
    const qPid = q.project_id != null ? String(q.project_id).trim() : null;
    const qPname = q.project_name ? norm(q.project_name) : null;

    let isMatch = false;
    if (qUserId && (userIds.has(qUserId) || clientOwnerIds.has(qUserId))) isMatch = true;
    if (qName && userNames.has(qName)) isMatch = true;
    if (qCompany && userCompanies.has(qCompany)) isMatch = true;
    if (qPhone && qPhone.length >= 7) {
      for (const up of userPhones) {
        if (up === qPhone || up.endsWith(qPhone) || qPhone.endsWith(up)) {
          isMatch = true;
          break;
        }
      }
    }

    if (isMatch) {
      if (qPid) clientProjectIds.add(qPid);
      if (qPname) clientProjectNames.add(qPname);
    }
  });

  // Filter projects
  return allProjects.filter((p: any) => {
    if (!p) return false;
    const pId = String(p.id || p.project_id || "").trim();
    const pName = norm(p.name || p.project_name || p.title);
    const pOwnerId = p.owner_id != null ? String(p.owner_id).trim() : "";
    const pClientId = p.client_id != null ? String(p.client_id).trim() : "";
    const pClientUserId = p.client_user_id != null ? String(p.client_user_id).trim() : "";
    const pUserId = p.user_id != null ? String(p.user_id).trim() : "";
    const pOwnerName = norm(p.owner_name || p.client_name || p.client);

    // 1. Direct project ID match
    if (pId && clientProjectIds.has(pId)) return true;

    // 2. Direct project Name match
    if (pName && clientProjectNames.has(pName)) return true;

    // 3. Owner ID match with matched owners or client user ID
    if (pOwnerId && (clientOwnerIds.has(pOwnerId) || userIds.has(pOwnerId))) return true;

    // 4. Client / User ID match
    if (pClientId && (clientOwnerIds.has(pClientId) || userIds.has(pClientId))) return true;
    if (pClientUserId && (clientOwnerIds.has(pClientUserId) || userIds.has(pClientUserId))) return true;
    if (pUserId && (clientOwnerIds.has(pUserId) || userIds.has(pUserId))) return true;

    // 5. Owner / Client name matches user name
    if (pOwnerName && Array.from(userNames).some(un => un && (pOwnerName === un || pOwnerName.includes(un) || un.includes(pOwnerName)))) {
      return true;
    }

    // 6. Project members match
    const members = Array.isArray(p.members) ? p.members : (Array.isArray(p.team) ? p.team : []);
    if (members.some((m: any) => {
      const mId = String(m.user_id || m.id || "").trim();
      const mEmail = norm(m.email);
      const mPhone = cleanPhone(m.mobile || m.mobile_number || m.phone);
      if (mId && userIds.has(mId)) return true;
      if (mEmail && userEmails.has(mEmail)) return true;
      if (mPhone && mPhone.length >= 7) {
        for (const up of userPhones) {
          if (up === mPhone || up.endsWith(mPhone) || mPhone.endsWith(up)) return true;
        }
      }
      return false;
    })) {
      return true;
    }

    return false;
  });
}

/**
 * Convenience helper to fetch and filter all projects belonging to the current client.
 */
export async function fetchClientAssignedProjects(user?: any, profile?: any): Promise<any[]> {
  try {
    const [projectsRes, ownersRes, invoicesRes, quotationsRes] = await Promise.all([
      projectService.getProjects(100, 0).catch(() => []),
      ownerService.getOwners().catch(() => []),
      financeService.getInvoices(100, 0).catch(() => []),
      quotationService.getQuotations(100, 0).catch(() => []),
    ]);

    const rawProjects = Array.isArray(projectsRes)
      ? projectsRes
      : (projectsRes?.items || projectsRes?.data || []);

    return filterProjectsForClient(
      rawProjects,
      user,
      profile,
      Array.isArray(ownersRes) ? ownersRes : (ownersRes?.items || ownersRes?.data || []),
      Array.isArray(invoicesRes) ? invoicesRes : (invoicesRes?.items || invoicesRes?.data || []),
      Array.isArray(quotationsRes) ? quotationsRes : (quotationsRes?.items || quotationsRes?.data || [])
    );
  } catch (err) {
    console.error("fetchClientAssignedProjects failed:", err);
    return [];
  }
}
