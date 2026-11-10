import { Context } from "@deepseek-ai/cordis";
//#region src/index.d.ts
/** The app-shell service worker: cache strategies for repeat-launch speed. */
declare function buildServiceWorkerScript(): string;
/**
 * Register the PWA host surface when the webserver service is composed.
 * @param ctx - Host context that may acquire the webserver service.
 */
declare function apply(ctx: Context): void;
//#endregion
export { apply, buildServiceWorkerScript };
//# sourceMappingURL=index.d.ts.map