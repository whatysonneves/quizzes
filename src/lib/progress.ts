// Persistência local do progresso dos quizzes: ordem das perguntas e estados.
//
// Chaves com prefixo versionado (`quizzes:progress:v1`); tudo fica no
// localStorage daquele navegador, sem identificação do usuário. Leitura é
// sempre com try/catch + validação do formato: dados corrompidos ou
// localStorage indisponível degeneram para estado vazio, sem quebrar o app.

export type QuizStatus = "opened" | "complete";

export interface QuizProgress {
	/** Índices originais, na ordem sorteada. */
	order: number[];
	/** Ausente = nunca aberto; `opened` = aberto parcial; `complete` = concluído. */
	status?: QuizStatus;
}

const STORAGE_KEY = "quizzes:progress:v1";

function readMap(): Record<string, QuizProgress> {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (raw === null) return {};
		const parsed: unknown = JSON.parse(raw);
		if (
			typeof parsed !== "object" ||
			parsed === null ||
			Array.isArray(parsed)
		) {
			return {};
		}
		const out: Record<string, QuizProgress> = {};
		for (const [slug, value] of Object.entries(
			parsed as Record<string, unknown>,
		)) {
			if (typeof value !== "object" || value === null) continue;
			const entry = value as Record<string, unknown>;
			if (!Array.isArray(entry.order) || entry.order.some(isNotNumber)) {
				continue;
			}
			if (
				entry.status !== undefined &&
				entry.status !== "opened" &&
				entry.status !== "complete"
			) {
				continue;
			}
			const progress: QuizProgress = { order: entry.order as number[] };
			if (entry.status === "opened" || entry.status === "complete") {
				progress.status = entry.status;
			}
			out[slug] = progress;
		}
		return out;
	} catch {
		return {};
	}
}

function isNotNumber(value: unknown): boolean {
	return typeof value !== "number";
}

function isPermutation(order: number[], questionCount: number): boolean {
	if (order.length !== questionCount) return false;
	const seen = new Set<number>();
	for (const index of order) {
		if (!Number.isInteger(index) || index < 0 || index >= questionCount) {
			return false;
		}
		seen.add(index);
	}
	return seen.size === questionCount;
}

/** Mapa de progresso por slug — slug ausente ou `status` ausente significa não aberto. */
export function loadProgress(): Record<string, QuizProgress> {
	return readMap();
}

/** Ordem persistida válida para o quiz — `null` se não existe ou é inválida (ex.: o JSON mudou). */
export function getOrder(slug: string, questionCount: number): number[] | null {
	const entry = readMap()[slug];
	if (!entry || !isPermutation(entry.order, questionCount)) return null;
	return entry.order;
}

/** Salva a ordem persistida do quiz (preservando `status`). */
export function saveOrder(slug: string, order: number[]): void {
	try {
		const map = readMap();
		map[slug] = { ...map[slug], order };
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
	} catch {
		// storage indisponível: a ordem não persiste, o app continua em memória
	}
}

/** Status salvo do quiz: ausente = nunca aberto. */
export function getStatus(slug: string): QuizStatus | undefined {
	return readMap()[slug]?.status;
}

/** Registra o estado do quiz (`opened` = aberto parcial, `complete` = concluído). */
export function setStatus(slug: string, status: QuizStatus): void {
	try {
		const map = readMap();
		const current = map[slug];
		map[slug] = current ? { ...current, status } : { order: [], status };
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
	} catch {
		// storage indisponível: o estado não persiste, o app continua em memória
	}
}
