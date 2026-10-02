export interface SearchState<T> {
	query: string;
	status: "idle" | "loading" | "ready" | "error";
	results: T[];
	error?: unknown;
}

/** One query stream owns debounce, initialization waits, and stale completions. */
export function createSearchSession<T>(options: {
	search: (query: string) => Promise<T[]>;
	publish: (state: SearchState<T>) => void;
	debounceMs?: number;
}): {
	setQuery: (query: string) => void;
	cancel: () => void;
	dispose: () => void;
} {
	let requestId = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let disposed = false;

	const invalidate = (): number => {
		clearTimeout(timer);
		timer = undefined;
		return ++requestId;
	};

	return {
		setQuery(value) {
			if (disposed) return;
			const id = invalidate();
			const query = value.trim();
			if (!query) {
				options.publish({ query, status: "idle", results: [] });
				return;
			}

			options.publish({ query, status: "loading", results: [] });
			timer = setTimeout(async () => {
				timer = undefined;
				try {
					const results = await options.search(query);
					if (disposed || id !== requestId) return;
					options.publish({ query, status: "ready", results });
				} catch (error) {
					if (disposed || id !== requestId) return;
					options.publish({ query, status: "error", results: [], error });
				}
			}, options.debounceMs ?? 300);
		},
		cancel() {
			invalidate();
			if (!disposed) {
				options.publish({ query: "", status: "idle", results: [] });
			}
		},
		dispose() {
			disposed = true;
			invalidate();
		},
	};
}
