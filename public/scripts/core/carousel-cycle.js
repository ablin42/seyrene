$("#carousel-thumb").on("slide.bs.carousel", function (element) {
	$("div.thumbnail-wrapper > ol > li.active").removeClass("active");
	$(`div.thumbnail-wrapper > ol > li:nth-child(${element.to + 1})`).addClass("active");
});
