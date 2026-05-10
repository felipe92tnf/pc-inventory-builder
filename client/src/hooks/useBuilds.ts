import { useCallback, useEffect, useState } from "react";
import * as buildsApi from "../api/builds";
import type { Build, CreateBuildPayload, UpdateBuildPayload } from "../types/build";

type UseBuildsReturn = {
  builds: Build[];
  loading: boolean;
  creating: boolean;
  updatingId: string | null;
  deletingId: string | null;
  error: string | null;
  createBuild: (payload: CreateBuildPayload) => Promise<void>;
  updateBuild: (buildId: string, payload: UpdateBuildPayload) => Promise<void>;
  deleteBuild: (buildId: string) => Promise<void>;
  reload: () => Promise<void>;
};

export function useBuilds(): UseBuildsReturn {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await buildsApi.listBuilds();
      setBuilds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los montajes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createBuild = useCallback(async (payload: CreateBuildPayload) => {
    setCreating(true);
    setError(null);
    try {
      const created = await buildsApi.createBuild(payload);
      setBuilds((prev) => [created, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el montaje.");
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  const deleteBuild = useCallback(async (buildId: string) => {
    setDeletingId(buildId);
    setError(null);
    try {
      await buildsApi.deleteBuild(buildId);
      setBuilds((prev) => prev.filter((build) => build.id !== buildId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el montaje.");
      throw err;
    } finally {
      setDeletingId(null);
    }
  }, []);

  const updateBuild = useCallback(async (buildId: string, payload: UpdateBuildPayload) => {
    setUpdatingId(buildId);
    setError(null);
    try {
      const updated = await buildsApi.updateBuild(buildId, payload);
      setBuilds((prev) => prev.map((build) => (build.id === buildId ? updated : build)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo editar el montaje.");
      throw err;
    } finally {
      setUpdatingId(null);
    }
  }, []);

  return { builds, loading, creating, updatingId, deletingId, error, createBuild, updateBuild, deleteBuild, reload };
}
