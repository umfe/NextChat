import type { SyncStore } from "@/app/store/sync";

export type ServerSyncConfig = SyncStore["server"];
export type ServerSyncClient = ReturnType<typeof createServerSyncClient>;

const USERNAME_PATTERN = /^[A-Za-z0-9_-]{3,12}$/;

export function isValidServerSyncUsername(username: string) {
  return USERNAME_PATTERN.test(username);
}

export function createServerSyncClient(store: SyncStore) {
  const config = store.server;

  return {
    async request(action: "check" | "get" | "set", value?: string) {
      const res = await fetch("/api/sync/server", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          username: config.username,
          accessCode: config.accessCode,
          value,
        }),
      });

      if (!res.ok) {
        throw new Error(`[Server Sync] ${action} failed: ${res.status}`);
      }

      return res;
    },

    async check() {
      if (!isValidServerSyncUsername(config.username)) {
        return false;
      }

      try {
        const res = await this.request("check");
        const body = (await res.json()) as { ok?: boolean };
        return !!body.ok;
      } catch (e) {
        console.error("[Server Sync] failed to check", e);
      }

      return false;
    },

    async get() {
      const res = await this.request("get");
      return await res.text();
    },

    async set(_: string, value: string) {
      await this.request("set", value);
    },
  };
}
