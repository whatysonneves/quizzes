# quizzes.sou.ninja

App de quiz com flashcards no navegador. Sem backend, sem login, sem sincronização: o progresso mora no `localStorage` e morre com ele.

## Rodar

```bash
npm install
npm run dev
```

`npm run build` gera `dist/`; `npm run preview` serve o resultado.

## Adicionar um quiz

Crie `src/quizzes/yy-mm-dd-{slug}.json`:

```json
{
	"title": "Título do quiz",
	"description": "Opcional. Se não há o que dizer, não diga.",
	"questions": [
		{
			"question": "Mal",
			"questionNote": "Mal de estar mal",
			"answer": "Males"
		},
		{
			"question": "Vírus",
			"answer": "Vírus",
			"answerNote": "não muda"
		}
	]
}
```

`questionNote` e `answerNote` são opcionais.

Em pergunta, resposta e notas, aceito markdown mínimo: `**negrito**`, `*itálico*`, `_sublinhado_`, `` `código` `` e quebra de linha. O resto é texto puro.

A ordem das perguntas é sorteada uma vez por navegador e depois congela. Se você reordenar o array `questions`, os navegadores que já abriram o quiz continuarão usando a ordem antiga com os índices novos.

Ao abrir um quiz em andamento, um modal pergunta se quer continuar de onde parou ou começar do zero. Quiz concluído tem modal próprio.

O botão **Sortear quiz** é a exceção: se o quiz sorteado estiver em andamento, ele ignora o modal e segue direto para a última posição salva.

Renomear o slug apaga o progresso daquele quiz naquele navegador. Trocar apenas a data do prefixo não apaga, mas muda a posição na lista. O ano de dois dígitos é lido como `20yy`; século XIX fica para o próximo sprint.
