let loadbtn = document.querySelector("#infinitebtn");
let addClickEvent = function () {
	infiniteTags();
};
loadbtn.addEventListener("click", addClickEvent);

async function infiniteTags() {
	let nbItem = $(".expandable-card").length,
		page = 1 + Math.floor(nbItem / 12),
		loader = document.querySelector("#loader"),
		urlToFetch = `/api/gallery/tags?page=${page}`,
		parsedURL = new URL(window.location.href),
		tagsParam = parsedURL.searchParams.get("t");

	if (loader) loader.classList.add("block");
	if (tagsParam) urlToFetch += `&t=${tagsParam}`;
	else urlToFetch = `/api/gallery/?page=${page}`;

	let data = await fetch(urlToFetch);
	data = await data.json();
	if (data.error === false) {
		if (data.galleries && data.galleries.length > 0) {
			data.galleries.forEach(gallery => {
				let id = gallery._id;
				if ($(`#${id}`).length === 0) {
					let div = document.createElement("div");
					div.setAttribute("class", "expandable-card");
					div.setAttribute("id", id);
					toAppend = `
                           	<div class="face face1 blog-overlay-wrapper mt-0">
										<a href="#expand">
											<img data-imgid="${gallery.mainImgId}" src="/api/image/${gallery.mainImgId}" class="w-100 expandable" alt="${gallery.shorttitle}">
										</a>
                            
                          <div class="blog-overlay expandable" data-id="${gallery.mainImgId}" data-isGallery="true">
                                <h4><i><a href="/Galerie/${id}">${gallery.shorttitle}</a></i></h4>
                                <div class="gallery-tags mt-2">`;

					gallery.tags.forEach(tag => {
						toAppend += ` <a href="/Galerie/Tags?t=${tag}">#${tag}</a>`;
					});
					toAppend += `   </div>
                                            <form action="/Galerie/${id}"><button class="blog-btn">See More</button></form>
                                            </div></div>`;
					div.innerHTML = toAppend;
					$("#container-gallery").append(div);
				} else {
					$("#infinitebtn").val("Nothing more to load");
					$("#infinitebtn").attr("disabled");
					loadbtn.removeEventListener("click", addClickEvent);
					if (loader) loader.remove();
				}
			});
			createListener();
		} else {
			$("#infinitebtn").val("Nothing more to load");
			$("#infinitebtn").attr("disabled");
			loadbtn.removeEventListener("click", addClickEvent);
			if (loader) loader.remove();
		}
	} else {
		let alert = createAlertNode(data.message, "warning");
		addAlert(alert, "#header");
	}
	if (loader) loader.classList.remove("block");
}

$(window).scroll(function () {
	const val1 = Math.ceil($(window).scrollTop() + $(window).height());
	const val2 = $(document).height();
	if (val1 >= val2) {
		infiniteTags();
	}
});

async function filterByTags(e) {
	e.preventDefault();

	let tagInput = document.getElementsByClassName("label-info"),
		tags = "";

	if (tagInput.length > 0) {
		tags = "?t=";
		for (let i = 0; i < tagInput.length; i++) {
			if (i + 1 === tagInput.length) tags += tagInput[parseInt(i)].textContent;
			else tags += tagInput[parseInt(i)].textContent + ",";
		}
	}

	window.location.href = `/Galerie/Tags${tags}`;
}

function preventEnter(e, item) {
	let keyCode = e.keyCode || e.which;
	if (keyCode === 13) {
		e.preventDefault();
		return false;
	}
}

function createListener() {
	setTimeout(function () {
		let imgExp = $(".expandable");
		imgExp.each(function (i, img) {
			let isGallery = false;
			if ($(this).data("isgallery")) isGallery = true;
			let target = img;
			if ($(this).data("id")) target = $(this).data("id");

			$(this).on("click", function (e) {
				expand(target, e, isGallery);
			});
		});
	}, 200);
}
