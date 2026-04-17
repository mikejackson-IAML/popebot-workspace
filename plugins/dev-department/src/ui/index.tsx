Replace lines 15-20:
```typescript
let _getSdkUi: ((name: string) => any) | null = null;
try {
  // Dynamic import of the runtime accessor — works in Paperclip's module host
  const runtime = require("@paperclipai/plugin-sdk/dist/ui/runtime");
  _getSdkUi = runtime.getSdkUiRuntimeValue;
} catch { /* not available — fallbacks will be used */ }
```
With:
```typescript
let _getSdkUi: ((name: string) => any) | null = null;
// Async dynamic import — resolves before first React render in practice
(async () => {
  try {
    const runtime = await import("@paperclipai/plugin-sdk/dist/ui/runtime");
    _getSdkUi = runtime.getSdkUiRuntimeValue;
  } catch { /* not available — fallbacks will be used */ }
})();
```
