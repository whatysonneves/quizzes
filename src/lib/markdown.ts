// Markdown mínimo para flashcards: **negrito**, *itálico*, _sublinhado_ e
// `código`. Nunca usa innerHTML: tudo vira nó do DOM, então texto de quiz não
// pode injetar HTML.

const PAIRS = [
	{ marker: "**", tag: "strong" },
	{ marker: "*", tag: "em" },
	{ marker: "_", tag: "u" },
] as const;

const WORD_CHAR = /[\p{L}\p{N}]/u;

function appendInline(parent: Node, source: string, depth: number): void {
	if (depth > 6) {
		parent.appendChild(document.createTextNode(source));
		return;
	}

	let buffer = "";
	const flush = (): void => {
		if (buffer) {
			parent.appendChild(document.createTextNode(buffer));
			buffer = "";
		}
	};

	for (let index = 0; index < source.length; ) {
		const char = source[index];

		if (char === "\\" && index + 1 < source.length) {
			buffer += source[index + 1];
			index += 2;
			continue;
		}

		if (char === "\n") {
			flush();
			parent.appendChild(document.createElement("br"));
			index += 1;
			continue;
		}

		if (char === "`") {
			const end = source.indexOf("`", index + 1);
			if (end > index + 1) {
				flush();
				const code = document.createElement("code");
				code.textContent = source.slice(index + 1, end);
				parent.appendChild(code);
				index = end + 1;
				continue;
			}
		}

		let matched = false;
		for (const pair of PAIRS) {
			if (!source.startsWith(pair.marker, index)) continue;
			const start = index + pair.marker.length;
			const end = source.indexOf(pair.marker, start);
			if (end <= start) continue;
			if (pair.marker === "_") {
				const before = index > 0 ? source[index - 1] : "";
				const after = source[end + pair.marker.length] ?? "";
				if (WORD_CHAR.test(before) || WORD_CHAR.test(after)) continue;
			}
			flush();
			const element = document.createElement(pair.tag);
			appendInline(element, source.slice(start, end), depth + 1);
			parent.appendChild(element);
			index = end + pair.marker.length;
			matched = true;
			break;
		}
		if (matched) continue;

		buffer += char;
		index += 1;
	}

	flush();
}

/** Renderiza o markdown aceito dentro de `target`, substituindo o conteúdo atual. */
export function renderMarkdown(target: HTMLElement, source: string): void {
	target.replaceChildren();
	appendInline(target, source, 0);
}
