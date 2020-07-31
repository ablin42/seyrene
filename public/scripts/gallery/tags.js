let posttags = document.querySelector("form[data-posttags]");

if (posttags)
	posttags.addEventListener("submit", function (e) {
		filterByTags(e);
	});

let tagInput = $("#tagInput");
let tags = $("#tagscontent").val();
tags = tags.split(",");

tagInput.tagsinput("add", "");
for (i = 0; i < tags.length; i++) tagInput.tagsinput("add", tags[i]);
