import { renderMarkdown } from "../lib/markdown";
import type { QuizEntry, QuizQuestion } from "../lib/quizzes";
import type { Theme } from "../lib/theme";

export interface GameViewOptions {
	quiz: QuizEntry;
	question: QuizQuestion;
	current: number;
	total: number;
	answerVisible: boolean;
	theme: Theme;
	onGoHome: () => void;
	onBack: () => void;
	onAdvance: () => void;
	onToggleTheme: () => void;
}

function themeLabel(theme: Theme): string {
	return theme === "auto" ? "Automático" : theme === "light" ? "Claro" : "Escuro";
}

export function renderGame(options: GameViewOptions): HTMLElement {
	const page = document.createElement("main");
	page.className = "game-page";

	const header = document.createElement("header");
	header.className = "game-header";
	const headingGroup = document.createElement("div");
	headingGroup.className = "game-heading-group";
	const homeButton = document.createElement("button");
	homeButton.type = "button";
	homeButton.className = "game-home-button";
	homeButton.setAttribute("aria-label", "Voltar ao início do app");
	homeButton.title = "Voltar ao início do app";
	homeButton.textContent = "←";
	homeButton.addEventListener("click", options.onGoHome);
	const titleBlock = document.createElement("div");
	titleBlock.className = "game-title-block";
	const title = document.createElement("h1");
	title.className = "game-title";
	title.textContent = options.quiz.title;
	titleBlock.append(title);
	if (options.quiz.description?.trim()) {
		const description = document.createElement("p");
		description.className = "game-description";
		description.textContent = options.quiz.description;
		titleBlock.append(description);
	}
	const themeButton = document.createElement("button");
	themeButton.type = "button";
	themeButton.className = "theme-toggle game-theme-toggle";
	themeButton.setAttribute("aria-label", `Tema ${themeLabel(options.theme)}. Alterar tema`);
	themeButton.innerHTML = `<span aria-hidden="true">${options.theme === "dark" ? "☾" : options.theme === "light" ? "☀" : "◐"}</span><span>${themeLabel(options.theme)}</span>`;
	themeButton.addEventListener("click", options.onToggleTheme);
	headingGroup.append(homeButton, titleBlock);
	header.append(headingGroup, themeButton);

	const progress = document.createElement("div");
	progress.className = "game-progress";
	progress.setAttribute("role", "group");
	progress.setAttribute("aria-label", `Pergunta ${options.current} de ${options.total}`);
	const progressLabel = document.createElement("span");
	progressLabel.className = "progress-label";
	progressLabel.textContent = `Pergunta ${options.current} de ${options.total}`;
	const progressTrack = document.createElement("div");
	progressTrack.className = "progress-track";
	progressTrack.setAttribute("role", "progressbar");
	progressTrack.setAttribute("aria-label", "Progresso do quiz");
	progressTrack.setAttribute("aria-valuemin", "1");
	progressTrack.setAttribute("aria-valuemax", String(options.total));
	progressTrack.setAttribute("aria-valuenow", String(options.current));
	const progressFill = document.createElement("span");
	progressFill.className = "progress-fill";
	progressFill.style.width = `${(options.current / options.total) * 100}%`;
	progressTrack.append(progressFill);
	progress.append(progressLabel, progressTrack);

	const card = document.createElement("section");
	card.className = `flashcard${options.answerVisible ? " answer-visible" : ""}`;
	card.setAttribute("aria-live", "polite");
	const promptLabel = document.createElement("p");
	promptLabel.className = "flashcard-eyebrow";
	promptLabel.textContent = "Pergunta";
	const question = document.createElement("h2");
	question.className = "flashcard-question";
	renderMarkdown(question, options.question.question);
	card.append(promptLabel, question);
	if (options.question.questionNote?.trim()) {
		const note = document.createElement("p");
		note.className = "flashcard-note question-note";
		renderMarkdown(note, options.question.questionNote);
		card.append(note);
	}
	if (options.answerVisible) {
		const answer = document.createElement("div");
		answer.className = "flashcard-answer-block";
		const divider = document.createElement("span");
		divider.className = "answer-divider";
		divider.setAttribute("aria-hidden", "true");
		const answerLabel = document.createElement("p");
		answerLabel.className = "flashcard-eyebrow answer-eyebrow";
		answerLabel.textContent = "Resposta";
		const answerText = document.createElement("p");
		answerText.className = "flashcard-answer";
		renderMarkdown(answerText, options.question.answer);
		answer.append(divider, answerLabel, answerText);
		if (options.question.answerNote?.trim()) {
			const note = document.createElement("p");
			note.className = "flashcard-note answer-note";
			renderMarkdown(note, options.question.answerNote);
			answer.append(note);
		}
		card.append(answer);
	}

	const controls = document.createElement("nav");
	controls.className = "game-controls";
	controls.setAttribute("aria-label", "Navegação do quiz");
	const back = document.createElement("button");
	back.type = "button";
	back.className = "game-control game-control-back";
	back.textContent = options.answerVisible
		? "Voltar à pergunta"
		: options.current === 1 ? "Voltar à lista" : "Voltar";
	back.addEventListener("click", options.onBack);
	const advance = document.createElement("button");
	advance.type = "button";
	advance.className = "game-control game-control-advance";
	advance.textContent = options.answerVisible
		? options.current === options.total ? "Concluir quiz" : "Próxima pergunta"
		: "Ver resposta";
	advance.addEventListener("click", options.onAdvance);
	controls.append(back, advance);

	page.append(header, progress, card, controls);
	return page;
}
