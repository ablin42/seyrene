let showPw = document.querySelectorAll("[data-showpw]");

if (showPw) {
	showPw.forEach(item => {
		let currTarget = item.dataset.showpw;
		let currItem = item;
		item.addEventListener("click", function () {
			var target = document.getElementById(currTarget);
			if (target.type === "password") {
				currItem.classList.add("active-showpw");
				target.type = "text";
			} else {
				currItem.classList.remove("active-showpw");
				target.type = "password";
			}
		});
	});
}
