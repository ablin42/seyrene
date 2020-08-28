let posttags = document.querySelector("form[data-posttags]");
let tagform = document.querySelector("form[data-tagform]");

function preventEnter(e, item) {
	let keyCode = e.keyCode || e.which;
	if (keyCode === 13) {
		e.preventDefault();
		return false;
	}
}

tagform.addEventListener("keydown", function (e) {
	preventEnter(e, tagform);
});

if (posttags)
	posttags.addEventListener("submit", function (e) {
		filterByTags(e);
	});

let tagInput = $("#tagInput");
let tags = $("#tagscontent").val();
if (tags) tags = tags.split(",");

if (tagInput) {
	tagInput.tagsinput("add", "");
	if (tags) for (i = 0; i < tags.length; i++) tagInput.tagsinput("add", tags[i]);
}
