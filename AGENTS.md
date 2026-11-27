# AGENTS.md — instruções para agentes

## Sobre o projeto

`Quizzes` é um app de flashcards **100% cliente**: Vite + TypeScript (vanilla, sem framework), sem backend, login ou sincronização. O progresso mora no `localStorage` do navegador e morre com ele. A home lista os quizzes; a tela de jogo mostra uma pergunta por vez e revela a resposta ao avançar.

Antes de mudar comportamento, leia o `README.md`. Sempre valide com `npm run build` — ele roda `tsc --noEmit` e `vite build`. Em `npm run dev`, um JSON novo em `src/quizzes/` aparece sem reiniciar; em produção, é preciso o build/deploy (o workflow `.github/workflows/deploy.yml` faz isso no push em `main`).

## Como criar arquivos de quiz

Crie `src/quizzes/yy-mm-dd-{slug}.json`. **Data e identificador vêm do nome do arquivo** — o JSON não tem campo de data.

- `yy-mm-dd`: três pares de dígitos, com data válida. `yy` é lido como `20yy` (ex.: `26-11-24-...` = 24/11/2026).
- `slug`: parte do nome após a data, normalizada (minúsculas, sem acentos, espaços/underscores viram `-`). É o **ID do quiz**: renomear o slug apaga o progresso salvo naquele navegador; trocar só a data mantém o progresso e muda a posição na lista.
- Slugs duplicados geram erro; nomes fora do formato ou datas impossíveis geram erro claro na validação.

Formato do JSON:

```json
{
	"title": "Título do quiz",
	"description": "Opcional; se não há o que dizer, omita.",
	"questions": [
		{
			"question": "Mal",
			"questionNote": "Mal de estar mal",
			"answer": "Males",
			"answerNote": "exemplo de observação"
		}
	]
}
```

- `title`: obrigatório, string não vazia.
- `description`: opcional (string; vazia não renderiza nada).
- `questions`: array obrigatório e não vazio. Cada item exige `question` e `answer` como strings não vazias.
- `questionNote` e `answerNote`: opcionais (strings).
- Chaves extras são ignoradas. A validação falha rápido; não tente "consertar" dados inválidos silenciosamente.

Ordem de exibição na home: data do nome (`yy-mm-dd`) **decrescente**, depois `title` A→Z, com `slug` como desempate final. Quizzes **concluídos aparecem por último**, preservando essa ordem dentro de cada grupo.

### Cuidado com quizzes já publicados

O ID de cada pergunta é o **índice (base 0) no array `questions`**. O navegador salva a ordem sorteada (`order`) e a última posição (`lastViewed`) como números. Reordenar, inserir ou remover perguntas faz esses índices apontarem para outras perguntas nos navegadores que já abriram o quiz. Evite editar a estrutura de quizzes publicados; se for inevitável, aceite que o progresso daquele quiz ficará inválido.

## Markdown nos quizzes

O renderizador (`src/lib/markdown.ts`) é **mínimo e seguro**: converte texto em nós do DOM, nunca usa `innerHTML`. Só estes recursos funcionam em `question`, `answer`, `questionNote` e `answerNote`:

| Sintaxe | Resultado |
| --- | --- |
| `**texto**` | **negrito** |
| `*texto*` | *itálico* |
| `_texto_` | sublinhado (só entre limites de palavra; evite em `snake_case`) |
| `` `texto` `` | código |
| quebra de linha no string | `<br>` |
| `\` antes de um marcador | escapa o marcador (texto literal) |

`title` e `description` **não** passam pelo Markdown — são texto puro. Todo o resto (headings, listas, links, imagens, tabelas, HTML) permanece como texto literal; não tente usá-los. Prefira notas curtas e uma linha por ideia.

### Convenções de uso do Markdown

Use cada marcador com intenção, sem exagero e sem combinar marcadores à toa:

- **Negrito** (`**...**`): palavras ou frases **diretamente ligadas à resposta** — o termo que se espera acertar ou a pista que aponta para ele.
- *Itálico* (`*...*`): qualquer palavra ou frase **fora do idioma do quiz**. Em quizzes em português, marque termos em inglês, latim, francês etc. (ex.: `*software*`, `*Homo sapiens*`).
- Sublinhado (`_..._`): palavras que **reforçam o critério ou estabelecem contraste** — negação, pertinência e extremos. Aplicar normalmente em `_não_`, `_faz parte_` / `_não faz parte_`, `_maior_`, `_menor_`, `_mais quente_`, `_menos quente_`. Use sobretudo quando o quiz pergunta os dois extremos da mesma coisa (qual é o maior continente? qual é o menor?), para destacar exatamente o que muda entre as perguntas.
- Código (`` `...` ``): qualquer código ou coisa "parecida com código" — comandos, identificadores, símbolos e dígitos usados como valores técnicos (ex.: `0` e `1` sobre binários).

Não marque a resposta inteira: destaque só o que ajuda a responder a questão.

## Estilo do conteúdo

- Idioma: português do Brasil.
- Respostas curtas e diretas.
- Use `questionNote` só quando a pergunta precisa de desambiguação ou contexto; use `answerNote` quando a resposta é complexa, tem exceção ou mais de uma resposta válida.
- Notas são auxílios ao entendimento da questão ou da resposta, não metacomentários: não escreva coisas como "resposta curta" na nota.
- Cada flashcard tem uma pergunta. Não há acerto/erro, pontuação ou múltipla escolha.

## Estrutura e persistência

- `src/lib/`: `quizzes.ts` (glob, validação, ordenação), `progress.ts` (persistência), `theme.ts`, `router.ts`, `markdown.ts`.
- `src/views/`: `home.ts`, `game.ts`, `restart-dialog.ts`, `resume-dialog.ts`, `alerts.ts`.
- `src/main.ts`: bootstrap, rotas e fluxo do jogo; `src/styles.css`: layout e temas.
- `localStorage`: `quizzes:progress:v1` → `{ [slug]: { order: number[]; status?: "opened" | "complete"; lastViewed?: number } }` e `quizzes:theme:v1` → `"auto" | "light" | "dark"`. Status ausente = nunca aberto; `opened` = em andamento; `complete` = concluído.
- Leitura de storage sempre com `try/catch` e validação de formato; dados corrompidos degeneram para estado vazio sem quebrar o app. Mudanças de formato exigem **nova chave versionada**, não reaproveitamento da v1.
- Ordem das perguntas: Fisher-Yates na primeira abertura de cada navegador, persistida e reutilizada (inclusive após recomeço). Não há novo shuffle ao reabrir.
- Rotas por hash: `#/`, `#/quiz/<slug>` e `#/quiz/<slug>/<pagina>` (compatível com GitHub Pages sem rewrites).
- Tema: ciclo `auto → light → dark → auto`, aplicado via `data-theme` no `<html>`.

## Convenções de código

- Siga o estilo dos arquivos existentes: tabulação com tabs, aspas duplas no TypeScript, nomes em camelCase.
- Sem frameworks, backend ou novas dependências sem necessidade real. SweetAlert2 e `@fontsource-variable/inter` já estão instalados e são usados pelos diálogos e pela tipografia.
- Ao adicionar recursos, mantenha o app funcional em mobile e nos três temas; reutilize as variáveis CSS existentes (`--page`, `--surface`, `--text`, `--muted`, `--line`, `--accent`, etc.) em vez de cores fixas.
- Deploy: CNAME `quizzes.sou.ninja`, `.nojekyll`, `base: '/'` e workflow de GitHub Actions. Não altere esses arquivos sem compreender o processo de publicação.
