import { formatQuizDate, type QuizEntry } from "../lib/quizzes";
import { type QuizProgress } from "../lib/progress";
import { type Theme } from "../lib/theme";

const AUTHOR_URL = "https://whatysonneves.com/";
const GITHUB_URL = "https://github.com/whatysonneves/quizzes";

export interface HomeViewOptions {
	quizzes: QuizEntry[];
	progress: Record<string, QuizProgress>;
	theme: Theme;
	onOpenQuiz: (slug: string) => void;
	onRandomQuiz: () => void;
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
	const actions = document.createElement("div");
	actions.className = "home-list-actions";
	const counts = document.createElement("span");
	counts.className = "home-counts";
	const quizCount = document.createElement("span");
	quizCount.textContent = `${options.quizzes.length} ${options.quizzes.length === 1 ? "quiz" : "quizzes"}`;
	const totalQuestions = options.quizzes.reduce(
		(sum, quiz) => sum + quiz.questions.length,
		0,
	);
	const questionCount = document.createElement("span");
	questionCount.textContent = `${totalQuestions} ${totalQuestions === 1 ? "pergunta" : "perguntas"}`;
	counts.append(quizCount, " · ", questionCount);
	const randomButton = document.createElement("button");
	randomButton.type = "button";
	randomButton.className = "theme-toggle random-quiz-button";
	randomButton.innerHTML = '<span aria-hidden="true">🎲</span><span>Sortear quiz</span>';
	randomButton.addEventListener("click", options.onRandomQuiz);
	actions.append(counts, randomButton);
	sectionHeading.append(heading, actions);
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
			const questionCount = quiz.questions.length;
			const card = document.createElement("div");
			card.className = `quiz-card${status === "opened" ? " is-opened" : ""}${status === "complete" ? " is-complete" : ""}`;

			let pointerStart: { x: number; y: number } | null = null;
			card.addEventListener("pointerdown", (event) => {
				pointerStart = { x: event.clientX, y: event.clientY };
			});
			card.addEventListener("click", (event) => {
				const selection = window.getSelection();
				if (selection && selection.toString().trim() !== "") return;
				if (pointerStart) {
					const moved = Math.hypot(
						event.clientX - pointerStart.x,
						event.clientY - pointerStart.y,
					);
					pointerStart = null;
					if (moved > 6) return;
				}
				options.onOpenQuiz(quiz.slug);
			});

			const count = document.createElement("span");
			count.className = "quiz-card-count";
			count.textContent = String(questionCount);

			const countLabel = document.createElement("span");
			countLabel.className = "quiz-card-count-label";
			countLabel.textContent = questionCount === 1 ? "pergunta" : "perguntas";

			let miniProgress: HTMLElement | null = null;
			const lastViewed = options.progress[quiz.slug]?.lastViewed;
			if (status === "opened" && typeof lastViewed === "number") {
				const viewed = Math.min(Math.max(lastViewed, 0), questionCount);
				miniProgress = document.createElement("div");
				miniProgress.className = "quiz-card-progress";
				miniProgress.setAttribute("role", "progressbar");
				miniProgress.setAttribute(
					"aria-label",
					`Progresso de ${quiz.title}: ${viewed} de ${questionCount} perguntas`,
				);
				miniProgress.setAttribute("aria-valuemin", "0");
				miniProgress.setAttribute("aria-valuemax", String(questionCount));
				miniProgress.setAttribute("aria-valuenow", String(viewed));
				const fill = document.createElement("span");
				fill.className = "quiz-card-progress-fill";
				fill.style.width = `${questionCount > 0 ? (viewed / questionCount) * 100 : 0}%`;
				miniProgress.append(fill);
			}

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

			const openButton = document.createElement("button");
			openButton.type = "button";
			openButton.className = "quiz-open-button";
			const openIcon = document.createElement("span");
			openIcon.className = "quiz-open-icon";
			openIcon.setAttribute("aria-hidden", "true");
			openIcon.textContent = "↗";
			const statusLabel =
				status === "complete"
					? "Jogar de novo"
					: status === "opened"
						? "Em andamento"
						: null;
			if (statusLabel) {
				openButton.classList.add("has-status");
				const visibleLabel = document.createElement("span");
				visibleLabel.className = "quiz-open-label";
				visibleLabel.textContent = statusLabel;
				openButton.append(openIcon, visibleLabel);
				openButton.setAttribute("aria-label", `${statusLabel}: ${quiz.title}`);
			} else {
				const openLabel = document.createElement("span");
				openLabel.className = "sr-only";
				openLabel.textContent = `Abrir: ${quiz.title}`;
				openButton.append(openIcon, openLabel);
			}

			card.append(count, countLabel, cardCopy, openButton);
			if (miniProgress) card.append(miniProgress);
			list.append(card);
		}
		section.append(list);
	}

	const footer = document.createElement("footer");
	footer.className = "site-footer";
	const footerCopy = document.createElement("p");
	footerCopy.className = "site-footer-copy";
	const authorLink = document.createElement("a");
	authorLink.className = "site-footer-link";
	authorLink.href = AUTHOR_URL;
	authorLink.target = "_blank";
	authorLink.rel = "noopener noreferrer";
	authorLink.textContent = "Whatyson Neves";
	const footerLink = document.createElement("a");
	footerLink.className = "site-footer-link";
	footerLink.href = GITHUB_URL;
	footerLink.target = "_blank";
	footerLink.rel = "noopener noreferrer";
	footerLink.textContent = "GitHub";
	footerCopy.append("Criado por ", authorLink, " · Projeto open source · ", footerLink);
	footer.append(footerCopy);

	page.append(header, section, footer);
	return page;
}
