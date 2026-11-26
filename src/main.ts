import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/inter/wght-italic.css";
import "./styles.css";
import { getLastViewed, getOrder, getStatus, loadProgress, saveOrder, setLastViewed, setStatus } from "./lib/progress";
import { loadQuizzes, type QuizEntry } from "./lib/quizzes";
import { navigateToHome, navigateToQuiz, parseRoute } from "./lib/router";
import { cycleTheme, initTheme, watchSystemTheme, type Theme } from "./lib/theme";
import { renderGame } from "./views/game";
import { renderHome } from "./views/home";
import { confirmRestart } from "./views/restart-dialog";
import { chooseResume } from "./views/resume-dialog";
import { showNoUnfinishedQuizzesAlert } from "./views/alerts";

const appRoot = document.querySelector<HTMLDivElement>("#app");
if (!appRoot) throw new Error("Elemento #app não encontrado.");
const root = appRoot; // tipo HTMLDivElement (não nulo) para uso em closures

const quizzes = loadQuizzes();
let theme: Theme = initTheme();
let routeVersion = 0;
let activeQuizSlug: string | null = null;
watchSystemTheme();

function quizBySlug(slug: string): QuizEntry | undefined {
	return quizzes.find((quiz) => quiz.slug === slug);
}

/** Abre um quiz na última posição salva; quizzes concluídos recomeçam do 1. */
function openQuiz(slug: string): void {
	const page = getStatus(slug) === "complete" ? 1 : (getLastViewed(slug) ?? 1);
	navigateToQuiz(slug, page);
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
			onOpenQuiz: openQuiz,
				onRandomQuiz: () => {
					const progress = loadProgress();
					const unfinished = quizzes.filter((quiz) => progress[quiz.slug]?.status !== "complete");
					if (unfinished.length === 0) {
						void showNoUnfinishedQuizzesAlert();
						return;
					}
					const selected = unfinished[Math.floor(Math.random() * unfinished.length)];
					openQuiz(selected.slug);
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

function renderGamePage(quiz: QuizEntry, initialPage: number): void {
	const order = getOrder(quiz.slug, quiz.questions.length) ?? shuffledOrder(quiz.questions.length);
	saveOrder(quiz.slug, order);
	setLastViewed(quiz.slug, initialPage);
	let index = initialPage - 1;
	let answerVisible = false;
	const goToPage = (nextIndex: number): void => {
		navigateToQuiz(quiz.slug, nextIndex + 1);
	};
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
						goToPage(index - 1);
						return;
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
						setStatus(quiz.slug, index === order.length - 1 ? "complete" : "opened");
					} else if (index === order.length - 1) {
						navigateToHome();
						return;
					} else {
						goToPage(index + 1);
						return;
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
	if (route.name !== "quiz") {
		activeQuizSlug = null;
		if (route.name === "not-found") navigateToHome();
		else renderHomePage();
		return;
	}

	const quiz = quizBySlug(route.slug);
	if (!quiz) {
		activeQuizSlug = null;
		navigateToHome();
		return;
	}

	const page = route.page ?? getLastViewed(quiz.slug) ?? 1;
	if (!Number.isSafeInteger(page) || page < 1 || page > quiz.questions.length) {
		activeQuizSlug = null;
		navigateToHome();
		return;
	}
	if (route.page === undefined) {
		navigateToQuiz(quiz.slug, page);
		return;
	}

	const isSameQuiz = activeQuizSlug === quiz.slug;
	const status = getStatus(quiz.slug);
	if (!isSameQuiz && status === "complete") {
		const shouldRestart = await confirmRestart(quiz.title);
		if (version !== routeVersion) return;
		if (!shouldRestart) {
			activeQuizSlug = null;
			navigateToHome();
			return;
		}
		setStatus(quiz.slug, "opened");
		setLastViewed(quiz.slug, 1);
		activeQuizSlug = quiz.slug;
		renderGamePage(quiz, 1);
		return;
	}
	if (!isSameQuiz && status === "opened") {
		const choice = await chooseResume(quiz.title, page);
		if (version !== routeVersion) return;
		if (choice === "cancel") {
			activeQuizSlug = null;
			navigateToHome();
			return;
		}
		if (choice === "restart") {
			setLastViewed(quiz.slug, 1);
			activeQuizSlug = quiz.slug;
			renderGamePage(quiz, 1);
			return;
		}
	}

	activeQuizSlug = quiz.slug;
	renderGamePage(quiz, page);
}

window.addEventListener("hashchange", () => void renderRoute());
if (window.location.hash === "") window.location.hash = "/";
else void renderRoute();
