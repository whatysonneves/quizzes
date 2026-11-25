export type AppRoute =
	| { name: "home" }
	| { name: "quiz"; slug: string }
	| { name: "not-found" };

/** Interpreta as rotas `#/` e `#/quiz/<slug>` usadas no GitHub Pages. */
export function parseRoute(hash = window.location.hash): AppRoute {
	if (hash === "" || hash === "#/" || hash === "#") return { name: "home" };

	const match = /^#\/quiz\/([^/]+)\/?$/.exec(hash);
	if (!match) return { name: "not-found" };

	try {
		const slug = decodeURIComponent(match[1]);
		return slug ? { name: "quiz", slug } : { name: "not-found" };
	} catch {
		return { name: "not-found" };
	}
}

export function navigateToHome(): void {
	if (window.location.hash !== "#/" && window.location.hash !== "") {
		window.location.hash = "/";
	}
}

export function navigateToQuiz(slug: string): void {
	window.location.hash = `/quiz/${encodeURIComponent(slug)}`;
}
