async function infiniteBlogs() {
	let nbItem = $(".blog-row").length,
		page = 1 + Math.floor(nbItem / 6),
		loader = $("#loader");
	loader.css("display", "block");
	await fetch(`/api/blog?page=${page}`)
		.then(function (response) {
			response.json().then(function (data) {
				if (!data.error) {
					if (data.length > 0) {
						data.forEach(blog => {
							let id = blog._id;
							if ($(`#${id}`).length === 0) {
								let div = document.createElement("div");
								div.setAttribute("class", "blog-row");
								div.setAttribute("id", id);
								let toAppend = `<h3 class="blog-title"><a href="/Blog/${id}">${blog.shorttitle}...</a></h3> `;
								toAppend += `
                        <p class="blog-info">posté par 
                        <b class="blog-author">${blog.author}</b>,
                        <i class="blog-date">${blog.date}</i>
                    </p>`;
								if (blog.thumbnail) {
									toAppend += `
                <div class="blog-overlay-wrapper">
                    ${blog.thumbnail}
                    <div class="blog-overlay">
                    <p>${blog.shortcontent}...</p>
                    <form action="/Blog/${id}"><button class="blog-btn">Lire plus</button></form>
                    </div>
                </div>
                `;
								} else {
									toAppend += `
                <div class="blog-no-overlay-wrapper">
                  <div class="blog-no-overlay">
                    <p>${blog.shortcontent}...</p>
                    <form action="/Blog/${id}"><button class="blog-btn">Lire plus</button></form>
                  </div>
                </div>
                `;
								}
								div.innerHTML = toAppend;
								id++;
								$("#container-blog").append(div);
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
		infiniteBlogs();
	}
});
