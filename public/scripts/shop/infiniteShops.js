let loadbtn = document.querySelector("#infinitebtn");
let addClickEvent = function () {
	infiniteShopItems();
};
loadbtn.addEventListener("click", addClickEvent);

let callToGallery = document.querySelector("#goto-gallery");

if (callToGallery)
	callToGallery.addEventListener("click", function () {
		window.location.href = "/Galerie";
	});

async function infiniteShopItems(tb) {
	let nbItem = $("#original > .card").length,
		page = 1 + Math.floor(nbItem / 3),
		loader = document.querySelector("#loader");
	if (loader) loader.classList.add("block");

	let data = await fetch(`/api/shop?page=${page}`);
	data = await data.json();

	if (data.error === false) {
		if (data.shop && data.shop.length > 0) {
			data.shop.forEach(shop => {
				let id = shop._id;
				if ($(`#${id}`).length === 0) {
					let div = document.createElement("div");
					div.setAttribute("class", "card");
					div.setAttribute("id", id);

					let toAppend = `
									<a class="card-img-expand" href="/Shop/${id}"><img src="${shop.mainImgPath}" class="card-img-top" alt="Gallery Paiting - ${shop.title}"></a>
									<div class="card-body">
										<h5 class="card-title"><i><a href="/Shop/${id}">${shop.shorttitle}</a></i></h5>
										<p class="card-text gallery-description mb-5">${shop.shortcontent}</p>
										<div class="row shop-price-row mt-4">
											<div class="shop-price-col col-6">
												<b class="card-price">${shop.price}€</b>
											</div>
											<div class="col-6">
												<input type="submit" data-addcart="${id}" class="submit-btn" value="Add to cart" />
											</div>
										</div>
									</div>`;

					div.innerHTML = toAppend;
					id++;
					$("#original").append(div);
					createListener();
				} else {
					$("#infinitebtn").val("Nothing more to load");
					$("#infinitebtn").attr("disabled");
					loadbtn.removeEventListener("click", addClickEvent);
					if (loader) loader.remove();
				}
			});
		} else {
			$("#infinitebtn").val("Nothing more to load");
			$("#infinitebtn").attr("disabled");
			loadbtn.removeEventListener("click", addClickEvent);
			if (loader) loader.remove();
		}
	}
	if (loader) loader.classList.remove("block");
}

$(window).scroll(function () {
	const val1 = Math.ceil($(window).scrollTop() + $(window).height());
	const val2 = $(document).height();

	if (val1 >= val2) {
		infiniteShopItems();
	}
});

function createListener() {
	setTimeout(function () {
		let addUnique = $("input[data-addcart]");
		addUnique.each(function (i, btn) {
			$(this).on("click", function (e) {
				cartAdd(btn.dataset.addcart, btn);
			});
		});
	}, 200);
}
