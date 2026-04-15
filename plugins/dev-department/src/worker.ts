import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import { store } from "./worker/state";
import { handleMessage } from "./worker/index";
import type { WorkerRequest } from "./worker/messages";

const plugin = definePlugin({
  async setup(ctx) {
    // Try to hydrate from persisted state
    try {
      const saved = await ctx.state.get("store-data");
      if (saved && typeof saved === "string") {
        store.hydrate(saved);
        ctx.logger.info("dev-department: hydrated state from plugin storage");
      }
    } catch {
      ctx.logger.info("dev-department: starting with empty state");
    }
    ctx.logger.info("dev-department plugin setup complete");
  },

  async onHealth() {
    return { status: "ok", message: "Development Department plugin ready" };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
