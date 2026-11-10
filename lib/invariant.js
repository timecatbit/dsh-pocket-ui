//#region src/invariant.ts
const PACKAGE_NAME = "dsh-ui-mobile";
/** Cordis companion plugin name. */
const name = "client-ui-mobile-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: the responsive sheet is pure presentation CSS and the
* frame controller only mirrors DOM state it does not own. The shell-frame
* contract it relies on (the three-column grid children of the frame) is
* asserted by this package's DOM spec, which runs against the assembled
* AppFrame structure.
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };

//# sourceMappingURL=invariant.js.map