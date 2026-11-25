import Swal from "sweetalert2";

/** Confirma o reinício sem alterar o progresso até a pessoa confirmar. */
export async function confirmRestart(quizTitle: string): Promise<boolean> {
	const result = await Swal.fire({
		title: "Jogar de novo?",
		text: `“${quizTitle}” já foi concluído. Quer recomeçar?`,
		icon: "question",
		showCancelButton: true,
		confirmButtonText: "Recomeçar",
		cancelButtonText: "Voltar à lista",
		reverseButtons: true,
		focusCancel: true,
		buttonsStyling: false,
		customClass: {
			popup: "quiz-alert-popup",
			title: "quiz-alert-title",
			htmlContainer: "quiz-alert-copy",
			confirmButton: "quiz-alert-confirm",
			cancelButton: "quiz-alert-cancel",
		},
	});
	return result.isConfirmed;
}
