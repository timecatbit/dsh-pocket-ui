window.__ModuleLoader__.load({
	id: "dsh-ui-mobile",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_dom = require("react-dom");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/frame.ts
		/**
		* Mobile-frame controller: the browser-side half of the responsive shell.
		*
		* The AppFrame's column classes are CSS-module hashed, so another plugin can
		* never reach them by class name. This controller instead stamps stable data
		* attributes on the assembled frame once it appears in the DOM — found through
		* the frame's own `data-shell-overlay` child — and mirrors the frame's
		* collapse state (`data-sidebar-collapsed` / `data-rightbar-collapsed`) plus
		* the viewport tier (`matchMedia`) into one reactive snapshot the mobile nav
		* bar renders from. It owns no DOM state: the frame and its attributes belong
		* to ui-layout, and the controller only reads them.
		*/
		/** Phone-tier media query: below this width the shell restructures into drawers. */
		const MOBILE_QUERY$2 = "(max-width: 767px), (max-width: 980px) and (max-height: 520px) and (pointer: coarse)";
		/** Stable column roles stamped onto the frame's grid children, in DOM order. */
		const COLUMN_ROLES = [
			"sidebar",
			"center",
			"details"
		];
		/** The overlay layer the frame always renders; its parent element is the frame. */
		const OVERLAY_SELECTOR = "[data-shell-overlay]";
		/** The overlay layer's stable attribute (also the stamping stop marker). */
		const OVERLAY_ATTRIBUTE = "data-shell-overlay";
		/** Frame attributes that flip when a drawer opens or closes. */
		const COLLAPSE_ATTRIBUTES = ["data-sidebar-collapsed", "data-rightbar-collapsed", "data-rightbar-fullscreen"];
		/**
		* Resolve the phone-tier media list for the current window. jsdom (and any
		* other embedder without the API) lacks `window.matchMedia`; the controller
		* then stays at desktop behavior, which is the safe default for a test
		* environment and has no effect on real browsers.
		*/
		function createMediaList() {
			const matchMedia = window.matchMedia;
			if (typeof matchMedia === "function") return matchMedia(MOBILE_QUERY$2);
			return {
				matches: false,
				addEventListener: () => {},
				removeEventListener: () => {}
			};
		}
		/**
		* Observe the assembled shell frame and publish {@link MobileNavState}
		* snapshots. `start()` mounts two observers: a body-level watcher that (re-)
		* attaches when the frame appears or is replaced (plugin reload), and a
		* frame-level watcher for collapse-attribute flips. `stop()` tears both down.
		*/
		var MobileFrameController = class {
			listeners = /* @__PURE__ */ new Set();
			media;
			onMedia = () => {
				this.setState({ mobile: this.media.matches });
			};
			onBody = () => {
				this.attach();
				this.stampPhoneControls();
			};
			onFrame = () => {
				this.read();
			};
			frame = null;
			bodyObserver = null;
			frameObserver = null;
			state = {
				mobile: false,
				sidebarOpen: false,
				detailsOpen: false
			};
			/**
			* @param media - media list override (tests); defaults to the window's phone-tier query.
			*/
			constructor(media = createMediaList()) {
				this.media = media;
			}
			/** Current snapshot (stable object between changes). */
			snapshot() {
				return this.state;
			}
			/**
			* Subscribe to state changes.
			* @param listener - called after every snapshot change.
			* @returns unsubscriber.
			*/
			subscribe(listener) {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			}
			/** Start observing. Idempotent-friendly: callers guard with their own lifecycle. */
			start() {
				this.state = {
					...this.state,
					mobile: this.media.matches
				};
				this.media.addEventListener("change", this.onMedia);
				this.bodyObserver = new MutationObserver(this.onBody);
				this.bodyObserver.observe(document.body, {
					childList: true,
					subtree: true
				});
				this.attach();
				this.stampPhoneControls();
			}
			/** Stop observing and drop listeners. */
			stop() {
				this.media.removeEventListener("change", this.onMedia);
				this.bodyObserver?.disconnect();
				this.bodyObserver = null;
				this.frameObserver?.disconnect();
				this.frameObserver = null;
				this.frame = null;
				this.listeners.clear();
			}
			/**
			* Locate the frame (parent of the overlay layer) and, when it is new, stamp
			* the stable attributes and start the collapse observer.
			*/
			attach() {
				const frame = document.querySelector(OVERLAY_SELECTOR)?.parentElement ?? null;
				if (frame === null) return;
				stampDshPhoneColumns(frame);
				if (frame === this.frame) return;
				this.frame = frame;
				frame.dataset.mobileFrame = "";
				this.frameObserver?.disconnect();
				this.frameObserver = new MutationObserver(this.onFrame);
				this.frameObserver.observe(frame, {
					attributes: true,
					attributeFilter: [...COLLAPSE_ATTRIBUTES]
				});
				this.read();
			}
			/**
			* Mark the two low-frequency phone controls which older hosts do not expose
			* with plugin-stable attributes. The names and nesting are public UI
			* behavior: `Menu` wraps the access-mode button in a span, inside its modes
			* group, tools group, and finally the composer toolbar. Marking this
			* structure lets the responsive sheet reflow it without reaching hashed
			* CSS-module classes. Newer hosts already expose the same attributes.
			*/
			stampPhoneControls() {
				[...document.querySelectorAll("button[aria-busy]")].find((button) => button.textContent?.trim() === "Session log")?.setAttribute("data-session-log-download", "");
				const accessMode = [...document.querySelectorAll("button[aria-label]")].find((button) => {
					const label = button.getAttribute("aria-label") ?? "";
					return label.startsWith("Access mode") || label.startsWith("访问模式");
				});
				if (accessMode === void 0) return;
				accessMode.setAttribute("data-input-access-mode", "");
				const modes = accessMode.parentElement?.parentElement;
				const tools = modes?.parentElement;
				const toolbar = tools?.parentElement;
				const trailing = toolbar?.lastElementChild;
				if (modes === null || tools === null || toolbar === null || trailing === null || trailing === void 0 || trailing === tools) return;
				modes.setAttribute("data-composer-modes", "");
				tools.setAttribute("data-composer-tools", "");
				toolbar.setAttribute("data-composer-toolbar", "");
				trailing.setAttribute("data-composer-trailing", "");
			}
			/** Mirror the frame's collapse attributes into the snapshot. */
			read() {
				const frame = this.frame;
				/* v8 ignore next 3 -- defensive arm: read() is only reachable from attach()
				* (which just assigned frame) or the frame observer (only mounted while a
				* frame is assigned); disconnect() drops queued observer records. */
				if (frame === null) return;
				this.setState({
					sidebarOpen: !frame.hasAttribute("data-sidebar-collapsed"),
					detailsOpen: frame.hasAttribute("data-rightbar-fullscreen") || !frame.hasAttribute("data-rightbar-collapsed")
				});
			}
			/** Publish a new snapshot only when something changed. */
			setState(next) {
				const prev = this.state;
				const merged = {
					...prev,
					...next
				};
				if (merged.mobile === prev.mobile && merged.sidebarOpen === prev.sidebarOpen && merged.detailsOpen === prev.detailsOpen) return;
				this.state = merged;
				for (const listener of this.listeners) listener();
			}
		};
		/** Recognize a rightward swipe that starts at the phone screen's left edge. */
		var EdgeSwipeController = class {
			state;
			openSidebar;
			active = false;
			opened = false;
			startX = 0;
			startY = 0;
			onStart = (event) => {
				const touch = event.touches[0];
				const state = this.state.snapshot();
				this.active = touch !== void 0 && event.touches.length === 1 && state.mobile && !state.sidebarOpen && touch.clientX <= 24;
				this.opened = false;
				if (!this.active || touch === void 0) return;
				this.startX = touch.clientX;
				this.startY = touch.clientY;
			};
			onMove = (event) => {
				if (!this.active || this.opened || event.touches.length !== 1) return;
				const touch = event.touches[0];
				if (touch === void 0) return;
				const deltaX = touch.clientX - this.startX;
				if (Math.abs(touch.clientY - this.startY) > 32 || deltaX < 0) {
					this.active = false;
					return;
				}
				if (deltaX < 56) return;
				this.opened = true;
				this.active = false;
				this.openSidebar();
			};
			onEnd = () => {
				this.active = false;
			};
			/**
			* @param state - source of phone-tier and drawer state.
			* @param openSidebar - delegates the open action to ui-layout.
			*/
			constructor(state, openSidebar) {
				this.state = state;
				this.openSidebar = openSidebar;
			}
			/** Begin window-level gesture observation. */
			start() {
				window.addEventListener("touchstart", this.onStart, { passive: true });
				window.addEventListener("touchmove", this.onMove, { passive: true });
				window.addEventListener("touchend", this.onEnd, { passive: true });
				window.addEventListener("touchcancel", this.onEnd, { passive: true });
			}
			/** Stop observation and discard any partial gesture. */
			stop() {
				window.removeEventListener("touchstart", this.onStart);
				window.removeEventListener("touchmove", this.onMove);
				window.removeEventListener("touchend", this.onEnd);
				window.removeEventListener("touchcancel", this.onEnd);
				this.active = false;
				this.opened = false;
			}
		};
		//#endregion
		//#region src/client/install.ts
		/**
		* Install controller: the PWA install-promotion half of the mobile plugin.
		*
		* Owns the install-prompt lifecycle (Chrome/Edge Android's
		* `beforeinstallprompt`), the iOS "add to home screen" hint, and the
		* phone-tier flag — one reactive snapshot the install banner renders from.
		* It never touches the DOM beyond window event listeners and localStorage;
		* like MobileFrameController it owns no DOM state.
		*/
		/** Phone-tier media query, shared with the frame controller. */
		const MOBILE_QUERY$1 = "(max-width: 767px), (max-width: 980px) and (max-height: 520px) and (pointer: coarse)";
		/** Legacy localStorage key used by previous iOS-only install guidance. */
		const IOS_HINT_KEY = "dsh-ui-mobile:ios-install-hint";
		/** localStorage key remembering that the user dismissed install promotion. */
		const INSTALL_PROMOTION_DISMISSED_KEY = "dsh-ui-mobile:install-promotion-dismissed";
		/** Static media fallback for environments without matchMedia. */
		const STATIC_MEDIA = {
			matches: false,
			addEventListener: () => {},
			removeEventListener: () => {}
		};
		/** Evaluate a media query safely (browsers only). */
		function matches(query) {
			if (typeof window.matchMedia !== "function") return false;
			return window.matchMedia(query).matches;
		}
		/** True when the app is already launched from the home screen (no browser chrome). */
		function isStandalone() {
			return navigator.standalone === true || matches("(display-mode: standalone)") || matches("(display-mode: fullscreen)");
		}
		/** True on iOS Safari (the only browser that needs a manual add-to-home-screen hint). */
		function isIOSBrowser() {
			const ua = navigator.userAgent;
			return /iphone|ipad|ipod/i.test(ua) || ua.includes("Macintosh") && "ontouchstart" in window;
		}
		/**
		* Own the install-prompt lifecycle and publish {@link InstallState}
		* snapshots. `start()` arms the phone-tier media query and the
		* `beforeinstallprompt` listener; `stop()` tears both down.
		*/
		var InstallController = class {
			listeners = /* @__PURE__ */ new Set();
			media;
			onMedia = () => {
				this.setState({ mobile: this.media.matches });
			};
			onPrompt = (event) => {
				if (this.isPromotionDismissed()) return;
				this.promptEvent = event;
				this.setState({ installable: true });
			};
			promptEvent = null;
			state = {
				mobile: false,
				installable: false,
				iosHintVisible: false
			};
			/**
			* @param media - phone-tier media list override (tests); defaults to the window query.
			*/
			constructor(media = typeof window.matchMedia === "function" ? window.matchMedia(MOBILE_QUERY$1) : STATIC_MEDIA) {
				this.media = media;
				this.state = {
					mobile: media.matches,
					installable: false,
					iosHintVisible: !isStandalone() && isIOSBrowser() && !this.isPromotionDismissed()
				};
			}
			/** Current snapshot (stable object between changes). */
			snapshot() {
				return this.state;
			}
			/**
			* Subscribe to state changes.
			* @param listener - called after every snapshot change.
			* @returns unsubscriber.
			*/
			subscribe(listener) {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			}
			/** Start listening. Callers guard their own lifecycle (ctx.effect). */
			start() {
				this.media.addEventListener("change", this.onMedia);
				window.addEventListener("beforeinstallprompt", this.onPrompt);
			}
			/** Stop listening and drop listeners. */
			stop() {
				this.media.removeEventListener("change", this.onMedia);
				window.removeEventListener("beforeinstallprompt", this.onPrompt);
				this.promptEvent = null;
				this.listeners.clear();
			}
			/** Run the browser's install UI for the pending prompt, then clear it. */
			async install() {
				const prompt = this.promptEvent;
				if (prompt === null) return;
				this.promptEvent = null;
				await prompt.prompt();
				this.setState({ installable: false });
			}
			/** Permanently dismiss install promotion in this browser (localStorage-backed). */
			dismissInstallPromotion() {
				localStorage.setItem(INSTALL_PROMOTION_DISMISSED_KEY, "1");
				this.promptEvent = null;
				this.setState({
					installable: false,
					iosHintVisible: false
				});
			}
			/** Honor the former iOS-only key so existing dismissals stay dismissed. */
			isPromotionDismissed() {
				return localStorage.getItem(INSTALL_PROMOTION_DISMISSED_KEY) === "1" || localStorage.getItem(IOS_HINT_KEY) === "1";
			}
			/** Publish a new snapshot only when something changed. */
			setState(next) {
				const prev = this.state;
				const merged = {
					...prev,
					...next
				};
				if (merged.mobile === prev.mobile && merged.installable === prev.installable && merged.iosHintVisible === prev.iosHintVisible) return;
				this.state = merged;
				for (const listener of this.listeners) listener();
			}
		};
		//#endregion
		//#region \0dsh-css:/home/runner/work/dsh-ui-mobile/dsh-ui-mobile/src/client/InstallBanner.module.css.mjs
		const css$7 = ".VDoJnG_banner{top:calc(env(safe-area-inset-top) + 64px);z-index:2147483647;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);width:min(360px,100vw - 24px);color:var(--dsw-alias-label-primary);-webkit-tap-highlight-color:transparent;border-radius:14px;align-items:center;gap:10px;padding:10px 12px;display:flex;position:fixed;right:12px;box-shadow:0 6px 24px #0000002e}.VDoJnG_copy{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.VDoJnG_copy strong{font-size:14px;font-weight:600;line-height:1.2}.VDoJnG_copy span{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.3}.VDoJnG_action{background:var(--dsw-alias-button-primary-fill);min-height:36px;color:var(--dsw-alias-label-primary-foreground);font:inherit;touch-action:manipulation;cursor:pointer;border:none;border-radius:10px;flex:none;padding:0 16px;font-size:14px;font-weight:600}.VDoJnG_action:active{background:var(--dsw-alias-button-primary-hover)}.VDoJnG_iconButton{width:32px;height:32px;color:var(--dsw-alias-label-secondary);touch-action:manipulation;cursor:pointer;background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;display:inline-flex}.VDoJnG_iconButton:active{background:var(--dsw-alias-interactive-bg-hover)}";
		const tagId$7 = "dsh-ui-mobile/InstallBanner.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$7) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-ui-mobile";
			tag.dataset.pluginCss = tagId$7;
			tag.textContent = css$7;
			document.head.appendChild(tag);
		}
		var InstallBanner_module_css_default = {
			"copy": "VDoJnG_copy",
			"iconButton": "VDoJnG_iconButton",
			"banner": "VDoJnG_banner",
			"action": "VDoJnG_action"
		};
		//#endregion
		//#region src/client/InstallBanner.tsx
		/**
		* PWA install banner: the phone-tier install-promotion surface registered into
		* the frame's `shell.overlay` list slot. Two states, both phone-only:
		* Chrome/Edge Android shows an install CTA while a `beforeinstallprompt` is
		* pending; iOS Safari shows a one-time "add to home screen" hint. Pure
		* presentation — all state arrives through the inject face
		* (snapshot/subscribe + the two actions).
		*/
		/**
		* Render the phone-tier install banner (or nothing).
		* @param props - the inject face.
		* @returns the banner element tree; null on desktop or when nothing is pending.
		*/
		function InstallBanner({ snapshot, subscribe, install, dismissInstallPromotion }) {
			const [state, setState] = (0, react.useState)(() => snapshot());
			(0, react.useEffect)(() => subscribe(() => setState(snapshot())), [subscribe, snapshot]);
			if (!state.mobile || typeof document === "undefined") return null;
			if (state.installable) return (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: InstallBanner_module_css_default.banner,
				role: "region",
				"aria-label": "安装应用",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconDownloadOutlineRegular, {}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: InstallBanner_module_css_default.copy,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "安装到主屏幕" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "安装后可开启任务完成通知" })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: InstallBanner_module_css_default.action,
						onClick: () => {
							install();
						},
						children: "安装"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: InstallBanner_module_css_default.iconButton,
						"aria-label": "关闭提示",
						onClick: dismissInstallPromotion,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutlineRegular, {})
					})
				]
			}), document.body);
			if (state.iosHintVisible) return (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: InstallBanner_module_css_default.banner,
				role: "region",
				"aria-label": "添加到主屏幕",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconDownloadOutlineRegular, {}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: InstallBanner_module_css_default.copy,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "添加到主屏幕" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "点分享按钮 → 添加后可开启任务完成通知" })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: InstallBanner_module_css_default.iconButton,
						"aria-label": "关闭提示",
						onClick: dismissInstallPromotion,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutlineRegular, {})
					})
				]
			}), document.body);
			return null;
		}
		//#endregion
		//#region \0dsh-css:/home/runner/work/dsh-ui-mobile/dsh-ui-mobile/src/client/HeaderMenuButton.module.css.mjs
		const css$6 = ".x8foHq_button{width:36px;height:36px;color:var(--dsw-alias-label-secondary);touch-action:manipulation;cursor:pointer;-webkit-tap-highlight-color:transparent;background:0 0;border:none;border-radius:10px;justify-content:center;align-items:center;margin-left:2px;display:inline-flex}.x8foHq_button:hover{background:var(--dsw-alias-interactive-bg-hover)}.x8foHq_button:active{background:var(--dsw-alias-button-ghost-active-fill)}.x8foHq_button[aria-pressed=true]{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-button-ghost-active-fill)}@media (width>=768px){.x8foHq_button{display:none}}";
		const tagId$6 = "dsh-ui-mobile/HeaderMenuButton.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$6) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-ui-mobile";
			tag.dataset.pluginCss = tagId$6;
			tag.textContent = css$6;
			document.head.appendChild(tag);
		}
		var HeaderMenuButton_module_css_default = { "button": "x8foHq_button" };
		//#endregion
		//#region src/client/HeaderMenuButton.tsx
		/**
		* Header menu button: the phone-tier sidebar toggle registered into the
		* session header's left-of-title strip (`conversation.header.leading`).
		* Icon-only (the label rides aria), hidden on desktop where the sidebar has
		* its own collapse affordances. Pure presentation: state arrives through the
		* inject face (toggle + the frame controller's subscribe/snapshot pair).
		*/
		/**
		* Render the header menu toggle (icon only).
		* @param props - the inject face.
		* @returns the toggle button element.
		*/
		function HeaderMenuButton({ toggleSidebar, subscribe, snapshot }) {
			const [state, setState] = (0, react.useState)(() => snapshot());
			(0, react.useEffect)(() => subscribe(() => setState(snapshot())), [subscribe, snapshot]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: HeaderMenuButton_module_css_default.button,
				"data-dsh-phone-header-menu": true,
				"aria-pressed": state.sidebarOpen,
				"aria-label": "菜单",
				onClick: toggleSidebar,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPanelLeftOutlineRegular, {})
			});
		}
		//#endregion
		//#region \0dsh-css:/home/runner/work/dsh-ui-mobile/dsh-ui-mobile/src/client/NewSessionMenuButton.module.css.mjs
		const css$5 = "body:has(.x8foHq_button) .juySiW_button{display:none}.juySiW_button{top:calc(env(safe-area-inset-top) + 12px);z-index:39;background:var(--dsw-alias-bg-layer-1);width:36px;height:36px;color:var(--dsw-alias-label-secondary);touch-action:manipulation;cursor:pointer;-webkit-tap-highlight-color:transparent;border:none;border-radius:10px;justify-content:center;align-items:center;display:inline-flex;position:fixed;left:12px;box-shadow:0 4px 14px #00000024}.juySiW_button:active,.juySiW_button[aria-pressed=true]{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-button-ghost-active-fill)}";
		const tagId$5 = "dsh-ui-mobile/NewSessionMenuButton.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$5) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-ui-mobile";
			tag.dataset.pluginCss = tagId$5;
			tag.textContent = css$5;
			document.head.appendChild(tag);
		}
		var NewSessionMenuButton_module_css_default = { "button": "juySiW_button" };
		//#endregion
		//#region src/client/NewSessionMenuButton.tsx
		/**
		* Left-top drawer control for the no-session and blank-session hero. The
		* conversation header deliberately hides in those states, so its session
		* slot cannot provide the ordinary mobile menu button.
		*/
		/** Render the menu only while the regular conversation header is absent. */
		function NewSessionMenuButton({ toggleSidebar, subscribe, snapshot, useSessions }) {
			const [state, setState] = (0, react.useState)(() => snapshot());
			const showForBlankSession = useSessions((s) => s.current === void 0 || s.byId[s.current]?.blank === true);
			(0, react.useEffect)(() => subscribe(() => setState(snapshot())), [subscribe, snapshot]);
			if (!state.mobile || !showForBlankSession || typeof document === "undefined") return null;
			return (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: NewSessionMenuButton_module_css_default.button,
				"aria-pressed": state.sidebarOpen,
				"aria-label": "菜单",
				onClick: toggleSidebar,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPanelLeftOutlineRegular, {})
			}), document.body);
		}
		//#endregion
		//#region \0dsh-css:/home/runner/work/dsh-ui-mobile/dsh-ui-mobile/src/client/ConversationNavigator.module.css.mjs
		const css$4 = ".RBaSlq_root{z-index:29;position:fixed;top:50%;left:5px;transform:translateY(-50%)}.RBaSlq_rail{background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 72%, transparent);touch-action:manipulation;cursor:pointer;border:0;border-radius:10px;flex-direction:column;align-items:center;gap:3px;width:16px;max-height:min(52dvh,320px);padding:7px 4px;display:flex;overflow:hidden;box-shadow:0 2px 10px #0000001a}.RBaSlq_tick{background:var(--dsw-alias-label-caption);opacity:.5;border-radius:99px;flex:none;place-items:center;width:6px;height:6px;display:grid}.RBaSlq_tick[data-active]{background:var(--dsw-alias-brand-primary,#3964fe);opacity:1;width:8px;height:8px}.RBaSlq_tickLabel{display:none}.RBaSlq_panel{background:var(--dsw-alias-bg-layer-1);border-radius:12px;flex-direction:column;gap:3px;width:min(72vw,300px);max-height:min(56dvh,360px);padding:7px;display:flex;position:absolute;top:50%;left:22px;overflow-y:auto;transform:translateY(-50%);box-shadow:0 8px 28px #00000038}.RBaSlq_item{width:100%;color:var(--dsw-alias-label-secondary);font:inherit;text-align:left;touch-action:manipulation;background:0 0;border:0;border-radius:8px;align-items:baseline;gap:8px;padding:9px 8px;font-size:13px;line-height:18px;display:flex;overflow:hidden}.RBaSlq_item[data-active],.RBaSlq_item:active{background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-label-primary)}.RBaSlq_number{min-width:16px;color:var(--dsw-alias-label-caption);font-variant-numeric:tabular-nums;flex:none}.RBaSlq_summary{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}@media (prefers-reduced-motion:reduce){.RBaSlq_root{transform:translateY(-50%)}}@media (width>=768px){.RBaSlq_root{display:none}}";
		const tagId$4 = "dsh-ui-mobile/ConversationNavigator.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-ui-mobile";
			tag.dataset.pluginCss = tagId$4;
			tag.textContent = css$4;
			document.head.appendChild(tag);
		}
		var ConversationNavigator_module_css_default = {
			"panel": "RBaSlq_panel",
			"tickLabel": "RBaSlq_tickLabel",
			"number": "RBaSlq_number",
			"tick": "RBaSlq_tick",
			"root": "RBaSlq_root",
			"rail": "RBaSlq_rail",
			"item": "RBaSlq_item",
			"summary": "RBaSlq_summary"
		};
		//#endregion
		//#region src/client/ConversationNavigator.tsx
		/** Phone-only user-message outline: a compact rail that expands into summaries. */
		function ConversationNavigator({ navigator, frame }) {
			const [navState, setNavState] = (0, react.useState)(() => navigator.snapshot());
			const [frameState, setFrameState] = (0, react.useState)(() => frame.snapshot());
			const [expanded, setExpanded] = (0, react.useState)(false);
			(0, react.useEffect)(() => navigator.subscribe(() => setNavState(navigator.snapshot())), [navigator]);
			(0, react.useEffect)(() => frame.subscribe(() => setFrameState(frame.snapshot())), [frame]);
			(0, react.useEffect)(() => {
				if (frameState.sidebarOpen) setExpanded(false);
			}, [frameState.sidebarOpen]);
			if (!frameState.mobile || frameState.sidebarOpen || !navState.awayFromBottom || navState.waypoints.length < 2 || typeof document === "undefined") return null;
			const jump = (key) => {
				navigator.jumpTo(key);
				setExpanded(false);
			};
			return (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("aside", {
				className: ConversationNavigator_module_css_default.root,
				"aria-label": "会话导览",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: ConversationNavigator_module_css_default.rail,
					"aria-expanded": expanded,
					"aria-label": expanded ? "收起会话导览" : `展开会话导览，共 ${navState.waypoints.length} 条消息`,
					onClick: () => setExpanded((value) => !value),
					children: navState.waypoints.map((waypoint, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: ConversationNavigator_module_css_default.tick,
						"data-active": waypoint.key === navState.activeKey || void 0,
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: ConversationNavigator_module_css_default.tickLabel,
							children: index + 1
						})
					}, waypoint.key))
				}), expanded && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
					className: ConversationNavigator_module_css_default.panel,
					"aria-label": "用户消息列表",
					children: navState.waypoints.map((waypoint, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: ConversationNavigator_module_css_default.item,
						"data-active": waypoint.key === navState.activeKey || void 0,
						"aria-current": waypoint.key === navState.activeKey ? "true" : void 0,
						onClick: () => jump(waypoint.key),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: ConversationNavigator_module_css_default.number,
							children: index + 1
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: ConversationNavigator_module_css_default.summary,
							children: waypoint.summary
						})]
					}, waypoint.key))
				})]
			}), document.body);
		}
		//#endregion
		//#region \0dsh-css:/home/runner/work/dsh-ui-mobile/dsh-ui-mobile/src/client/DrawerScrim.module.css.mjs
		const css$2 = ".gLgNoW_scrim{z-index:35;touch-action:none;cursor:pointer;background:#00000073;border:none;padding:0;position:fixed;inset:0}";
		const tagId$2 = "dsh-ui-mobile/DrawerScrim.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-ui-mobile";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var DrawerScrim_module_css_default = { "scrim": "gLgNoW_scrim" };
		//#endregion
		//#region src/client/DrawerScrim.tsx
		/**
		* Drawer scrim: the tap-outside-to-close layer for the open sidebar drawer,
		* registered into the frame's `shell.overlay` list slot. Rendered only at
		* phone tier while the sidebar is expanded; tapping it collapses the drawer.
		* Pure presentation — state arrives through the inject face.
		*/
		/**
		* Render the drawer scrim (or nothing).
		* @param props - the inject face.
		* @returns the scrim element while the sidebar is open on phones; null otherwise.
		*/
		function DrawerScrim({ toggleSidebar, subscribe, snapshot }) {
			const [state, setState] = (0, react.useState)(() => snapshot());
			(0, react.useEffect)(() => subscribe(() => setState(snapshot())), [subscribe, snapshot]);
			if (!state.mobile || (!state.sidebarOpen && !state.detailsOpen)) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: DrawerScrim_module_css_default.scrim,
				"aria-label": "关闭面板",
				onClick: toggleSidebar
			});
		}
		//#endregion
		//#region src/client/sw.ts
		/**
		* Service worker registration for the app-shell cache.
		*
		* Best-effort by design: registration happens after `load` so it never blocks
		* first paint, and any failure (no secure context, unsupported browser, a
		* backend that cannot serve /sw.js) is swallowed — the UI has no dependency on
		* the cache working. A successful registration makes repeat home-screen
		* launches near-instant by serving the hashed assets from cache.
		*/
		function registerServiceWorker() {
			if (typeof navigator === "undefined") return;
			if (!("serviceWorker" in navigator)) return;
			window.addEventListener("load", () => {
				navigator.serviceWorker.register("/sw.js").catch(() => {});
			});
		}
		//#endregion
		//#region src/client/command-focus.ts
		/**
		* Command-panel keyboard guard: a plugin-level patch that stops the command
		* select panel (`PopupSelectView` in ui-commands) from popping the on-screen
		* keyboard when it opens on phones.
		*
		* The panel auto-focuses its search input via script (`searchRef.focus()`),
		* which opens the keyboard the moment the panel appears — a poor mobile
		* experience. The upstream fix belongs in ui-commands; this guard makes any
		* deployment that installs this plugin behave correctly even before that
		* fix lands, by blurring script-driven focus into the panel's search field.
		*
		* Signals: a script `.focus()` produces a `focusin` event with
		* `isTrusted === false` (user taps are trusted), and the panel's search
		* input is an `<input>` inside the composer card (`[data-composer-card]`) —
		* the main composer is a `<textarea>` and is never touched. Phone tier only:
		* desktop keeps the open-and-type combobox behavior. jsdom has no
		* matchMedia, so tests and non-phone environments install nothing.
		*/
		const MOBILE_QUERY = "(max-width: 767px), (max-width: 980px) and (max-height: 520px) and (pointer: coarse)";
		/** The composer card wrapper that hosts the command panel's search input. */
		const COMPOSER_CARD = "[data-composer-card]";
		/**
		* Decide whether a focus event is the command panel's script-driven search
		* focus (blur it) rather than a user tap or another field. Pure, so the
		* trusted/untargeted branches are directly testable.
		*/
		function shouldSuppressCommandFocus(event) {
			if (event.isTrusted) return false;
			const target = event.target;
			if (!(target instanceof HTMLElement)) return false;
			if (target.tagName !== "INPUT") return false;
			return target.closest(COMPOSER_CARD) !== null;
		}
		/**
		* Install the guard while the viewport is at phone tier.
		* @returns disposer removing the listener (no-op outside the phone tier).
		*/
		function suppressCommandPanelScriptFocus() {
			if (typeof window.matchMedia !== "function") return () => {};
			if (!window.matchMedia(MOBILE_QUERY).matches) return () => {};
			const onFocusIn = (event) => {
				if (!shouldSuppressCommandFocus(event)) return;
				event.target.blur();
			};
			document.addEventListener("focusin", onFocusIn, true);
			return () => document.removeEventListener("focusin", onFocusIn, true);
		}
		//#endregion
		//#region src/client/mobile-enter-send.ts
		/**
		* Mobile keyboard action hint for the resident conversation textarea. The
		* host already treats ordinary Enter as submit; this plugin patch changes the
		* iOS/Android keyboard affordance from a newline to "Send" without taking
		* over the host's IME, queue, or duplicate-send safeguards.
		*/
		const COMPOSER_TEXTAREA = "textarea[data-phase]";
		/** Mark a composer textarea so virtual keyboards advertise the send action. */
		function markMobileComposerSendAction(node) {
			if (!(node instanceof HTMLTextAreaElement) || !node.matches(COMPOSER_TEXTAREA)) return;
			node.setAttribute("enterkeyhint", "send");
			node.enterKeyHint = "send";
		}
		/** Install the phone-only keyboard-action presenter. */
		function enableMobileEnterSend() {
			if (typeof window.matchMedia !== "function" || !window.matchMedia("(max-width: 767px), (max-width: 980px) and (max-height: 520px) and (pointer: coarse)").matches) return () => {};
			for (const textarea of document.querySelectorAll(COMPOSER_TEXTAREA)) markMobileComposerSendAction(textarea);
			const observer = new MutationObserver((records) => {
				for (const record of records) for (const node of record.addedNodes) if (node instanceof HTMLTextAreaElement) markMobileComposerSendAction(node);
				else if (node instanceof Element) for (const textarea of node.querySelectorAll(COMPOSER_TEXTAREA)) markMobileComposerSendAction(textarea);
			});
			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
			return () => observer.disconnect();
		}
		//#endregion
		//#region src/client/page-zoom-lock.ts
		/**
		* Prevent browser-level pinch zoom on phone-sized viewports. The injected
		* viewport tag handles the initial page; these event guards cover WebKit's
		* gesture events and browsers that still allow a multi-touch gesture.
		*/
		function lockMobilePageZoom() {
			const isPhone = () => window.matchMedia(MOBILE_QUERY$2).matches;
			const preventGesture = (event) => {
				if (isPhone()) event.preventDefault();
			};
			const preventPinch = (event) => {
				if (isPhone() && event.touches.length > 1) event.preventDefault();
			};
			document.addEventListener("gesturestart", preventGesture, { passive: false });
			document.addEventListener("gesturechange", preventGesture, { passive: false });
			document.addEventListener("gestureend", preventGesture, { passive: false });
			document.addEventListener("touchmove", preventPinch, { passive: false });
			return () => {
				document.removeEventListener("gesturestart", preventGesture);
				document.removeEventListener("gesturechange", preventGesture);
				document.removeEventListener("gestureend", preventGesture);
				document.removeEventListener("touchmove", preventPinch);
			};
		}
		//#endregion
		//#region src/client/push.ts
		/** Browser-side VAPID subscription and notification-click router. */
		var PushController = class {
			openSession;
			state = {
				available: false,
				enabled: false,
				permission: "default",
				subscribed: false,
				installed: false
			};
			listeners = /* @__PURE__ */ new Set();
			onMessage = (event) => {
				const data = event.data;
				if (typeof data !== "object" || data === null || !("type" in data) || data.type !== "dsh-push-open") return;
				const sessionId = data.sessionId;
				if (typeof sessionId === "string") this.openSession(sessionId);
			};
			constructor(openSession) {
				this.openSession = openSession;
			}
			snapshot() {
				return this.state;
			}
			subscribe(listener) {
				this.listeners.add(listener);
				return () => this.listeners.delete(listener);
			}
			async start() {
				const installed = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
				if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
					this.setState({ installed });
					return;
				}
				navigator.serviceWorker.addEventListener("message", this.onMessage);
				try {
					const enabled = (await (await fetch("/pwa/push/config")).json()).enabled === true;
					const registration = enabled ? await navigator.serviceWorker.ready : void 0;
					const subscription = registration === void 0 ? null : await registration.pushManager.getSubscription();
					if (subscription !== null) await fetch("/pwa/push/subscription", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify(subscription)
					});
					const subscribed = subscription !== null;
					this.setState({
						available: true,
						enabled,
						permission: Notification.permission,
						subscribed,
						installed
					});
				} catch {
					this.setState({
						available: true,
						permission: Notification.permission,
						installed
					});
				}
			}
			stop() {
				navigator.serviceWorker?.removeEventListener("message", this.onMessage);
				this.listeners.clear();
			}
			async enable() {
				if (!this.state.enabled || Notification.permission === "denied") return;
				const permission = await Notification.requestPermission();
				this.setState({ permission });
				if (permission !== "granted") return;
				const config = await (await fetch("/pwa/push/config")).json();
				if (typeof config.publicKey !== "string") return;
				const registration = await navigator.serviceWorker.ready;
				const subscription = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: base64Url(config.publicKey)
				});
				const response = await fetch("/pwa/push/subscription", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(subscription)
				});
				if (!response.ok) throw new Error(`Push subscription failed: ${response.status}`);
				this.setState({
					permission: "granted",
					subscribed: true
				});
			}
			setState(next) {
				const merged = {
					...this.state,
					...next
				};
				if (merged.available === this.state.available && merged.enabled === this.state.enabled && merged.permission === this.state.permission && merged.subscribed === this.state.subscribed && merged.installed === this.state.installed) return;
				this.state = merged;
				for (const listener of this.listeners) listener();
			}
		};
		function base64Url(value) {
			const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
			return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
		}
		//#endregion
		//#region \0dsh-css:/home/runner/work/dsh-ui-mobile/dsh-ui-mobile/src/client/PushPrompt.module.css.mjs
		const css$1 = ".GIupFq_button{right:12px;top:calc(env(safe-area-inset-top) + 12px);z-index:2147483647;border:1px solid var(--dsw-alias-border-primary);color:#fff;min-height:40px;font:inherit;cursor:pointer;background:#151517;border-radius:10px;padding:0 14px;position:fixed}.GIupFq_button:active{background:#000}.GIupFq_notice{right:12px;top:calc(env(safe-area-inset-top) + 12px);z-index:2147483647;color:#fff;max-width:min(280px,100vw - 32px);font:inherit;background:#151517;border:1px solid #ffb020;border-radius:10px;padding:9px 12px;line-height:1.35;position:fixed}";
		const tagId$1 = "dsh-ui-mobile/PushPrompt.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-ui-mobile";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var PushPrompt_module_css_default = {
			"button": "GIupFq_button",
			"notice": "GIupFq_notice"
		};
		//#endregion
		//#region src/client/PushPrompt.tsx
		/** Explicit user-gesture entry for the browser notification permission prompt. */
		function PushPrompt({ push }) {
			const [state, setState] = (0, react.useState)(() => push.snapshot());
			(0, react.useEffect)(() => push.subscribe(() => setState(push.snapshot())), [push]);
			if (state.subscribed || !state.installed || typeof document === "undefined") return null;
			let content;
			if (!state.available) content = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("output", {
				className: PushPrompt_module_css_default.notice,
				children: "当前 iOS Web App 不支持通知"
			});
			else if (!state.enabled) content = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("output", {
				className: PushPrompt_module_css_default.notice,
				children: "通知服务正在连接，请稍候刷新"
			});
			else if (state.permission === "denied") content = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("output", {
				className: PushPrompt_module_css_default.notice,
				children: "通知已被系统关闭，请在设置中允许"
			});
			else content = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: PushPrompt_module_css_default.button,
				onClick: () => {
					push.enable();
				},
				children: state.permission === "granted" ? "启用任务完成通知" : "开启任务完成通知"
			});
			return (0, react_dom.createPortal)(content, document.body);
		}
		//#endregion
		//#region src/client/conversation-navigator.ts
		const USER_MESSAGE_SELECTOR = "[data-chat-flow-kind=\"user\"][data-chat-anchor-key]";
		const SCROLL_SELECTOR = "[data-conversation-scroll]";
		const SUMMARY_LIMIT = 48;
		const BOTTOM_THRESHOLD = 24;
		function isAwayFromBottom(scrollport) {
			return scrollport !== null && scrollport.scrollHeight - scrollport.scrollTop - scrollport.clientHeight > BOTTOM_THRESHOLD;
		}
		function summarize(text) {
			const compact = text.replace(/\s+/g, " ").trim();
			if (compact.length <= SUMMARY_LIMIT) return compact || "未命名消息";
			return `${compact.slice(0, 47)}…`;
		}
		/** Collect only ordinary turn-opening user messages; steering messages stay out. */
		function collectConversationWaypoints(root = document) {
			return [...root.querySelectorAll(USER_MESSAGE_SELECTOR)].flatMap((element) => {
				const key = element.dataset.chatAnchorKey;
				if (key === void 0 || key === "") return [];
				return [{
					key,
					summary: summarize(element.textContent ?? ""),
					element
				}];
			});
		}
		/** Pick the last waypoint that has reached the reading line in the scrollport. */
		function activeConversationWaypoint(waypoints, scrollport) {
			if (waypoints.length === 0) return null;
			if (scrollport === null) return waypoints[0].key;
			const readingLine = scrollport.getBoundingClientRect().top + Math.min(120, scrollport.clientHeight * .28);
			let active = waypoints[0].key;
			for (const waypoint of waypoints) if (waypoint.element.getBoundingClientRect().top <= readingLine) active = waypoint.key;
			else break;
			return active;
		}
		/**
		* Observes the host transcript without relying on its CSS-module class names.
		* It tracks the stable chat node attributes and exposes a small reactive
		* snapshot for the overlay UI.
		*/
		var ConversationNavigatorController = class {
			listeners = /* @__PURE__ */ new Set();
			mutationObserver = null;
			scrollport = null;
			state = {
				waypoints: [],
				activeKey: null,
				awayFromBottom: false
			};
			onMutation = () => {
				this.refresh();
			};
			onScroll = () => {
				this.refreshActive();
			};
			snapshot() {
				return this.state;
			}
			subscribe(listener) {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			}
			start() {
				this.mutationObserver = new MutationObserver(this.onMutation);
				this.mutationObserver.observe(document.body, {
					childList: true,
					subtree: true,
					characterData: true
				});
				window.addEventListener("resize", this.onScroll);
				this.refresh();
			}
			stop() {
				this.mutationObserver?.disconnect();
				this.mutationObserver = null;
				this.scrollport?.removeEventListener("scroll", this.onScroll);
				this.scrollport = null;
				window.removeEventListener("resize", this.onScroll);
				this.listeners.clear();
			}
			refresh() {
				const nextScrollport = document.querySelector(SCROLL_SELECTOR);
				if (nextScrollport !== this.scrollport) {
					this.scrollport?.removeEventListener("scroll", this.onScroll);
					this.scrollport = nextScrollport;
					this.scrollport?.addEventListener("scroll", this.onScroll, { passive: true });
				}
				const waypoints = collectConversationWaypoints();
				const activeKey = activeConversationWaypoint(waypoints, this.scrollport);
				this.setState({
					waypoints,
					activeKey,
					awayFromBottom: isAwayFromBottom(this.scrollport)
				});
			}
			refreshActive() {
				const activeKey = activeConversationWaypoint(this.state.waypoints, this.scrollport);
				const awayFromBottom = isAwayFromBottom(this.scrollport);
				if (activeKey !== this.state.activeKey || awayFromBottom !== this.state.awayFromBottom) this.setState({
					...this.state,
					activeKey,
					awayFromBottom
				});
			}
			jumpTo(key) {
				const target = this.state.waypoints.find((waypoint) => waypoint.key === key)?.element;
				if (target === void 0) return;
				const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
				target.scrollIntoView({
					behavior: reducedMotion ? "auto" : "smooth",
					block: "start"
				});
			}
			setState(next) {
				if (next.activeKey === this.state.activeKey && next.awayFromBottom === this.state.awayFromBottom && next.waypoints.length === this.state.waypoints.length && next.waypoints.every((waypoint, index) => waypoint.key === this.state.waypoints[index]?.key && waypoint.summary === this.state.waypoints[index]?.summary)) return;
				this.state = next;
				for (const listener of this.listeners) listener();
			}
		};
		//#endregion
		//#region \0dsh-css:/home/runner/work/dsh-ui-mobile/dsh-ui-mobile/src/client/mobile.module.css.mjs
		const css = "html[data-dsh-phone] {\n  --dsh-phone-height: 100dvh;\n  --dsh-phone-gutter: clamp(8px, 3vw, 16px);\n  --dsh-phone-safe-bottom: max(8px, env(safe-area-inset-bottom, 0px));\n  --dsh-phone-sidebar-width: min(calc(280px + env(safe-area-inset-left, 0px)),\n    calc(100% - 44px - env(safe-area-inset-right, 0px)));\n}\n\nhtml[data-dsh-phone],\nhtml[data-dsh-phone] body {\n  margin: 0;\n  height: 100%;\n  overflow: hidden;\n  overscroll-behavior: none;\n}\n\n/* Fill the layout viewport, which the keyboard does not resize. WebKit pans\n   the visual viewport over it to reveal the composer and pans back on\n   dismissal, together with the keyboard. */\nhtml[data-dsh-phone] #root {\n  position: fixed;\n  inset: 0;\n  overflow: hidden;\n}\n\nhtml[data-dsh-phone] [data-mobile-frame] {\n  grid-template-columns: minmax(0, 1fr) !important;\n  height: 100%;\n}\n\nhtml[data-dsh-phone] [data-mobile-frame] > [data-side],\nhtml[data-dsh-phone] [data-mobile-frame] > [data-sidebar-mask],\nhtml[data-dsh-phone] .juySiW_button {\n  display: none;\n}\n\nhtml[data-dsh-phone] [data-mobile-role=center] {\n  box-sizing: border-box;\n  min-width: 0;\n  min-height: 0;\n  padding-inline: env(safe-area-inset-left, 0px) env(safe-area-inset-right, 0px);\n  /* The host animates the drawer with these tokens (300ms, ease-in-out), and\n     its rule outranks ours. Follow the same tokens so the page edge stays on\n     the drawer edge for the whole motion, opening and closing. */\n  transition: translate var(--ds-transition-duration-slow, .3s) var(--ds-ease-in-out, cubic-bezier(.4, 0, .2, 1));\n}\nhtml[data-dsh-phone] [data-mobile-role=center] > * {\n  transition: opacity var(--ds-transition-duration-slow, .3s) var(--ds-ease-in-out, cubic-bezier(.4, 0, .2, 1));\n}\n/* The host sets data-sidebar-instant when the drawer must jump, for example\n   on the first render; the page jumps with it. */\nhtml[data-dsh-phone] [data-sidebar-instant] > [data-mobile-role=center],\nhtml[data-dsh-phone] [data-sidebar-instant] > [data-mobile-role=center] > * {\n  transition: none;\n}\n\n/* Keep the page at its original width and slide it beside the drawer. The\n   page and drawer share the body color, which the host also gives the status\n   bar, so the top reads as one surface. The drawer's shadow and the faded page\n   mark the edge instead of a rule and rounded corners. */\nhtml[data-dsh-phone] [data-mobile-frame]:not([data-sidebar-collapsed]) > [data-mobile-role=center] {\n  translate: var(--dsh-phone-sidebar-width) 0;\n  overflow: clip;\n  background: var(--dsw-alias-bg-base, Canvas);\n  cursor: pointer;\n}\nhtml[data-dsh-phone] [data-mobile-frame]:not([data-sidebar-collapsed]) > [data-mobile-role=center] > * {\n  pointer-events: none;\n  opacity: .55;\n}\n/* The drawer has the host's own collapse button. A second, faded opener on\n   the page right beside it only doubles the control; a tap anywhere on the\n   page still closes the drawer. */\nhtml[data-dsh-phone] [data-mobile-frame]:not([data-sidebar-collapsed]) [data-dsh-phone-header-menu] {\n  visibility: hidden;\n}\n\n/* On newer hosts the native center defaults to grid column 2. The phone\n   shell has just one content column; do not let an implicit rail offset it. */\nhtml[data-dsh-phone] [data-mobile-frame]:has(> [data-sidebar-mask]) > [data-mobile-role=center] {\n  grid-column: 1 / -1;\n}\n\nhtml[data-dsh-phone] [data-mobile-frame][data-dsh-phone-global-page] [data-mobile-role=center] {\n  padding-block-start: calc(48px + env(safe-area-inset-top, 0px));\n}\n\nhtml[data-dsh-phone] [data-dsh-phone-nav] {\n  position: absolute;\n  inset-block-start: env(safe-area-inset-top, 0px);\n  inset-inline-start: max(6px, env(safe-area-inset-left, 0px));\n  z-index: 34;\n  display: grid;\n  place-items: center;\n  width: 44px;\n  height: 44px;\n  border: 0;\n  border-radius: 10px;\n  background: transparent;\n  color: var(--dsw-alias-label-primary);\n  touch-action: manipulation;\n}\n\nhtml[data-dsh-phone] [data-dsh-phone-nav][hidden] { display: none; }\nhtml[data-dsh-phone] [data-conversation-header-leading] [data-dsh-phone-header-menu],\nhtml[data-dsh-phone] [data-conversation-header-corner] [data-sidebar-right-expand] {\n  display: inline-grid;\n  place-items: center;\n  width: 44px;\n  height: 44px;\n  min-width: 44px;\n  min-height: 44px;\n  padding: 0;\n}\n\n/* The empty conversation header uses unequal native desktop gutters. */\nhtml[data-dsh-phone] [class*=\"_headerBlank\"]:has(> [data-conversation-header-leading]):has([data-sidebar-right-expand]) {\n  --dsh-phone-toggle-edge: 14px;\n  position: relative;\n  min-height: 54px;\n}\nhtml[data-dsh-phone] [class*=\"_headerBlank\"] :is(\n  [data-conversation-header-leading] [data-dsh-phone-header-menu],\n  [data-conversation-header-corner] [data-sidebar-right-expand]\n) {\n  position: absolute;\n  inset-block-start: 10px;\n  margin: 0;\n}\nhtml[data-dsh-phone] [class*=\"_headerBlank\"] [data-conversation-header-leading] [data-dsh-phone-header-menu] {\n  left: var(--dsh-phone-toggle-edge, 14px);\n}\nhtml[data-dsh-phone] [class*=\"_headerBlank\"] [data-conversation-header-corner] [data-sidebar-right-expand] {\n  right: var(--dsh-phone-toggle-edge, 14px);\n}\n/* Newer hosts render a second opener outside the conversation header. */\nhtml[data-dsh-phone] [data-mobile-frame]:has(\n  > [data-mobile-role=center] [data-dsh-phone-header-menu],\n  > [data-dsh-phone-nav]:not([hidden])\n)\n  > [data-shell-leading] [data-sidebar-opener] {\n  display: none;\n}\n\n/* Better Sidebar uses a floating fallback when the blank header has no toolbar. */\nhtml[data-dsh-phone] [data-slot=\"conversation.session.header.utilities\"] [data-dsh-bottom-toggle],\nhtml[data-dsh-phone] [data-dsh-dock-fallback] {\n  display: none;\n}\n\nhtml[data-dsh-phone] :is(\n  [data-conversation-header-leading] [data-dsh-phone-header-menu],\n  [data-conversation-header-corner] [data-sidebar-right-expand]\n) > svg {\n  width: 16px;\n  height: 16px;\n}\n\nhtml[data-dsh-phone] [data-mobile-role=sidebar],\nhtml[data-dsh-phone] [data-mobile-role=details] {\n  position: absolute !important;\n  inset-block: 0;\n  z-index: 40;\n  box-sizing: border-box;\n  width: min(340px, calc(100% - 44px));\n  min-width: 0;\n  max-height: 100%;\n  background: var(--dsw-alias-bg-layer-1);\n  box-shadow: 0 0 24px #0004;\n  /* Same tokens as the page above. Newer hosts drive the left drawer with\n     their own rule using these tokens; 0.2.1-rc.5 has none and uses this. */\n  transition: transform var(--ds-transition-duration-slow, .3s) var(--ds-ease-in-out, cubic-bezier(.4, 0, .2, 1));\n}\n\nhtml[data-dsh-phone] [data-mobile-role=sidebar] {\n  left: 0 !important;\n  right: auto !important;\n  width: var(--dsh-phone-sidebar-width) !important;\n  min-width: 0 !important;\n  max-width: 100% !important;\n  padding-inline-start: env(safe-area-inset-left, 0px);\n  z-index: 42;\n  /* The host's sidebar panel and its sticky headers paint this fill. */\n  --dsw-specific-sidebar-fill: var(--dsw-alias-bg-base, Canvas);\n  background: var(--dsw-alias-bg-base, Canvas);\n  border-inline-end: 0;\n  box-shadow: 10px 0 28px -16px rgb(0 0 0 / 55%);\n  overflow-x: clip;\n}\n\nhtml[data-dsh-phone] [data-mobile-frame]:not([data-sidebar-collapsed]) > [data-shell-leading],\nhtml[data-dsh-phone] [data-mobile-frame]:not([data-sidebar-collapsed]) > [data-dsh-phone-nav] {\n  visibility: hidden;\n}\nhtml[data-dsh-phone] [data-mobile-frame]:not([data-sidebar-collapsed]) .gLgNoW_scrim {\n  display: none;\n}\n\n/* The host uses a desktop settings rail even when the app viewport is narrow. */\nhtml[data-dsh-phone] [data-shortcut-modal=\"settings\"] {\n  --dsh-phone-settings-font: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;\n  --dsh-phone-settings-text: 16px;\n  --dsh-phone-settings-note: 14px;\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  width: min(520px, calc(100% - 16px));\n  max-height: calc(var(--dsh-phone-height) - 16px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));\n  overflow: hidden;\n  font-family: var(--dsh-phone-settings-font);\n  font-size: var(--dsh-phone-settings-text);\n  line-height: 1.375;\n}\nhtml[data-dsh-phone] [data-shortcut-modal=\"settings\"] :is(\n  button, :where(input:not([type=checkbox], [type=radio])), select, textarea, label, legend, summary,\n  [class$=\"_navLabel\"], [class$=\"_title\"], [class$=\"_settingTitle\"], [class$=\"_fieldLabel\"],\n  [class$=\"_cardTitle\"], [class$=\"_rowLabel\"], [class$=\"_rowValue\"], [class$=\"_value\"],\n  [class$=\"_unit\"], [class$=\"_statusText\"]\n) {\n  font-family: var(--dsh-phone-settings-font);\n  font-size: var(--dsh-phone-settings-text);\n  line-height: 1.375;\n}\nhtml[data-dsh-phone] [data-shortcut-modal=\"settings\"] :is(\n  [class$=\"_desc\"], [class$=\"_description\"], [class$=\"_settingDescription\"], [class$=\"_subtitle\"],\n  [class$=\"_hint\"], [class$=\"_fieldHint\"], [class$=\"_message\"], [class$=\"_error\"]\n) {\n  font-family: var(--dsh-phone-settings-font);\n  font-size: var(--dsh-phone-settings-note);\n  line-height: 1.43;\n}\nhtml[data-dsh-phone] [data-shortcut-modal=\"settings\"] :is(h1, h2, [class$=\"_navTitle\"]) {\n  font-family: var(--dsh-phone-settings-font);\n  font-size: 20px;\n  line-height: 1.3;\n}\nhtml[data-dsh-phone] [data-shortcut-modal=\"settings\"] > nav {\n  flex: 0 0 auto;\n  width: 100%;\n  padding: 12px 12px 0;\n  border: 0;\n  border-bottom: 1px solid color-mix(in srgb, currentColor 12%, transparent);\n}\nhtml[data-dsh-phone] [data-shortcut-modal=\"settings\"] > nav > [class*=\"_navTitle\"] {\n  min-height: 44px;\n  padding: 10px 0 0;\n  margin: 0;\n}\nhtml[data-dsh-phone] [data-shortcut-modal=\"settings\"] > nav > [class*=\"_navList\"] {\n  flex-direction: row;\n  align-items: center;\n  gap: 5px;\n  width: 100%;\n  padding: 4px 0 8px;\n  overflow-x: auto;\n  overflow-y: hidden;\n  scrollbar-width: thin;\n}\nhtml[data-dsh-phone] [data-shortcut-modal=\"settings\"] > nav > [class*=\"_navList\"] > button {\n  flex: 0 0 auto;\n  width: auto;\n  min-width: 0;\n  min-height: 44px;\n  padding: 0 10px;\n  white-space: nowrap;\n}\nhtml[data-dsh-phone] [data-shortcut-modal=\"settings\"] > nav button [class*=\"_navLabel\"] {\n  overflow: visible;\n}\nhtml[data-dsh-phone] [data-shortcut-modal=\"settings\"] > div:has(> [class$=\"_options\"]) {\n  flex: 1 1 auto;\n  min-width: 0;\n  min-height: 0;\n  width: 100%;\n  overflow: hidden;\n}\nhtml[data-dsh-phone] [data-shortcut-modal=\"settings\"] [class$=\"_header\"]:has(> [class$=\"_close\"]) {\n  position: absolute;\n  inset: 12px 12px auto auto;\n  width: auto;\n  height: 44px;\n  min-height: 44px;\n  padding: 0;\n  gap: 4px;\n}\nhtml[data-dsh-phone] [data-shortcut-modal=\"settings\"] [class$=\"_header\"] > button[class$=\"_close\"] {\n  width: 44px;\n  height: 44px;\n}\nhtml[data-dsh-phone] [data-shortcut-modal=\"settings\"] [data-slot=\"settings.action\"] button {\n  max-width: min(50vw, 200px);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\nhtml[data-dsh-phone] [data-shortcut-modal=\"settings\"] [class$=\"_options\"]:has(> [data-slot=\"settings.section\"]) {\n  flex: 1 1 auto;\n  min-width: 0;\n  min-height: 0;\n  overflow-y: auto;\n  overflow-x: hidden;\n  overscroll-behavior: contain;\n  scrollbar-gutter: auto;\n}\nhtml[data-dsh-phone] [data-shortcut-modal=\"settings\"] ._8HJdBW_cubeRow {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 8px;\n}\nhtml[data-dsh-phone] [data-shortcut-modal=\"settings\"] ._8HJdBW_cubeRow > button {\n  min-width: 0;\n  width: 100%;\n  min-height: 64px;\n  padding: 8px 2px;\n}\nhtml[data-dsh-phone] [data-shortcut-modal=\"settings\"] [data-slot=\"settings.section\"] > [class$=\"_section\"] {\n  padding-inline: clamp(12px, 4vw, 20px);\n}\nhtml[data-dsh-phone] [data-shortcut-modal=\"settings\"] [data-slot=\"settings.general.item\"] > [class$=\"_row\"] {\n  flex-wrap: wrap;\n  gap: 8px;\n}\nhtml[data-dsh-phone] [data-mobile-role=details] {\n  right: 0;\n  width: min(480px, calc(100% - 44px));\n  padding-inline-end: env(safe-area-inset-right, 0px);\n}\nhtml[data-dsh-phone] [data-rightbar-fullscreen] > [data-mobile-role=details] {\n  width: 100%;\n}\nhtml[data-dsh-phone] :is([data-mobile-role=sidebar], [data-mobile-role=details]) > * {\n  max-width: 100%;\n  width: 100% !important;\n  min-width: 0;\n}\nhtml[data-dsh-phone] [data-sidebar-collapsed] > [data-mobile-role=sidebar] {\n  transform: translateX(-100%);\n  visibility: hidden;\n  pointer-events: none;\n}\nhtml[data-dsh-phone] [data-rightbar-collapsed]:not([data-rightbar-fullscreen]) > [data-mobile-role=details] {\n  transform: translateX(100%);\n  visibility: hidden;\n  pointer-events: none;\n}\nhtml[data-dsh-phone] .gLgNoW_scrim {\n  position: absolute;\n  inset: 0;\n  height: 100%;\n  background: rgb(0 0 0 / 42%);\n}\n\n/* The native fullscreen dock already slides its own content and reports its\n   open state after that animation. Do not hide or slide its outer column\n   during that time. The native dock controls visibility and hit testing. */\nhtml[data-dsh-phone] [data-mobile-frame] > [data-mobile-role=details]:has(\n  [data-sidebar-right-session]:not([hidden]) [data-sidebar-right-panel=fullscreen]\n) {\n  width: 100%;\n  transform: none;\n  visibility: visible;\n  pointer-events: none;\n  transition: none;\n  background: transparent;\n  box-shadow: none;\n}\n\nhtml[data-dsh-phone] [data-mobile-frame]:has(\n  > [data-mobile-role=details] [data-sidebar-right-session]:not([hidden]) [data-sidebar-right-panel=fullscreen]\n) .gLgNoW_scrim {\n  display: none;\n}\n\nhtml[data-dsh-phone] [data-conversation-content] {\n  --dsh-chat-content-width: calc(100% - 2 * var(--dsh-phone-gutter));\n  --dsh-composer-card-max-width: 100%;\n  --dsh-composer-side-clearance: var(--dsh-phone-gutter);\n  min-width: 0;\n}\nhtml[data-dsh-phone] [data-conversation-scroll] {\n  box-sizing: border-box;\n  min-width: 0;\n  margin-inline: 0;\n  padding-bottom: 0;\n  scrollbar-gutter: auto;\n  overflow-x: hidden;\n  overscroll-behavior-y: contain;\n}\nhtml[data-dsh-phone] [data-content-phase=hero] > [data-conversation-scroll] {\n  justify-content: safe center;\n}\n\n/* The host scrolls the composer seat with the transcript or sticks it at the\n   bottom. Leave that relationship intact as the visual viewport changes. */\nhtml[data-dsh-phone] [data-composer-seat] {\n  --dsh-composer-text-max-height: clamp(48px, calc(var(--dsh-phone-height) * .25), 160px);\n  box-sizing: border-box;\n  padding-block-end: var(--dsh-phone-safe-bottom);\n  min-width: 0;\n}\nhtml[data-dsh-phone] .wSkVaW_composerHero { padding-block-end: 8px; }\nhtml[data-dsh-phone] .wSkVaW_heroWorkspaceRow {\n  flex-wrap: wrap;\n  padding-inline: var(--dsh-phone-gutter);\n  row-gap: 4px;\n}\nhtml[data-dsh-phone] [data-composer-card] {\n  min-width: 0;\n  max-width: 100%;\n}\nhtml[data-dsh-phone] :is([contenteditable], input:not([type=checkbox]):not([type=radio]), textarea, select) {\n  font-size: max(16px, 1em);\n}\n/* Safari decides whether to zoom from the editable element's font size.\n   DSH's editor is a Lexical div, so an input/textarea rule misses it. */\nhtml[data-dsh-phone] [data-composer-card] [contenteditable=\"true\"] {\n  font-size: 16px !important;\n  line-height: 1.45;\n  overflow-wrap: anywhere;\n}\nhtml[data-dsh-phone] [data-composer-toolbar] {\n  flex-wrap: wrap;\n  gap: 4px;\n}\n/* The host caps the model picker at 45% of the composer, which cuts a full\n   model name short on a phone while the toolbar has room. It still shrinks\n   with an ellipsis when the row is full. */\nhtml[data-dsh-phone] [data-composer-card] button:has(> [class$=\"_triggerLabel\"]) {\n  max-width: none;\n}\n\n/* Session readings below the composer: a status bar of their own, one equal\n   cell per reading with its value over a muted description, so nothing is\n   cut off or read as another composer control. Each cell still opens the\n   host's details. The slot outlets inside the dock use display: contents. */\nhtml[data-dsh-phone] [data-composer-dock]:has([data-composer-stat], > :not([data-slot])) {\n  --dsh-phone-status-rule: var(--dsw-alias-separator-primary, color-mix(in srgb, currentColor 14%, transparent));\n  display: grid;\n  grid-auto-flow: column;\n  grid-auto-columns: minmax(0, 1fr);\n  gap: 0 1px;\n  box-sizing: border-box;\n  width: calc(100% + 2 * var(--dsh-composer-side-clearance, 0px));\n  max-width: none;\n  margin: 4px calc(-1 * var(--dsh-composer-side-clearance, 0px)) 0;\n  padding: 0;\n  border-top: 0.5px solid var(--dsh-phone-status-rule);\n  overflow: hidden;\n}\n/* The bar already separates the readings from the screen edge. */\nhtml[data-dsh-phone] [data-composer-seat]:has([data-composer-dock] [data-composer-stat]) {\n  --dsh-phone-safe-bottom: max(4px, env(safe-area-inset-bottom, 0px));\n}\nhtml[data-dsh-phone] [data-composer-dock] [data-composer-stat],\nhtml[data-dsh-phone] [data-composer-dock] > :not([data-slot]) {\n  position: relative;\n  display: flex;\n  min-width: 0;\n  padding: 0 2px;\n  font-size: 13px;\n  line-height: 17px;\n}\n/* An inset divider in the gap before each cell; the first one falls outside\n   the bar and is clipped. */\nhtml[data-dsh-phone] [data-composer-dock] [data-composer-stat]::before,\nhtml[data-dsh-phone] [data-composer-dock] > :not([data-slot])::before {\n  content: \"\";\n  position: absolute;\n  inset: 9px auto 9px -1px;\n  width: 0.5px;\n  background: var(--dsh-phone-status-rule);\n}\nhtml[data-dsh-phone] [data-composer-dock] [data-composer-stat] > :first-child,\nhtml[data-dsh-phone] [data-composer-dock] > :not([data-slot]) button {\n  display: grid;\n  grid-template-columns: 16px minmax(0, max-content);\n  /* Otherwise the icon spanning both rows leaves an empty second row. */\n  grid-auto-rows: min-content;\n  gap: 0 6px;\n  align-content: center;\n  align-items: center;\n  justify-content: center;\n  flex: 1 1 auto;\n  box-sizing: border-box;\n  min-width: 0;\n  max-width: none;\n  min-height: 38px;\n  padding: 2px 6px;\n  border-radius: 10px;\n  color: var(--dsw-alias-label-secondary);\n  font: inherit;\n  font-weight: 500;\n  text-align: start;\n  white-space: normal;\n}\nhtml[data-dsh-phone] [data-composer-dock] [data-composer-stat] > :first-child > svg,\nhtml[data-dsh-phone] [data-composer-dock] > :not([data-slot]) button > svg {\n  grid-row: 1 / span 2;\n  grid-column: 1;\n  width: 16px;\n  height: 16px;\n  color: var(--dsw-alias-label-tertiary);\n}\n/* A two-part reading wraps at its separator: value first, detail below. */\nhtml[data-dsh-phone] [data-composer-dock] [data-composer-stat] > :first-child > span {\n  display: block;\n  grid-column: 2;\n  overflow: visible;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  font-weight: 400;\n  line-height: 14px;\n  overflow-wrap: break-word;\n}\nhtml[data-dsh-phone] [data-composer-dock] [data-composer-stat] > :first-child > span::first-line {\n  color: var(--dsw-alias-label-secondary);\n  font-size: 13px;\n  font-weight: 500;\n  line-height: 17px;\n}\nhtml[data-dsh-phone] [data-composer-dock] [data-composer-stat] [aria-hidden=\"true\"]:not(svg) {\n  display: block;\n  height: 0;\n  margin: 0;\n  overflow: hidden;\n}\nhtml[data-dsh-phone] [data-composer-dock] > :not([data-slot]) button > span {\n  grid-column: 2;\n}\nhtml[data-dsh-phone] [data-composer-dock] button[data-dsh-phone-caption]::after {\n  content: attr(data-dsh-phone-caption);\n  grid-column: 2;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  font-weight: 400;\n  line-height: 14px;\n}\n\nhtml[data-dsh-phone] [data-chat-flow] {\n  min-width: 0;\n  max-width: 100%;\n  overflow-wrap: anywhere;\n}\nhtml[data-dsh-phone] [data-chat-flow] :is(pre, table) {\n  display: block;\n  box-sizing: border-box;\n  max-width: 100%;\n  overflow-x: auto;\n  overscroll-behavior-inline: contain;\n}\nhtml[data-dsh-phone] [data-chat-flow] :is(img, video) {\n  max-width: 100%;\n  height: auto;\n}\n\nhtml[data-dsh-phone] [role=dialog] {\n  box-sizing: border-box;\n  min-width: 0 !important;\n  max-width: calc(100vw - 16px);\n  max-height: calc(var(--dsh-phone-height) - 16px);\n  overflow: auto;\n  overscroll-behavior: contain;\n}\nhtml[data-dsh-phone] .X_2TxG_page {\n  padding-inline: var(--dsh-phone-gutter);\n  padding-bottom: var(--dsh-phone-safe-bottom);\n  gap: 18px;\n}\nhtml[data-dsh-phone] .X_2TxG_pageHead { padding-top: 12px; }\nhtml[data-dsh-phone] .X_2TxG_toolbar { flex-wrap: wrap; gap: 8px; }\n\n@media (max-height: 530px) {\n  html[data-dsh-phone] .wSkVaW_composerHero > :first-child { display: none; }\n}\n@media (prefers-reduced-motion: reduce) {\n  html[data-dsh-phone] :is([data-mobile-role=sidebar], [data-mobile-role=center], [data-mobile-role=details]) { transition: none; }\n}\n";
		const tagId = "dsh-ui-mobile/mobile.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-ui-mobile";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region src/client/index.ts
		/** Required services: the layout panel actions and the slot registry. */
		const inject = [
			"layout",
			"slots"
		];
		/**
		* Client plugin body: register the app-shell service worker, start the frame
		* and install controllers, then register the header menu toggle, the drawer
		* scrim, and the install banner once their slots are declared.
		* @param ctx - client root context.
		*/
const dshPhoneComposerEditor = '[data-composer-card] [contenteditable="true"]';
const dshPhoneComposerSearch = '[data-composer-card] [data-composer-overlay] input';
const dshPhoneEditable = 'input, textarea, select, [contenteditable="true"]';

function installPhoneComposerFocus(media) {
  // Older DSH runs its mount/session-switch focus effect before a mutation
  // observer can mark a new editor. Stop only that composer focus at the DOM
  // call so iOS never sees the focus/blur pair that can flash the keyboard.
  const prototype = HTMLElement.prototype;
  const focus = prototype.focus;
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  const requiresTap = () => coarsePointer.matches || (media.matches && navigator.maxTouchPoints > 0);
  let tappedEditor;
  let tappedUntil = 0;
  let tabUntil = 0;

  function authorized(editor, from) {
    const now = performance.now();
    // Focus moving between composer fields keeps the keyboard that is
    // already up, e.g. returning from the command popup's search field.
    return now < tabUntil || (editor === tappedEditor && now < tappedUntil) ||
      (from instanceof Element && from !== editor && from.matches(dshPhoneEditable) &&
        from.closest("[data-composer-card]") === editor.closest("[data-composer-card]"));
  }

  function onInputGesture(event) {
    tappedEditor = undefined;
    tabUntil = 0;
    if (!requiresTap() || !event.isTrusted || !(event.target instanceof Element)) return;
    const target = event.target;
    const card = target.closest("[data-composer-card]");
    const direct = target.closest(dshPhoneComposerEditor);
    const otherControl = target.closest('button, a, input, select, textarea, [role="button"], [tabindex], [data-composer-overlay]');
    if (!card || (!direct && otherControl && card.contains(otherControl))) return;
    tappedEditor = direct ?? card.querySelector(dshPhoneComposerEditor);
    tappedUntil = performance.now() + 650;
  }

  function phoneComposerFocus(...args) {
    if (requiresTap() && this instanceof HTMLElement && document.activeElement !== this) {
      if (this.matches(dshPhoneComposerEditor) && !authorized(this, document.activeElement)) return;
      // The command popup focuses its search field when it opens. Coming
      // from the open editor that keeps the keyboard; after a toolbar tap it
      // would raise the keyboard over the list. The field still takes taps.
      if (this.matches(dshPhoneComposerSearch) && !document.activeElement?.matches?.(dshPhoneEditable)) return;
    }
    return focus.apply(this, args);
  }

  function onTab(event) {
    if (event.isTrusted && event.key === "Tab") tabUntil = performance.now() + 400;
  }

  function onComposerFocus(event) {
    // WebKit can also focus contenteditable as a side effect of restoring
    // the DOM selection, without calling HTMLElement.focus().
    const editor = event.target;
    if (requiresTap() && editor instanceof HTMLElement && editor.matches(dshPhoneComposerEditor) &&
      !authorized(editor, event.relatedTarget)) editor.blur();
  }

  prototype.focus = phoneComposerFocus;
  for (const type of ["pointerdown", "click"]) document.addEventListener(type, onInputGesture, true);
  document.addEventListener("keydown", onTab, true);
  document.addEventListener("focus", onComposerFocus, true);
  return () => {
    if (prototype.focus === phoneComposerFocus) prototype.focus = focus;
    for (const type of ["pointerdown", "click"]) document.removeEventListener(type, onInputGesture, true);
    document.removeEventListener("keydown", onTab, true);
    document.removeEventListener("focus", onComposerFocus, true);
  };
}

function stampDshPhoneColumns(frame) {
  const columns = [...frame.children].filter(column => column instanceof HTMLElement);
  // The newer shell may insert a native mask before the actual sidebar.
  const sidebar = columns.find(column => column.querySelector(':scope > [data-slot="sidebar"]'));
  const details = columns.find(column => column.hasAttribute("data-rightbar-col") ||
    column.querySelector(':scope > [data-slot="rightbar"]'));
  const center = sidebar && columns[columns.indexOf(sidebar) + 1];
  const roles = ["sidebar", "center", "details"];
  const parts = sidebar && details && center && center !== details
    ? [sidebar, center, details]
    : columns.filter(column => !column.hasAttribute("data-sidebar-mask")).slice(0, 3);
  for (const column of columns) {
    const role = roles[parts.indexOf(column)];
    if (role && column.dataset.mobileRole !== role) column.dataset.mobileRole = role;
    else if (!role && column.hasAttribute("data-mobile-role")) column.removeAttribute("data-mobile-role");
  }
}

function installPhoneViewport(media) {
  // The keyboard pans WebKit's visual viewport across the fixed app, in step
  // with its own animation, and the final geometry is reported only after
  // that animation. Moving or resizing the app from those reports replays
  // the motion as a jump. Leave the app at the full layout viewport so the
  // native pan carries the composer, and only clear a pan that remains once
  // the keyboard has gone.
  const html = document.documentElement;
  const viewport = window.visualViewport;
  if (!viewport) return () => {};
  let settled = 0;

  function settle() {
    settled = 0;
    if (!media.matches || Math.abs(viewport.scale - 1) >= 0.05) return;
    if (document.activeElement?.matches?.(dshPhoneEditable)) return;
    if (Math.max(window.innerHeight, html.clientHeight) - viewport.height > 1) return;
    if (viewport.offsetTop > 0.5 || window.scrollY > 0.5) window.scrollTo(0, 0);
  }

  function schedule() {
    window.clearTimeout(settled);
    settled = window.setTimeout(settle, 240);
  }

  viewport.addEventListener("resize", schedule);
  viewport.addEventListener("scroll", schedule);
  document.addEventListener("focusout", schedule);
  return () => {
    viewport.removeEventListener("resize", schedule);
    viewport.removeEventListener("scroll", schedule);
    document.removeEventListener("focusout", schedule);
    window.clearTimeout(settled);
  };
}

function installPhoneLayout(layout) {
  const html = document.documentElement;
  const media = window.matchMedia(MOBILE_QUERY$2);
  const stopComposerFocus = installPhoneComposerFocus(media);
  const stopViewport = installPhoneViewport(media);
  const observer = new MutationObserver(schedule);
  const nav = document.createElement("button");
  nav.type = "button";
  nav.dataset.dshPhoneNav = "";
  nav.setAttribute("aria-label", "菜单");
  nav.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  nav.addEventListener("click", () => layout.toggleSidebar());
  let pending = 0;
  let previous;
  let sidebarNavigationUntil = 0;
  let drawerOpen = false;

  function schedule() {
    if (pending) return;
    pending = window.requestAnimationFrame(sync);
  }

  function sync() {
    pending = 0;
    const phone = media.matches;
    html.toggleAttribute("data-dsh-phone", phone);
    const frame = document.querySelector("[data-mobile-frame]");
    const center = frame?.querySelector(":scope > [data-mobile-role=center]");
    if (!phone || !center) {
      if (nav.isConnected) nav.remove();
      previous?.frame.removeAttribute("data-dsh-phone-global-page");
      previous = undefined;
      drawerOpen = false;
      return;
    }
    const sidebar = frame.querySelector(":scope > [data-mobile-role=sidebar]");
    // A drawer covers the composer, so the composer's keyboard goes with it.
    // An edge swipe or header button opens it without moving focus.
    const drawer = !!(sidebar && !frame.hasAttribute("data-sidebar-collapsed")) || rightOpen(frame);
    if (drawer && !drawerOpen) {
      const active = document.activeElement;
      if (active instanceof HTMLElement && center.contains(active) && active.matches(dshPhoneEditable)) active.blur();
    }
    drawerOpen = drawer;
    const content = center.querySelector("[data-conversation-content]");
    const session = content?.getAttribute("data-conversation-session") ?? null;
    const panel = center.firstElementChild;
    const routeChanged = previous?.frame === frame &&
      (previous.panel !== panel || previous.session !== session || !!previous.content !== !!content);
    previous = { frame, panel, session, content };
    if (routeChanged && performance.now() < sidebarNavigationUntil) {
      sidebarNavigationUntil = 0;
      if (!frame.hasAttribute("data-sidebar-collapsed")) layout.toggleSidebar();
      if (rightOpen(frame)) layout.closeRightbar();
    }
    const needsNav = !center.querySelector("[data-dsh-phone-header-menu]");
    frame.toggleAttribute("data-dsh-phone-global-page", needsNav);
    nav.hidden = !needsNav;
    nav.setAttribute("aria-expanded", String(!frame.hasAttribute("data-sidebar-collapsed")));
    if (nav.parentElement !== frame) frame.appendChild(nav);
    for (const editor of center.querySelectorAll(dshPhoneComposerEditor)) {
      if (editor.getAttribute("enterkeyhint") !== "send") editor.setAttribute("enterkeyhint", "send");
    }
    // The context meter shows a bare percentage. Its localized label minus
    // that reading ("上下文已用", "of context used") becomes the caption.
    for (const meter of center.querySelectorAll("[data-composer-dock] > :not([data-slot]) button[aria-label]")) {
      const reading = meter.querySelector(":scope > span")?.textContent?.trim();
      const label = meter.getAttribute("aria-label") ?? "";
      const caption = reading && label.includes(reading) ? label.replace(reading, "").trim() : "";
      if (!caption) meter.removeAttribute("data-dsh-phone-caption");
      else if (meter.getAttribute("data-dsh-phone-caption") !== caption) meter.setAttribute("data-dsh-phone-caption", caption);
    }
  }

  function rightOpen(frame) {
    return frame.hasAttribute("data-rightbar-fullscreen") || !frame.hasAttribute("data-rightbar-collapsed");
  }

  function onPhoneClick(event) {
    if (!media.matches || !(event.target instanceof Element)) return;
    const openFrame = event.target.closest('[data-mobile-frame]:not([data-sidebar-collapsed])');
    const preview = openFrame?.querySelector(':scope > [data-mobile-role=center]');
    // Newer hosts keep the page inert while the sidebar owns keyboard focus.
    // Those taps land on the frame itself instead of the still-visible page.
    const bounds = preview && event.target === openFrame && event.detail > 0
      ? preview.getBoundingClientRect() : null;
    if (preview?.contains(event.target) || (bounds && event.clientX >= bounds.left &&
      event.clientX < bounds.right && event.clientY >= bounds.top && event.clientY < bounds.bottom)) {
      event.preventDefault();
      event.stopPropagation();
      layout.toggleSidebar();
      return;
    }
    const item = event.target.closest('button, a, [role="button"], [role="treeitem"]');
    if (item?.closest("[data-mobile-role=sidebar]")) {
      // A route can settle asynchronously. A boot-time render alone is not
      // navigation and must not close a drawer the user just opened.
      sidebarNavigationUntil = performance.now() + 5000;
    }
  }

  function onEscape(event) {
    if (event.defaultPrevented || event.key !== "Escape" || !media.matches || document.querySelector('[role="dialog"][aria-modal="true"]')) return;
    const frame = document.querySelector("[data-mobile-frame]");
    if (!frame) return;
    if (rightOpen(frame)) layout.closeRightbar();
    else if (!frame.hasAttribute("data-sidebar-collapsed")) layout.toggleSidebar();
  }

  media.addEventListener("change", schedule);
  document.addEventListener("keydown", onEscape);
  document.addEventListener("click", onPhoneClick, true);
  observer.observe(document.getElementById("root") ?? document.body, {
    subtree: true, childList: true, attributes: true,
    attributeFilter: ["data-conversation-session", "data-sidebar-collapsed", "data-rightbar-collapsed", "data-rightbar-fullscreen", "contenteditable"]
  });
  sync();
  return () => {
    stopComposerFocus();
    stopViewport();
    observer.disconnect();
    if (pending) window.cancelAnimationFrame(pending);
    media.removeEventListener("change", schedule);
    document.removeEventListener("keydown", onEscape);
    document.removeEventListener("click", onPhoneClick, true);
    nav.remove();
    previous?.frame.removeAttribute("data-dsh-phone-global-page");
    html.removeAttribute("data-dsh-phone");
  };
}

		function apply(ctx) {
			const controller = new MobileFrameController();
			const edgeSwipe = new EdgeSwipeController(controller, () => ctx.layout.toggleSidebar());
			const navigator = new ConversationNavigatorController();
			ctx.effect(() => {
				controller.start();
				edgeSwipe.start();
				navigator.start();
				return () => {
					controller.stop();
					edgeSwipe.stop();
					navigator.stop();
				};
			}, "ui-mobile: frame stabilization");
			ctx.effect(() => installPhoneLayout(ctx.layout), "ui-mobile: adaptive phone layout");
			const drawerControls = () => ({
				toggleSidebar: () => ctx.layout.toggleSidebar(),
				subscribe: (listener) => controller.subscribe(listener),
				snapshot: () => controller.snapshot()
			});
			ctx.slots.inject("conversation.header.leading", () => ctx.slots.register({
				name: "conversation.header.leading",
				id: "mobile-menu",
				order: -10,
				label: "菜单",
				inject: () => drawerControls()
			}, HeaderMenuButton));
			ctx.slots.inject("shell.overlay", () => {
				const registerScrim = ctx.slots.register({
					name: "shell.overlay",
					id: "mobile-scrim",
					order: 110,
					label: "抽屉遮罩",
					inject: () => ({
						...drawerControls(),
						toggleSidebar: () => controller.snapshot().detailsOpen ? ctx.layout.closeRightbar() : ctx.layout.toggleSidebar()
					})
				}, DrawerScrim);
				const registerNewSessionMenu = ctx.slots.register({
					name: "shell.overlay",
					id: "mobile-new-session-menu",
					order: 89,
					label: "新会话菜单",
					inject: () => drawerControls()
				}, NewSessionMenuButton);
				const registerConversationNavigator = ctx.slots.register({
					name: "shell.overlay",
					id: "mobile-conversation-navigator",
					order: 88,
					label: "会话导览",
					inject: () => ({
						navigator,
						frame: controller
					})
				}, ConversationNavigator);
				return () => {
					registerScrim();
					registerNewSessionMenu();
					registerConversationNavigator();
				};
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map