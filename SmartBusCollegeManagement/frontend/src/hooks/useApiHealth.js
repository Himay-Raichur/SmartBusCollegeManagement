import { useEffect, useState } from "react";
import api from "../services/api";

export default function useApiHealth() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.get("/health");
        setStatus("online");
      } catch {
        setStatus("offline");
      }
    };

    checkHealth();
  }, []);

  return status;
}