const toolbarOptions = [
	["bold", "italic", "underline", "strike"],
	["blockquote", "code-block"],
	[{ list: "ordered" }, { list: "bullet" }],
	[{ indent: "-1" }, { indent: "+1" }],
	[{ size: ["small", false, "large", "huge"] }],
	[{ header: [1, 2, 3, 4, 5, 6, false] }],
	[
		{ color: ["black", "white", "red", "orange", "yellow", "green", "blue", "purple"] },
		{ background: ["black", "white", "red", "orange", "yellow", "green", "blue", "purple"] }
	],
	[{ font: [] }],
	[{ align: [] }],
	["link", "image"],
	["clean"]
];
let formDataContent = document.getElementById("blogFormData");
if (formDataContent) formDataContent = formDataContent.value;
let editor = document.getElementById("editor");

editor.addEventListener("keyup", function () {
	saveContent();
});

var BackgroundClass = Quill.import("attributors/class/background");
var ColorClass = Quill.import("attributors/class/color");
var SizeStyle = Quill.import("attributors/class/size");
Quill.register(BackgroundClass, true);
Quill.register(ColorClass, true);
Quill.register(SizeStyle, true);

let quill = new Quill("#editor", {
	modules: {
		toolbar: toolbarOptions
	},
	placeholder: "Le contenu de votre ticket de blog...",
	theme: "snow"
});

if (formDataContent) {
	formatted = formDataContent
		.replace(/(\r\n|\n|\r)/gm, "")
		.replace(/&#34;/g, '"')
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">");
	delta = quill.clipboard.convert(toAppend);
	quill.setContents(delta, "silent");
}

const saveButton = document.getElementById("submit-blog");
const editorData = document.getElementById("content");

saveButton.addEventListener("click", event => {
	editorData.value = quill.root.innerHTML;
});

function saveContent() {
	editorData.value = quill.root.innerHTML;
	Validate.String(editorData, 128);
}
