import { api } from "@/lib/apiService";

export async function getSettings() {
  return api.fetch('/settings');
}

export async function setSetting(key: string, value: any) {
  return api.fetch('/settings', {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  });
}
