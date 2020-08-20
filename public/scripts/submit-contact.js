const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
let form = document.querySelector("#contact");

// Cache selectors
var topMenu = $("#top-menu"),
    topMenuHeight = topMenu.outerHeight()+15,
    // All list items
    menuItems = topMenu.find("a"),
    // Anchors corresponding to menu items
    scrollItems = menuItems.map(function(){
      var item = $($(this).attr("href"));
      if (item.length) { return item; }
    });


// Bind to scroll
$(window).scroll(function(){
   // Get container scroll position
   var fromTop = $(this).scrollTop()+topMenuHeight;

   // Get id of current scroll item
   var cur = scrollItems.map(function(){
     if ($(this).offset().top < fromTop)
       return this;
   });
   // Get the id of the current element
   cur = cur[cur.length-1];
   var id = cur && cur.length ? cur[0].id : "";

   // Set/remove active class
   menuItems
     .removeClass("active")
     .filter("[href='#"+id+"']").addClass("active");

		if($(window).scrollTop() + $(window).height() == $(document).height()) {
			menuItems.removeClass("active")
			menuItems[menuItems.length - 1].classList.add("active");
		}
});

let callToGallery = document.querySelector("#goto-gallery");
let callToBlog = document.querySelector("#goto-blog");

if (callToBlog)
	callToBlog.addEventListener("click", function () {
		window.location.href = "/Blog";
	});

if (callToGallery)
	callToGallery.addEventListener("click", function () {
		window.location.href = "/Galerie";
	});

if (form)
	form.addEventListener("submit", function (e) {
		submitContact(e);
	});

async function submitContact(e) {
	e.preventDefault();

	const name = document.querySelector("#name").value;
	const email = document.querySelector("#email").value;
	const title = document.querySelector("#title").value;
	const content = document.querySelector("#content").value;
	const captcha = document.querySelector("#g-recaptcha-response").value;

	let response = await fetch("/api/contact/", {
		method: "POST",
		headers: {
			"Accept": "application/json, text/plain, */*",
			"Content-Type": "application/json",
			"CSRF-Token": csrfToken
		},
		body: JSON.stringify({ name: name, email: email, title: title, content: content, captcha: captcha })
	});
	response = await response.json();

	let alertType = "success";
	if (response.error === true) alertType = "warning";
	else {
		document.querySelector("#name").value = "";
		document.querySelector("#email").value = "";
		document.querySelector("#title").value = "";
		document.querySelector("#content").value = "";
	}

	let alert = createAlertNode(response.message, alertType);
	addAlert(alert, "#header");
}
