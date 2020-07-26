let toAppend = document.querySelector("#blogContent").value;
let contentHolder = document.getElementById("content-holder");

toAppend = toAppend
	.replace(/(\r\n|\n|\r)/gm, "")
	.replace(/&#34;/g, "\"")
	.replace(/&lt;/g, "<")
	.replace(/&gt;/g, ">");
contentHolder.innerHTML = toAppend;

contentHolder.querySelectorAll("img").forEach(item => {
	item.setAttribute("onclick", "expand(this)");

	let link = document.createElement("a");
	link.innerHTML = item.outerHTML;
	link.setAttribute("href", "#expand");

	item.parentNode.insertBefore(link, item);
	item.remove();
});
