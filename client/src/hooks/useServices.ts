import { useCallback, useEffect, useState } from "react";
import * as servicesApi from "../api/services";
import type { CreateServicePayload, PatchServicePayload, ServiceRow } from "../types/service";

type UseServicesReturn = {
  services: ServiceRow[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  actionId: string | null;
  reload: () => Promise<void>;
  createService: (payload: CreateServicePayload) => Promise<void>;
  patchService: (id: string, payload: PatchServicePayload) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  completeService: (id: string) => Promise<void>;
};

/** month/year siempre filtran por fecha del servicio */
export function useServices(
  month: number,
  year: number,
  filterType?: string,
  filterStatus?: string
): UseServicesReturn {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await servicesApi.listServices({
        month,
        year,
        type: filterType,
        status: filterStatus
      });
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar servicios.");
    } finally {
      setLoading(false);
    }
  }, [month, year, filterType, filterStatus]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createService = useCallback(
    async (payload: CreateServicePayload) => {
      setSubmitting(true);
      setError(null);
      try {
        await servicesApi.createService(payload);
        await reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo crear el servicio.");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [reload]
  );

  const patchService = useCallback(
    async (id: string, payload: PatchServicePayload) => {
      setActionId(id);
      setError(null);
      try {
        await servicesApi.patchService(id, payload);
        await reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo actualizar.");
        throw err;
      } finally {
        setActionId(null);
      }
    },
    [reload]
  );

  const deleteService = useCallback(
    async (id: string) => {
      setActionId(id);
      setError(null);
      try {
        await servicesApi.deleteService(id);
        await reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo eliminar.");
        throw err;
      } finally {
        setActionId(null);
      }
    },
    [reload]
  );

  const completeService = useCallback(
    async (id: string) => {
      setActionId(id);
      setError(null);
      try {
        await servicesApi.completeService(id);
        await reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo completar.");
        throw err;
      } finally {
        setActionId(null);
      }
    },
    [reload]
  );

  return {
    services,
    loading,
    error,
    submitting,
    actionId,
    reload,
    createService,
    patchService,
    deleteService,
    completeService
  };
}
