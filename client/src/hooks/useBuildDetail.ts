import { useCallback, useEffect, useState } from "react";
import * as buildsApi from "../api/builds";
import * as partsApi from "../api/parts";
import type {
  AddBuildExtraLinePayload,
  AddBuildItemPayload,
  BuildDetail,
  ConfirmBuildPayload,
  UpdateBuildExtraLinePayload,
  UpdateBuildPayload,
  UpdateBuildItemPayload
} from "../types/build";
import type { Part } from "../types/part";

type UseBuildDetailReturn = {
  build: BuildDetail | null;
  parts: Part[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  addItem: (payload: AddBuildItemPayload) => Promise<void>;
  updateBuildItemLine: (itemId: string, payload: UpdateBuildItemPayload) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  addExtraLine: (payload: AddBuildExtraLinePayload) => Promise<void>;
  updateExtraLine: (lineId: string, payload: UpdateBuildExtraLinePayload) => Promise<void>;
  removeExtraLine: (lineId: string) => Promise<void>;
  confirm: (payload?: ConfirmBuildPayload) => Promise<void>;
  revertToDraft: () => Promise<void>;
  updateBuildFields: (payload: UpdateBuildPayload) => Promise<void>;
  reload: () => Promise<void>;
};

export function useBuildDetail(buildId: string): UseBuildDetailReturn {
  const [build, setBuild] = useState<BuildDetail | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [buildData, partsData] = await Promise.all([buildsApi.getBuild(buildId), partsApi.listParts()]);
      setBuild(buildData);
      setParts(partsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el detalle del montaje.");
    } finally {
      setLoading(false);
    }
  }, [buildId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addItem = useCallback(
    async (payload: AddBuildItemPayload) => {
      setActionLoading(true);
      setError(null);
      try {
        const updated = await buildsApi.addBuildItem(buildId, payload);
        setBuild(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo anadir la pieza.");
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [buildId]
  );

  const updateBuildItemLine = useCallback(
    async (itemId: string, payload: UpdateBuildItemPayload) => {
      setActionLoading(true);
      setError(null);
      try {
        const updated = await buildsApi.updateBuildItem(buildId, itemId, payload);
        setBuild(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo actualizar la linea.");
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [buildId]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      setActionLoading(true);
      setError(null);
      try {
        await buildsApi.deleteBuildItem(buildId, itemId);
        const updated = await buildsApi.getBuild(buildId);
        setBuild(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo eliminar la pieza del montaje.");
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [buildId]
  );

  const addExtraLine = useCallback(
    async (payload: AddBuildExtraLinePayload) => {
      setActionLoading(true);
      setError(null);
      try {
        const updated = await buildsApi.addBuildExtraLine(buildId, payload);
        setBuild(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo anadir el extra.");
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [buildId]
  );

  const updateExtraLine = useCallback(
    async (lineId: string, payload: UpdateBuildExtraLinePayload) => {
      setActionLoading(true);
      setError(null);
      try {
        const updated = await buildsApi.updateBuildExtraLine(buildId, lineId, payload);
        setBuild(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo actualizar el extra.");
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [buildId]
  );

  const removeExtraLine = useCallback(
    async (lineId: string) => {
      setActionLoading(true);
      setError(null);
      try {
        await buildsApi.deleteBuildExtraLine(buildId, lineId);
        const updated = await buildsApi.getBuild(buildId);
        setBuild(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo quitar el extra.");
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [buildId]
  );

  const confirm = useCallback(async (payload?: ConfirmBuildPayload) => {
    setActionLoading(true);
    setError(null);
    try {
      const updated = await buildsApi.confirmBuild(buildId, payload);
      setBuild(updated);
      const latestParts = await partsApi.listParts();
      setParts(latestParts);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo confirmar el montaje.";
      setError(msg);
      throw err instanceof Error ? err : new Error(msg);
    } finally {
      setActionLoading(false);
    }
  }, [buildId]);

  const revertToDraft = useCallback(async () => {
    setActionLoading(true);
    setError(null);
    try {
      const updated = await buildsApi.revertBuildToDraft(buildId);
      setBuild(updated);
      const latestParts = await partsApi.listParts();
      setParts(latestParts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo volver el montaje a borrador.");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [buildId]);

  const updateBuildFields = useCallback(async (payload: UpdateBuildPayload) => {
    setActionLoading(true);
    setError(null);
    try {
      const updated = await buildsApi.updateBuild(buildId, payload);
      setBuild(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el montaje.");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [buildId]);

  return {
    build,
    parts,
    loading,
    actionLoading,
    error,
    addItem,
    updateBuildItemLine,
    removeItem,
    addExtraLine,
    updateExtraLine,
    removeExtraLine,
    confirm,
    revertToDraft,
    updateBuildFields,
    reload
  };
}
