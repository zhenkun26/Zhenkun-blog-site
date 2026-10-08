<script lang="ts">
import { getTranslation } from "@/i18n/translation";
import type { UiLocale } from "@/utils/locale-contract";

let { locale = "zh_CN" }: { locale?: UiLocale } = $props();

import { onMount, tick } from "svelte";
import Icon from "@/components/common/Icon.svelte";
import { DARK_MODE, LIGHT_MODE, SYSTEM_MODE } from "@/constants/constants";
import type { LIGHT_DARK_MODE } from "@/types/config.ts";
import {
	applyThemeToDocument,
	getStoredTheme,
	setTheme,
} from "@/utils/setting-utils";

// Define Swup type for window object
interface SwupHooks {
	on(event: string, callback: () => void): void;
}

interface SwupInstance {
	hooks?: SwupHooks;
}

type WindowWithSwup = Window & { swup?: SwupInstance };

let mode: LIGHT_DARK_MODE = $state(LIGHT_MODE);
let displayedMode: LIGHT_DARK_MODE = $state(LIGHT_MODE); // 显示的实际主题（在system模式下会随系统变化）
let switchButton: HTMLButtonElement;
let isTransitioning = false;

function updateDisplayedMode() {
	if (mode === SYSTEM_MODE) {
		// 如果是system模式，显示实际的系统主题
		const isSystemDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches;
		displayedMode = isSystemDark ? DARK_MODE : LIGHT_MODE;
	} else {
		displayedMode = mode;
	}
}

// 点按直接在亮/暗之间切换；以按钮为圆心做圆形扩散揭示：
// 圆内是新配色、圆外保持旧配色，直到铺满全屏（CSS 禁用了默认交叉淡化，见 main.css）
async function toggleScheme() {
	if (isTransitioning) return;
	const newMode: LIGHT_DARK_MODE =
		displayedMode === DARK_MODE ? LIGHT_MODE : DARK_MODE;

	const apply = () => {
		mode = newMode;
		setTheme(newMode);
		updateDisplayedMode();
	};

	// 尊重系统"减弱动态效果"偏好；不支持 View Transitions 的浏览器直接切换
	if (
		typeof document.startViewTransition !== "function" ||
		window.matchMedia("(prefers-reduced-motion: reduce)").matches
	) {
		apply();
		return;
	}

	// 鼠标、触摸、键盘均使用组件自身按钮的视口坐标。
	// 无有效位置时直接切换，不制造一个与按钮无关的兜底圆心。
	const rect = switchButton?.getBoundingClientRect();
	if (!rect || rect.width <= 0 || rect.height <= 0) {
		apply();
		return;
	}
	const x = rect.left + rect.width / 2;
	const y = rect.top + rect.height / 2;
	// 从圆心到屏幕最远角的距离，保证铺满
	const endRadius = Math.hypot(
		Math.max(x, window.innerWidth - x),
		Math.max(y, window.innerHeight - y),
	);

	const root = document.documentElement;
	// 快照裁切中的 px 在 HiDPI 下可能与 DOM CSS 像素不一致。
	// 改用相对快照尺寸的百分比，避免像素单位在合成时被再次缩放。
	const center = `${(x / window.innerWidth) * 100}% ${(y / window.innerHeight) * 100}%`;
	// circle 的百分比半径以参考盒对角线 / sqrt(2) 为基准。
	const diagonal = Math.hypot(window.innerWidth, window.innerHeight);
	const radius = (endRadius / (diagonal / Math.SQRT2)) * 100;
	root.style.setProperty("--theme-reveal-start", `circle(0% at ${center})`);
	root.style.setProperty(
		"--theme-reveal-end",
		`circle(${radius}% at ${center})`,
	);
	root.classList.add("theme-revealing");
	isTransitioning = true;
	try {
		const transition = document.startViewTransition(async () => {
			apply();
			await tick();
		});
		// CSS 在快照创建时启动动画，不依赖 WAAPI 的 pseudoElement 路径。
		await transition.finished;
	} catch {
		apply();
	} finally {
		root.classList.remove("theme-revealing");
		for (const property of ["start", "end"]) {
			root.style.removeProperty(`--theme-reveal-${property}`);
		}
		isTransitioning = false;
	}
}

// 使用onMount确保在组件挂载后正确初始化
onMount(() => {
	// 立即获取并设置正确的主题
	const storedTheme = getStoredTheme();
	mode = storedTheme;
	updateDisplayedMode();

	// 确保DOM状态与存储的主题一致（只对非system模式检查）
	if (storedTheme !== SYSTEM_MODE) {
		const currentTheme = document.documentElement.classList.contains("dark")
			? DARK_MODE
			: LIGHT_MODE;
		if (storedTheme !== currentTheme) {
			applyThemeToDocument(storedTheme);
		}
	}

	// 如果是system模式，监听系统主题变化
	if (storedTheme === SYSTEM_MODE) {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleSystemChange = () => {
			updateDisplayedMode();
		};
		mediaQuery.addEventListener("change", handleSystemChange);
	}

	// 添加Swup监听
	const handleContentReplace = () => {
		const newTheme = getStoredTheme();
		mode = newTheme;
		updateDisplayedMode();
	};

	// 检查Swup是否已经加载
	const win = window as WindowWithSwup;
	if (win.swup?.hooks) {
		win.swup.hooks.on("content:replace", handleContentReplace);
	} else {
		document.addEventListener("swup:enable", () => {
			const w = window as WindowWithSwup;
			if (w.swup?.hooks) {
				w.swup.hooks.on("content:replace", handleContentReplace);
			}
		});
	}

	// 监听主题变化事件
	const handleThemeChange = () => {
		// 只有当mode不是system模式时才更新mode
		// system模式下，mode应该保持为SYSTEM_MODE，displayedMode会自动更新
		if (mode !== SYSTEM_MODE) {
			const newTheme = getStoredTheme();
			mode = newTheme;
			updateDisplayedMode();
		} else {
			// system模式下只需要更新displayedMode
			updateDisplayedMode();
		}
	};

	window.addEventListener("theme-change", handleThemeChange);

	// 清理函数
	return () => {
		window.removeEventListener("theme-change", handleThemeChange);
	};
});
</script>

<div class="z-50">
	<button bind:this={switchButton} aria-label={getTranslation(locale).uiTheme} onclick={toggleScheme} class="relative btn-plain scale-animation rounded-lg h-9 w-9 md:h-11 md:w-11 active:scale-90" id="scheme-switch">
        <div class="absolute inset-0 flex items-center justify-center" class:opacity-0={displayedMode !== LIGHT_MODE}>
            <Icon icon="material-symbols:wb-sunny-outline-rounded" class="text-[1.25rem]"></Icon>
        </div>
        <div class="absolute inset-0 flex items-center justify-center" class:opacity-0={displayedMode !== DARK_MODE}>
            <Icon icon="material-symbols:dark-mode-outline-rounded" class="text-[1.25rem]"></Icon>
        </div>
    </button>
</div>
