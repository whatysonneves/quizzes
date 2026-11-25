// Carrega, valida e ordena os quizzes do projeto.
//
// Um quiz é um arquivo JSON em `src/quizzes/` chamado `yy-mm-dd-{slug}.json`;
// a data e o identificador do quiz vêm do nome do arquivo — o JSON não
// contém campo de data. Falhas de validação lançam erro claro no console/build.

export interface QuizQuestion {
	question: string;
	questionNote?: string;
	answer: string;
	answerNote?: string;
}

export interface QuizData {
	title: string;
	description?: string;
	questions: QuizQuestion[];
}

export interface QuizMeta {
	/** Parte slug do nome do arquivo — serve como ID do quiz. */
	slug: string;
	/** Prefixo da data (`yy-mm-dd`) — chave de ordenação. */
	datePrefix: string;
	/** Ano resolvido: `20` + yy. */
	year: number;
	/** Mês numérico (1–12). */
	month: number;
	/** Dia numérico. */
	day: number;
}

export interface QuizEntry extends QuizMeta {
	title: string;
	description?: string;
	questions: QuizQuestion[];
}

const FILE_NAME_RE = /^(\d{2})-(\d{2})-(\d{2})-(.+)\.json$/;

/**
 * Normaliza o slug do quiz: minúsculas, sem acentos, espaços/underscores
 * viram hífen. Retorna string vazia quando nada resta.
 */
export function normalizeSlug(raw: string): string {
	return raw
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // sem acentos
		.toLowerCase()
		.replace(/[\s_]+/g, "-");
}

function isValidDate(year: number, month: number, day: number): boolean {
	if (month < 1 || month > 12) return false;
	const utc = new Date(Date.UTC(year, month - 1, day));
	return (
		utc.getUTCFullYear() === year &&
		utc.getUTCMonth() === month - 1 &&
		utc.getUTCDate() === day
	);
}

/**
 * Extrai data e slug do nome do arquivo, validando o formato
 * `yy-mm-dd-{slug}.json` e a validade da data (ano de 2 dígitos lido como
 * `20yy`). Falha rápido com erro claro em nomes inválidos ou datas impossíveis.
 */
export function parseQuizFileName(fileName: string): QuizMeta {
	const match = FILE_NAME_RE.exec(fileName);
	if (!match) {
		throw new Error(
			`Nome de arquivo de quiz inválido: ${fileName}. Esperado o formato 'yy-mm-dd-{slug}.json' (ex.: 26-11-24-plurais-da-lingua-portuguesa.json).`,
		);
	}
	const year = 2000 + Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	if (!isValidDate(year, month, day)) {
		throw new Error(`Data inválida no nome do quiz: ${fileName}.`);
	}
	const slug = normalizeSlug(match[4]);
	if (!slug) {
		throw new Error(`Slug vazio no nome do quiz: ${fileName}.`);
	}
	return {
		slug,
		datePrefix: `${match[1]}-${match[2]}-${match[3]}`,
		year,
		month,
		day,
	};
}

/** Formata a data do quiz para exibição: `dd/mm/aaaa` (`yy` é lido como `20yy`). */
export function formatQuizDate(meta: QuizMeta): string {
	const pad = (n: number): string => String(n).padStart(2, "0");
	return `${pad(meta.day)}/${pad(meta.month)}/${meta.year}`;
}

function requireNonEmptyString(
	value: unknown,
	fileName: string,
	label: string,
): string {
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error(
			`Quiz ${fileName}: '${label}' deve ser uma string não vazia.`,
		);
	}
	return value;
}

function optionalString(
	value: unknown,
	fileName: string,
	label: string,
): string | undefined {
	if (value === undefined) return undefined;
	if (typeof value !== "string") {
		throw new Error(
			`Quiz ${fileName}: '${label}' deve ser uma string quando presente.`,
		);
	}
	return value;
}

function validateQuizData(data: unknown, fileName: string): QuizData {
	if (typeof data !== "object" || data === null || Array.isArray(data)) {
		throw new Error(
			`Quiz ${fileName}: o arquivo não contém um objeto JSON válido.`,
		);
	}
	const record = data as Record<string, unknown>;
	const description = optionalString(record.description, fileName, "description");
	const rawQuestions = record.questions;
	if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
		throw new Error(
			`Quiz ${fileName}: 'questions' deve ser um array não vazio.`,
		);
	}
	const questions: QuizQuestion[] = rawQuestions.map((item, index) => {
		if (typeof item !== "object" || item === null) {
			throw new Error(
				`Quiz ${fileName}: o item ${index} de 'questions' deve ser um objeto.`,
			);
		}
		const entry = item as Record<string, unknown>;
		const result: QuizQuestion = {
			question: requireNonEmptyString(
				entry.question,
				fileName,
				`questions[${index}].question`,
			),
			answer: requireNonEmptyString(
				entry.answer,
				fileName,
				`questions[${index}].answer`,
			),
		};
		const questionNote = optionalString(
			entry.questionNote,
			fileName,
			`questions[${index}].questionNote`,
		);
		const answerNote = optionalString(
			entry.answerNote,
			fileName,
			`questions[${index}].answerNote`,
		);
		if (questionNote !== undefined) result.questionNote = questionNote;
		if (answerNote !== undefined) result.answerNote = answerNote;
		return result;
	});
	return {
		title: requireNonEmptyString(record.title, fileName, "title"),
		...(description !== undefined ? { description } : {}),
		questions,
	};
}

/** Ordenação do PLAN.md: data do nome do arquivo `yy-mm-dd` desc, depois `title` A→Z, slug como desempate. */
function compareQuizzes(a: QuizEntry, b: QuizEntry): number {
	if (a.datePrefix !== b.datePrefix) {
		return a.datePrefix < b.datePrefix ? 1 : -1;
	}
	const byTitle = a.title.localeCompare(b.title);
	if (byTitle !== 0) return byTitle;
	return a.slug.localeCompare(b.slug);
}

/**
 * Carrega e valida todos os quizzes em `src/quizzes/` via `import.meta.glob`
 * e devolve a lista ordenada conforme o PLAN.md.
 */
export function loadQuizzes(): QuizEntry[] {
	const modules = import.meta.glob<QuizData>("../quizzes/*.json", {
		eager: true,
		import: "default",
	});
	const slugs = new Set<string>();
	const entries: QuizEntry[] = [];
	for (const [globPath, data] of Object.entries(modules)) {
		const fileName = globPath.split("/").pop() ?? globPath;
		const meta = parseQuizFileName(fileName);
		if (slugs.has(meta.slug)) {
			throw new Error(
				`Slug duplicado entre quizzes: '${meta.slug}' (arquivo ${fileName}).`,
			);
		}
		slugs.add(meta.slug);
		entries.push({ ...meta, ...validateQuizData(data, fileName) });
	}
	entries.sort(compareQuizzes);
	return entries;
}
