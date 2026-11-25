import Swal from "sweetalert2";

export async function showNoUnfinishedQuizzesAlert(): Promise<void> {
	await Swal.fire({
		title: "Nenhum quiz disponível",
		text: "Não há quizzes não finalizados para sortear.",
		icon: "info",
		confirmButtonText: "Entendi",
		buttonsStyling: false,
		customClass: {
			popup: "quiz-alert-popup",
			title: "quiz-alert-title",
		htmlContainer: "quiz-alert-copy",
			confirmButton: "quiz-alert-confirm",
		},
	});
}
