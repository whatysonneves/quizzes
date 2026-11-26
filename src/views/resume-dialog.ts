import Swal from "sweetalert2";

export type ResumeChoice = "resume" | "restart" | "cancel";

/** Pergunta o que fazer com um quiz em andamento, sem alterar o progresso. */
export async function chooseResume(
	quizTitle: string,
	page: number,
): Promise<ResumeChoice> {
	const result = await Swal.fire({
		title: "Quiz em andamento",
		text: `“${quizTitle}” parou na pergunta ${page}. Continuar de onde parou ou começar do zero?`,
		icon: "question",
		showDenyButton: true,
		showCancelButton: true,
		confirmButtonText: "Continuar",
		denyButtonText: "Recomeçar",
		cancelButtonText: "Voltar à lista",
		reverseButtons: true,
		focusCancel: true,
		buttonsStyling: false,
		customClass: {
			popup: "quiz-alert-popup",
			title: "quiz-alert-title",
			htmlContainer: "quiz-alert-copy",
			confirmButton: "quiz-alert-confirm",
			denyButton: "quiz-alert-deny",
			cancelButton: "quiz-alert-cancel",
		},
	});

	if (result.isConfirmed) return "resume";
	if (result.isDenied) return "restart";
	return "cancel";
}
