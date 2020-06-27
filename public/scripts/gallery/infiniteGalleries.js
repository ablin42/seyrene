async function infiniteGalleries() {
	let nbItem = $(".expandable-card").length,
		page = 1 + Math.floor(nbItem / 6),
		loader = $("#loader");
	loader.css("display", "block");

	let data = await fetch(`/api/gallery?page=${page}`);
	data = await data.json();

	if (data.error === false) {
		if (data.galleries.length > 0) {
			data.galleries.forEach(gallery => {
				let id = gallery._id;
				if ($(`#${id}`).length === 0) {
					let div = document.createElement("div");
					div.setAttribute("class", "expandable-card");
					div.setAttribute("id", id);

					toAppend = `
									<div class="face face1 blog-overlay-wrapper mt-0">
										<a href="#expand">
											<img onclick="expand(this);" src="/api/image/${gallery.mainImgId}" class="w-100" alt="${gallery.shorttitle}">
										</a>
									
									<div class="blog-overlay">
										<h4><i><a href="/Galerie/${id}">${gallery.shorttitle}</a></i></h4>
										<div class="gallery-tags mt-5">`;

					gallery.tags.forEach(tag => {
						toAppend += ` <a href="/Galerie/Tags?t=${tag}">#${tag}</a>`;
					});
					toAppend += `   </div>
											<form action="/Galerie/${id}"><button class="blog-btn">Lire plus</button></form>
											</div></div>`;
					div.innerHTML = toAppend;
					$("#container-gallery").append(div);
				} else {
					$("#infinitebtn").val("Nothing more to load");
					$("#infinitebtn").attr("disabled");
					$("#infinitebtn").attr("onclick", "");
				}
			});
		} else {
			$("#infinitebtn").val("Nothing more to load");
			$("#infinitebtn").attr("disabled");
			$("#infinitebtn").attr("onclick", "");
		}
	} else {
		let alert = createAlertNode(data.message, "warning");
		addAlert(alert, "#header");
	}
	loader.css("display", "none");
}

$(window).scroll(function () {
	const val1 = Math.ceil($(window).scrollTop() + $(window).height());
	const val2 = $(document).height();
	if (val1 >= val2) {
		infiniteGalleries();
	}
});
