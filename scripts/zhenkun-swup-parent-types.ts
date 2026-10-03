import Parallel from "../node_modules/.pnpm/@swup+parallel-plugin@0.4.0_swup@4.9.2/node_modules/@swup/parallel-plugin/dist/index.js";
import RouteName from "../node_modules/.pnpm/@swup+route-name-plugin@4.1.0_swup@4.9.2/node_modules/@swup/route-name-plugin/dist/index.js";
import Swup from "../node_modules/.pnpm/swup@4.9.2/node_modules/swup/dist/types/index.js";

const parallel = new Parallel({ containers: ["#swup"], keep: { "#swup": 1 } });
const route = new RouteName({
	routes: [{ name: "About", path: "/about/:slug?" }],
	paths: true,
});
const swup = new Swup({ plugins: [parallel, route] });
parallel.swup = swup;
route.swup = swup;
parallel.mount();
parallel.unmount();
route.mount();
route.unmount();
swup.hooks.on("content:insert", (_visit, { containers }) => {
	const next: HTMLElement | undefined = containers[0]?.next;
	void next;
});
swup.hooks.on("visit:start", (visit) => {
	const parallelVisit: boolean | undefined = visit.animation.parallel;
	const routeName: string | undefined = visit.to.route;
	void parallelVisit;
	void routeName;
});
// @ts-expect-error The parent API accepts a count/map, not a string.
new Parallel({ keep: "invalid" });
// @ts-expect-error A route must include its path.
new RouteName({ routes: [{ name: "missing-path" }] });
