import { formatQuizDate, type QuizEntry } from "../lib/quizzes";
import { type QuizProgress } from "../lib/progress";
import { type Theme } from "../lib/theme";

export interface HomeViewOptions {
	quizzes: QuizEntry[];
	progress: Record<string, QuizProgress>;
	theme: Theme;
	onOpenQuiz: (slug: string) => void;
	onToggleTheme: () => void;
}

function themeLabel(theme: Theme): string {
	return theme === "auto" ? "Automático" : theme === "light" ? "Claro" : "Escuro";
}

export function renderHome(options: HomeViewOptions): HTMLElement {
	const page = document.createElement("main");
	page.className = "home-page page-shell";

	const header = document.createElement("header");
	header.className = "site-header";
	const brand = document.createElement("div");
	brand.className = "brand-lockup";
	const mark = document.createElement("span");
	mark.className = "brand-mark";
	mark.setAttribute("aria-hidden", "true");
	mark.textContent = "Q";
	const brandText = document.createElement("div");
	const title = document.createElement("h1");
	title.className = "site-title";
	title.textContent = "Quizzes";
	const subtitle = document.createElement("p");
	subtitle.className = "site-subtitle";
	subtitle.textContent = "Uma pergunta de cada vez.";
	brandText.append(title, subtitle);
	brand.append(mark, brandText);

	const themeButton = document.createElement("button");
	themeButton.type = "button";
	themeButton.className = "theme-toggle";
	themeButton.setAttribute("aria-label", `Tema ${themeLabel(options.theme)}. Alterar tema`);
	themeButton.innerHTML = `<span aria-hidden="true">${options.theme === "dark" ? "☾" : options.theme === "light" ? "☀" : "◐"}</span><span>${themeLabel(options.theme)}</span>`;
	themeButton.addEventListener("click", options.onToggleTheme);
	header.append(brand, themeButton);

	const section = document.createElement("section");
	section.className = "quiz-list-section";
	const sectionHeading = document.createElement("div");
	sectionHeading.className = "section-heading";
	const heading = document.createElement("h2");
	heading.textContent = "Seus quizzes";
	const count = document.createElement("span");
	count.className = "quiz-count";
	count.textContent = `${options.quizzes.length} ${options.quizzes.length === 1 ? "quiz" : "quizzes"}`;
	sectionHeading.append(heading, count);
	section.append(sectionHeading);

	if (options.quizzes.length === 0) {
		const empty = document.createElement("p");
		empty.className = "empty-state";
		empty.textContent = "Nenhum quiz disponível ainda.";
		section.append(empty);
	} else {
		const list = document.createElement("div");
		list.className = "quiz-list";
		for (const quiz of options.quizzes) {
			const status = options.progress[quiz.slug]?.status;
			const card = document.createElement("button");
			card.type = "button";
			card.className = `quiz-card${status === "opened" ? " is-opened" : ""}${status === "complete" ? " is-complete" : ""}`;
			card.addEventListener("click", () => options.onOpenQuiz(quiz.slug));

			const cardCopy = document.createElement("span");
			cardCopy.className = "quiz-card-copy";
			const cardTitle = document.createElement("span");
			cardTitle.className = "quiz-card-title";
			cardTitle.textContent = quiz.title;
			const metadata = document.createElement("span");
			metadata.className = "quiz-card-meta";
			metadata.textContent = quiz.description?.trim()
				? `${quiz.description.trim()} · ${formatQuizDate(quiz)}`
				: formatQuizDate(quiz);
			cardCopy.append(cardTitle, metadata);

			const cardAction = document.createElement("span");
			cardAction.className = "quiz-card-action";
			if (status === "opened") {
				cardAction.classList.add("status-pill", "status-pill-opened");
				cardAction.textContent = "Em andamento";
			} else if (status === "complete") {
				cardAction.classList.add("status-pill", "status-pill-complete");
				cardAction.textContent = "Jogar de novo";
			} else {
				cardAction.classList.add("card-arrow");
				cardAction.setAttribute("aria-hidden", "true");
				cardAction.textContent = "↗";
			}
			card.append(cardCopy, cardAction);
			list.append(card);
		}
		section.append(list);
	}

	page.append(header, section);
	return page;
}
