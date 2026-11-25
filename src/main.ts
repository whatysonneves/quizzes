import "./styles.css";
import { getOrder, getStatus, loadProgress, saveOrder, setStatus } from "./lib/progress";
import { loadQuizzes, type QuizEntry } from "./lib/quizzes";
import { navigateToHome, parseRoute } from "./lib/router";
import { cycleTheme, initTheme, watchSystemTheme, type Theme } from "./lib/theme";
import { renderGame } from "./views/game";
import { renderHome } from "./views/home";
import { confirmRestart } from "./views/restart-dialog";

const appRoot = document.querySelector<HTMLDivElement>("#app");
if (!appRoot) throw new Error("Elemento #app não encontrado.");
const root = appRoot; // tipo HTMLDivElement (não nulo) para uso em closures

const quizzes = loadQuizzes();
let theme: Theme = initTheme();
let routeVersion = 0;
watchSystemTheme();

function quizBySlug(slug: string): QuizEntry | undefined {
	return quizzes.find((quiz) => quiz.slug === slug);
}

function toggleTheme(render: () => void): void {
	theme = cycleTheme(theme);
	render();
}

function renderHomePage(): void {
	root.replaceChildren(
		renderHome({
			quizzes,
			progress: loadProgress(),
			theme,
			onOpenQuiz: (slug) => {
				window.location.hash = `/quiz/${encodeURIComponent(slug)}`;
			},
			onToggleTheme: () => toggleTheme(renderHomePage),
		}),
	);
}

function shuffledOrder(length: number): number[] {
	const order = Array.from({ length }, (_, index) => index);
	for (let index = order.length - 1; index > 0; index -= 1) {
		const other = Math.floor(Math.random() * (index + 1));
		[order[index], order[other]] = [order[other], order[index]];
	}
	return order;
}

function renderGamePage(quiz: QuizEntry): void {
	const order = getOrder(quiz.slug, quiz.questions.length) ?? shuffledOrder(quiz.questions.length);
	saveOrder(quiz.slug, order);
	let index = 0;
	let answerVisible = false;
	const lastNavigationActionAt = {
		back: Number.NEGATIVE_INFINITY,
		advance: Number.NEGATIVE_INFINITY,
	};
	const navigationActionCooldownMs = 100;
	const acceptNavigationAction = (action: "back" | "advance"): boolean => {
		const now = performance.now();
		if (now - lastNavigationActionAt[action] < navigationActionCooldownMs) return false;
		lastNavigationActionAt[action] = now;
		return true;
	};

	const draw = () => {
		const question = quiz.questions[order[index]];
		root.replaceChildren(
			renderGame({
				quiz,
				question,
				current: index + 1,
				total: order.length,
				answerVisible,
				theme,
				onGoHome: navigateToHome,
				onBack: () => {
					if (!acceptNavigationAction("back")) return;
					if (answerVisible) {
						answerVisible = false;
					} else if (index > 0) {
						index -= 1;
					} else {
						navigateToHome();
						return;
					}
					draw();
				},
				onAdvance: () => {
					if (!acceptNavigationAction("advance")) return;
					if (!answerVisible) {
						answerVisible = true;
						if (index === order.length - 1) {
							setStatus(quiz.slug, "complete");
						} else {
							setStatus(quiz.slug, "opened");
						}
					} else if (index === order.length - 1) {
						navigateToHome();
						return;
					} else {
						index += 1;
						answerVisible = false;
					}
					draw();
				},
				onToggleTheme: () => toggleTheme(draw),
			}),
		);
	};
	draw();
}

async function renderRoute(): Promise<void> {
	const version = ++routeVersion;
	const route = parseRoute();
	if (route.name === "home") {
		renderHomePage();
		return;
	}
	if (route.name === "not-found") {
		navigateToHome();
		return;
	}

	const quiz = quizBySlug(route.slug);
	if (!quiz) {
		navigateToHome();
		return;
	}
	if (getStatus(quiz.slug) === "complete") {
		const shouldRestart = await confirmRestart(quiz.title);
		if (version !== routeVersion) return;
		if (!shouldRestart) {
			navigateToHome();
			return;
		}
		setStatus(quiz.slug, "opened");
	}
	renderGamePage(quiz);
}

window.addEventListener("hashchange", () => void renderRoute());
if (window.location.hash === "") window.location.hash = "/";
else void renderRoute();
