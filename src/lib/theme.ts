// Tema do app: ciclo `auto` → `light` → `dark` → `auto`, preferência
// persistida em localStorage e atributo `data-theme` no `<html>`.

export type Theme = "auto" | "light" | "dark";

const STORAGE_KEY = "quizzes:theme:v1";

function systemTheme(): "light" | "dark" {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

/** Resolve `auto` para o tema do sistema, senão devolve o tema dado. */
function resolveTheme(theme: Theme): "light" | "dark" {
	return theme === "auto" ? systemTheme() : theme;
}

/** Aplica o tema no `<html>`: com `auto`, reflete o tema do sistema. */
export function applyTheme(theme: Theme): void {
	document.documentElement.setAttribute("data-theme", resolveTheme(theme));
}

/** Cicla `auto → light → dark → auto`; devolve o modo novo. */
export function nextTheme(theme: Theme): Theme {
	return theme === "auto" ? "light" : theme === "light" ? "dark" : "auto";
}

function saveTheme(theme: Theme): void {
	try {
		window.localStorage.setItem(STORAGE_KEY, theme);
	} catch {
		// storage indisponível: o ciclo continua em memória
	}
}

function readTheme(): Theme {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (raw === "light" || raw === "dark" || raw === "auto") return raw;
	} catch {
		// storage indisponível → padrão
	}
	return "auto";
}

/** Carrega a preferência salva e aplica no `<html>`; devolve o modo salvo. */
export function initTheme(): Theme {
	const theme = readTheme();
	applyTheme(theme);
	return theme;
}

/** Cicla, persiste e aplica; devolve o modo novo. */
export function cycleTheme(theme: Theme): Theme {
	const next = nextTheme(theme);
	saveTheme(next);
	applyTheme(next);
	return next;
}

/**
 * Reflete as trocas do sistema enquanto o modo for `auto`. Retorna uma função
 * de limpeza que desfaz o listener.
 */
export function watchSystemTheme(): () => void {
	if (
		typeof window === "undefined" ||
		typeof window.matchMedia !== "function"
	) {
		return () => {};
	}
	const mql = window.matchMedia("(prefers-color-scheme: dark)");
	const applyIfAuto = () => {
		if (readTheme() === "auto") applyTheme("auto");
	};
	applyIfAuto();
	mql.addEventListener("change", applyIfAuto);
	return () => mql.removeEventListener("change", applyIfAuto);
}
