let loadbtn = document.querySelector("#infinitebtn");
let addClickEvent = function () {
	infiniteBlogs();
};
loadbtn.addEventListener("click", addClickEvent);

let appends = document.querySelectorAll("input[data-append]");
appends.forEach(function (item) {
	let thumbnail = item.dataset.thumbnail;
	let toAppend = item.dataset.append
		.replace(/(\r\n|\n|\r)/gm, "")
		.replace(/&#34;/g, '"')
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">");
	document.getElementById(item.dataset.id).querySelector(".content-holder").innerHTML = toAppend;

	if (thumbnail) {
		thumbnail = thumbnail
			.replace(/(\r\n|\n|\r)/gm, "")
			.replace(/&#34;/g, '"')
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">");
		document.getElementById(item.dataset.id).querySelector(".blog-overlay-wrapper").innerHTML += thumbnail;
	}
});

async function infiniteBlogs() {
	let nbItem = $(".blog-row").length,
		page = 1 + Math.floor(nbItem / 6),
		loader = document.querySelector("#loader");
	if (loader) loader.classList.add("block");

	let data = await fetch(`/api/blog?page=${page}`);
	data = await data.json();

	if (data.error === false) {
		if (data.blogs && data.blogs.length > 0) {
			data.blogs.forEach(blog => {
				let id = blog._id;
				if ($(`#${id}`).length === 0) {
					let fc = document.createElement("div");
					let container = document.createElement("div");
					fc.setAttribute("class", "full-container blog-container");
					if ($(".blog-row").length % 2 === 0) fc.setAttribute("class", "full-container blog-container even");

					container.setAttribute("class", "container m-0");
					let div = document.createElement("div");
					div.setAttribute("class", "blog-row");
					div.setAttribute("id", id);

					let toAppend = `<h3 class="blog-title"><a href="/Blog/${id}">${blog.shorttitle}...</a></h3> `;
					toAppend += `
							<p class="blog-info mb-0">uploaded by
								<b class="blog-author">${blog.author}</b>,
								<i class="blog-date">${blog.date}</i>
							</p>`;
					if (blog.thumbnail) {
						toAppend += `
								<div class="blog-overlay-wrapper">
									${blog.thumbnail}
									<div class="blog-overlay">
									<p>${blog.shortcontent}...</p>
									<form class="text-center mt-1" action="/Blog/${id}"><button class="blog-btn">Read the full ticket</button></form>
									</div>
								</div>`;
					} else {
						toAppend += `
								<div class="blog-no-overlay-wrapper">
									<div class="blog-no-overlay">
										<p>${blog.shortcontent}...</p>
										<form class="text-center" action="/Blog/${id}"><button class="blog-btn">Read the full ticket</button></form>
									</div>
								</div>`;
					}
					div.innerHTML = toAppend;
					container.appendChild(div);
					fc.appendChild(container);
					id++;

					$("#container-blog").append(fc);
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
		infiniteBlogs();
	}
});
