import { useState, useEffect, useCallback } from "react";
import { settingsService } from "../services/settingsService";
import { projectService } from "../services/projectService";

/**
 * Shared hook for all Client module pages.
 * Resolves the active project ID from:
 *   1. settingsService.getSettings().default_project_id  (user's chosen project)
 *   2. First project returned by projectService.getProjects  (fallback)
 *
 * Also re-checks on window focus so that switching projects in Settings
 * is immediately reflected when the user navigates back.
 */
export function useClientProjectId() {
  const [projectId, setProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const resolve = useCallback(async () => {
    try {
      // 1. Try user settings first
      const settings = await settingsService.getSettings();
      if (settings?.default_project_id) {
        setProjectId(Number(settings.default_project_id));
        setLoading(false);
        return;
      }

      // 2. Fallback: first available project
      const projectsResult: any = await projectService.getProjects(1, 0);
      let pid: number | null = null;
      if (Array.isArray(projectsResult) && projectsResult.length > 0) {
        pid = projectsResult[0].id || projectsResult[0].project_id;
      } else if (projectsResult?.items?.length > 0) {
        pid = projectsResult.items[0].id || projectsResult.items[0].project_id;
      } else if (projectsResult?.data?.length > 0) {
        pid = projectsResult.data[0].id || projectsResult.data[0].project_id;
      }
      setProjectId(pid);
    } catch (err) {
      console.error("useClientProjectId: failed to resolve project:", err);
      setProjectId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    resolve();

    // Re-check when window regains focus (e.g. user changed project in settings)
    window.addEventListener("focus", resolve);
    return () => window.removeEventListener("focus", resolve);
  }, [resolve]);

  return { projectId, loading };
}
