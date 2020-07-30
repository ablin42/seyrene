let loadbtn = document.querySelector("#infinitebtn");
let addClickEvent = function () {
	infiniteGalleries();
};
loadbtn.addEventListener("click", addClickEvent);

async function infiniteGalleries() {
	let nbItem = $(".expandable-card").length,
		page = 1 + Math.floor(nbItem / 12),
		loader = document.querySelector("#loader");
	if (loader) loader.classList.add("block");

	let data = await fetch(`/api/gallery?page=${page}`);
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
		infiniteGalleries();
	}
});

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
