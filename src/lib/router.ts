export type AppRoute =
	| { name: "home" }
	| { name: "quiz"; slug: string; page?: number }
	| { name: "not-found" };

/** Interpreta as rotas `#/`, `#/quiz/<slug>` e `#/quiz/<slug>/<pagina>`. */
export function parseRoute(hash = window.location.hash): AppRoute {
	if (hash === "" || hash === "#/" || hash === "#") return { name: "home" };

	const match = /^#\/quiz\/([^/]+)(?:\/(\d+))?\/?$/.exec(hash);
	if (!match) return { name: "not-found" };

	try {
		const slug = decodeURIComponent(match[1]);
		if (!slug) return { name: "not-found" };
		const rawPage = match[2];
		if (rawPage !== undefined) {
			const page = Number(rawPage);
			if (!Number.isSafeInteger(page) || page < 1) return { name: "not-found" };
			return { name: "quiz", slug, page };
		}
		return { name: "quiz", slug };
	} catch {
		return { name: "not-found" };
	}
}

export function navigateToHome(): void {
	if (window.location.hash !== "#/" && window.location.hash !== "") {
		window.location.hash = "/";
	}
}

export function navigateToQuiz(slug: string, page?: number): void {
	const base = `/quiz/${encodeURIComponent(slug)}`;
	window.location.hash = page === undefined ? base : `${base}/${page}`;
}
