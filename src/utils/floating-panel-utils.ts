const CLOSED_CLASS = "float-panel-closed";
const PANEL_SELECTOR = "[data-floating-panel]";
const FOCUS_RETURN_ATTRIBUTE = "data-floating-panel-focus-return";
export const FLOATING_PANEL_CLOSE_EVENT = "floating-panel:close";

const panelObservers = new Map<HTMLElement, MutationObserver>();
const panelOpenStates = new WeakMap<HTMLElement, boolean>();
const modalStates = new Map<
	HTMLElement,
	{
		returnFocus: HTMLElement | null;
		background: Map<HTMLElement, boolean>;
	}
>();
let escapeListenerAttached = false;

function getModal(): HTMLElement | undefined {
	return Array.from(modalStates.keys()).at(-1);
}

function getFocusable(panel: HTMLElement): HTMLElement[] {
	return Array.from(
		panel.querySelectorAll<HTMLElement>(
			'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
		),
	).filter((element) => !element.closest("[inert]") && isVisible(element));
}

function focusInModal(panel: HTMLElement): void {
	const target =
		getFocusable(panel)[0] ??
		panel.querySelector<HTMLElement>('[role="dialog"]');
	target?.focus();
}

function focusReturning(trigger: HTMLElement): void {
	try {
		trigger.setAttribute(FOCUS_RETURN_ATTRIBUTE, "");
		trigger.focus();
	} finally {
		trigger.removeAttribute(FOCUS_RETURN_ATTRIBUTE);
	}
}

function releaseModal(panel: HTMLElement): void {
	const state = modalStates.get(panel);
	if (!state) return;
	modalStates.delete(panel);
	for (const [element, wasInert] of state.background) element.inert = wasInert;
	document.body.classList.remove("menu-open");
	const previous = state.returnFocus;
	const target =
		previous?.isConnected && !previous.closest("[inert]") && isVisible(previous)
			? previous
			: getPanelTriggers(panel).find(isVisible);
	if (target) focusReturning(target);
}

function acquireModal(panel: HTMLElement): void {
	// Popovers cannot keep completing behind an active modal.
	for (const other of document.querySelectorAll<HTMLElement>(PANEL_SELECTOR)) {
		if (other !== panel && !other.classList.contains(CLOSED_CLASS)) {
			setFloatingPanelOpen(other, false);
		}
	}
	const returnFocus =
		document.activeElement instanceof HTMLElement
			? document.activeElement
			: null;
	const background = new Map<HTMLElement, boolean>();
	for (const element of document.body.children) {
		if (!(element instanceof HTMLElement) || element.contains(panel)) continue;
		background.set(element, element.inert);
		element.inert = true;
	}
	modalStates.set(panel, { returnFocus, background });
	focusInModal(panel);
}

function getPanelTriggers(panel: HTMLElement): HTMLElement[] {
	const triggerIds = panel.dataset.floatingPanelTrigger
		?.split(/\s+/)
		.filter(Boolean);

	if (!triggerIds) return [];

	return triggerIds
		.map((id) => document.getElementById(id))
		.filter((trigger): trigger is HTMLElement => trigger !== null);
}

function isVisible(element: HTMLElement): boolean {
	const style = window.getComputedStyle(element);
	return (
		style.display !== "none" &&
		style.visibility !== "hidden" &&
		element.getClientRects().length > 0
	);
}

function syncFloatingPanelState(panel: HTMLElement): void {
	if (
		panel.hasAttribute("data-floating-panel-modal") &&
		!panel.classList.contains(CLOSED_CLASS) &&
		window.matchMedia("(min-width: 1024px)").matches
	) {
		panel.classList.add(CLOSED_CLASS);
	}
	const isOpen = !panel.classList.contains(CLOSED_CLASS);
	const wasOpen = panelOpenStates.get(panel);

	panel.inert = !isOpen;
	panel.setAttribute("aria-hidden", String(!isOpen));

	for (const trigger of getPanelTriggers(panel)) {
		if (panel.id) trigger.setAttribute("aria-controls", panel.id);
		if (!trigger.hasAttribute("data-floating-panel-no-expanded")) {
			trigger.setAttribute("aria-expanded", String(isOpen));
		}
	}

	panelOpenStates.set(panel, isOpen);
	if (panel.hasAttribute("data-floating-panel-modal")) {
		if (isOpen && !modalStates.has(panel)) acquireModal(panel);
		else if (!isOpen) releaseModal(panel);
	}
	if (wasOpen === true && !isOpen) {
		panel.dispatchEvent(new Event(FLOATING_PANEL_CLOSE_EVENT));
	}

	// 带 data-floating-panel-scroll-lock 的面板打开时锁定背景滚动（app drawer 行为）；
	// 该函数在初始化/class 变化/Swup 重扫时都会跑，各类关闭路径都会同步滚动锁。
	if (panel.hasAttribute("data-floating-panel-scroll-lock")) {
		document.body.classList.toggle("menu-open", isOpen);
	}
}

function setFloatingPanelOpen(panel: HTMLElement, isOpen: boolean): void {
	panel.classList.toggle(CLOSED_CLASS, !isOpen);
	syncFloatingPanelState(panel);
}

function handleEscape(event: KeyboardEvent): void {
	const modal = getModal();
	if (event.key === "Tab" && modal) {
		const items = getFocusable(modal);
		const first = items[0];
		const last = items.at(-1);
		const active = document.activeElement;
		if (!first || !last) {
			event.preventDefault();
			focusInModal(modal);
		} else if (
			!modal.contains(active) ||
			(event.shiftKey ? active === first : active === last)
		) {
			event.preventDefault();
			(event.shiftKey ? last : first).focus();
		}
		return;
	}
	if (event.key !== "Escape") return;

	const target = event.target instanceof Node ? event.target : null;
	const openPanels = Array.from(
		document.querySelectorAll<HTMLElement>(PANEL_SELECTOR),
	).filter((panel) => !panel.classList.contains(CLOSED_CLASS));

	const activePanel =
		modal ??
		openPanels.find((panel) => {
			if (!target) return false;
			return (
				panel.contains(target) ||
				getPanelTriggers(panel).some((trigger) => trigger.contains(target))
			);
		});

	if (!activePanel) return;

	event.preventDefault();
	setFloatingPanelOpen(activePanel, false);
	if (modal) return; // Modal release already restored focus.

	const triggers = getPanelTriggers(activePanel);
	const trigger = triggers.find(isVisible) ?? triggers[0];
	if (!trigger) return;

	focusReturning(trigger);
}

function disconnectRemovedPanelObservers(): void {
	for (const [panel, observer] of panelObservers) {
		if (panel.isConnected) continue;

		observer.disconnect();
		releaseModal(panel);
		panelObservers.delete(panel);
		panelOpenStates.delete(panel);
	}
}

export function initializeFloatingPanels(root: ParentNode = document): void {
	disconnectRemovedPanelObservers();

	const panels = Array.from(root.querySelectorAll<HTMLElement>(PANEL_SELECTOR));

	if (root instanceof HTMLElement && root.matches(PANEL_SELECTOR)) {
		panels.unshift(root);
	}

	for (const panel of panels) {
		syncFloatingPanelState(panel);

		if (panelObservers.has(panel)) continue;

		const observer = new MutationObserver(() => {
			syncFloatingPanelState(panel);
		});
		observer.observe(panel, {
			attributes: true,
			attributeFilter: ["class"],
		});
		panelObservers.set(panel, observer);
	}

	if (!escapeListenerAttached) {
		document.addEventListener("keydown", handleEscape);
		document.addEventListener("focusin", (event) => {
			const modal = getModal();
			if (
				modal &&
				event.target instanceof Node &&
				!modal.contains(event.target)
			)
				focusInModal(modal);
		});
		window
			.matchMedia("(min-width: 1024px)")
			.addEventListener("change", (event) => {
				if (event.matches) {
					for (const modal of modalStates.keys())
						setFloatingPanelOpen(modal, false);
				}
			});
		escapeListenerAttached = true;
	}
}

/** Cancel transient UI before Swup replaces content or moves page focus. */
export function closeFloatingPanels(): void {
	for (const panel of document.querySelectorAll<HTMLElement>(PANEL_SELECTOR)) {
		if (!panel.classList.contains(CLOSED_CLASS))
			setFloatingPanelOpen(panel, false);
	}
}

/** 点击指定面板及其忽略元素之外时，将其关闭（从 Layout.astro 迁出） */
export function setClickOutsideToClose(panel: string, ignores: string[]): void {
	document.addEventListener("click", (event) => {
		const panelDom = document.getElementById(panel);
		if (!panelDom) return;
		const tDom = event.target;
		if (!(tDom instanceof Node)) return; // Ensure the event target is an HTML Node
		for (const ig of ignores) {
			const ie = document.getElementById(ig);
			if (ie === tDom || ie?.contains(tDom)) {
				return;
			}
		}
		panelDom.classList.add("float-panel-closed");
	});
}
