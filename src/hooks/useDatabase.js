"use client";
import { useCallback, useEffect, useState } from "react";
import { getDbStatus, setupDatabase, migrateDatabase, DB_STATUS } from "@/db/setup";
export function useDatabase() {
  const [state, setState] = useState({ loading: true, status: null, error: null });
  const refresh = useCallback(() => setState({ loading: false, error: null, ...getDbStatus() }), []);
  useEffect(() => { refresh(); }, [refresh]);
  const run = useCallback(async (fn) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try { setState({ loading: false, error: null, ...(await fn()) }); }
    catch (e) { setState({ loading: false, status: DB_STATUS.ERROR, error: e.message }); }
  }, []);
  return { ...state, setup: () => run(setupDatabase), migrate: () => run(async () => migrateDatabase()) };
}
