import { useState } from "react";
import { useApp } from "../context/AppContext";

export function useJiraUrl(setField) {
  const { session } = useApp();
  const [jiraLoading, setJiraLoading] = useState(false);
  const [jiraError, setJiraError] = useState("");

  const handleJiraUrl = async (url) => {
    setField("jiraUrl", url);
    setJiraError("");
    const match = url.match(/\/browse\/([A-Z]+-\d+)/i);
    if (!match) return;
    const key = match[1].toUpperCase();
    setField("jira", key);
    setJiraLoading(true);
    try {
      const token = session?.access_token;
      const res = await fetch(`/api/jira/${key}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.errorMessages?.[0] || data.error || `HTTP ${res.status}`);
      setField("jira", `${key}: ${data.fields.summary}`);
      setField("jiraStatus", data.fields.status?.name?.toUpperCase() || "EN CURSO");
    } catch (e) {
      setJiraError(`No se pudo obtener el ticket (${e.message}).`);
    } finally {
      setJiraLoading(false);
    }
  };

  return { handleJiraUrl, jiraLoading, jiraError };
}
