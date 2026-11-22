import { useCallback, useEffect, useState } from "react";
import api from "../services/api.js";
import { errMsg } from "../utils/format.js";

export default function useFetch(url, params, pollMs = 0) {
  const [state, setState] = useState({ data: null, meta: null, extra: null, loading: true, error: null });
  const key = JSON.stringify(params || {});

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const { data: body } = await api.get(url, { params: JSON.parse(key) });
        setState({ data: body.data, meta: body.meta || null, extra: body, loading: false, error: null });
      } catch (e) {
        if (!silent) setState((s) => ({ ...s, loading: false, error: errMsg(e) }));
      }
    },
    [url, key]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(() => load(true), pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  return { ...state, reload: () => load() };
}