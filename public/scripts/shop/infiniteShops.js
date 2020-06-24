async function infiniteShopItems(tb) {
	let nbItem = $("#original > .card").length,
		page = 1 + Math.floor(nbItem / 3),
		loader = $("#loader");
	loader.css("display", "block");

	await fetch(`/api/shop?page=${page}`)
		.then(function (response) {
			response.json().then(function (data) {
				if (data.error === false) {
					if (data.shop.length > 0) {
						data.shop.forEach(shop => {
							let id = shop._id;
							if ($(`#${id}`).length === 0) {
								let div = document.createElement("div");
								div.setAttribute("class", "card");
								div.setAttribute("id", id);

								let toAppend = `
									<a class="card-img-expand" href="/Shop/${id}"><img src="/api/image/${shop.mainImgId}" class="card-img-top" alt="${shop.title}"></a>
									<div class="card-body">
										<h5 class="card-title"><i><a href="/Shop/${id}">${shop.shorttitle}</a></i></h5>
										<p class="card-text gallery-description mb-5">${shop.shortcontent}</p>
										<div class="row shop-price-row mt-4">
											<div class="shop-price-col col-6">
												<b class="card-price">${shop.price}€</b>
											</div>
											<div class="col-6">
												<input type="submit" class="logbtn" value="Ajouter au panier" onclick="cartAdd('${id}', this)">
											</div>
										</div>
									</div>`;

								div.innerHTML = toAppend;
								id++;
								$("#original").append(div);
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
				}
			});
		})
		.catch(err => {
			let alert = createAlertNode(err.message, "warning");
			addAlert(alert, "#header");
		});
	loader.css("display", "none");
}

$(window).scroll(function () {
	const val1 = Math.ceil($(window).scrollTop() + $(window).height());
	const val2 = $(document).height();

	if (val1 >= val2) {
		infiniteShopItems();
	}
});
