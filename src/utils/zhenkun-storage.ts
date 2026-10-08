export type SafeStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
/** Storage is an optional preference layer; URL and default configuration remain usable. */
export const safeStorage: SafeStorage = {
	getItem(key) {
		try {
			return typeof window === "undefined"
				? null
				: window.localStorage.getItem(key);
		} catch {
			return null;
		}
	},
	setItem(key, value) {
		try {
			if (typeof window !== "undefined")
				window.localStorage.setItem(key, value);
		} catch {
			/* keep defaults */
		}
	},
	removeItem(key) {
		try {
			if (typeof window !== "undefined") window.localStorage.removeItem(key);
		} catch {
			/* keep defaults */
		}
	},
};
