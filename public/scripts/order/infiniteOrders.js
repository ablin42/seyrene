let tab = document.querySelectorAll(".tab-btn");
tab.forEach(btn => {
	let target = btn.id.slice(0, -4);
	btn.addEventListener("click", function () {
		openTab(btn, target);
	});
});

let loadbtn = document.querySelector("#infinitebtn");
loadbtn.addEventListener("click", function () {
	infiniteOrders(loadbtn.dataset.target);
});

function openTab(btn, tabName) {
	let tab = document.getElementsByClassName("tab");
	let buttons = document.getElementsByClassName("tab-btn");

	for (let i = 0; i < buttons.length; i++) buttons[i].classList.remove("active");

	btn.classList.add("active");

	for (let i = 0; i < tab.length; i++) {
		tab[i].classList.remove("grid");
		tab[i].classList.add("nodisplay");
	}

	document.getElementById(tabName).classList.remove("nodisplay");
	document.getElementById(tabName).classList.add("grid");

	document.getElementById("infinitebtn").dataset.target = tabName;
	document.getElementById("infinitebtn").setAttribute("value", "Load More");
	document.getElementById("infinitebtn").removeAttribute("disabled");
}

async function infiniteOrders(tab) {
	if ($(`#container-admin-orders-${tab}`).length === 0) return;
	let nbItem = $(`#container-admin-orders-${tab} > tr`).length,
		page = 1 + Math.floor(nbItem / 20),
		loader = document.querySelector("#loader"),
		url = `/api/order?page=${page}&tab=${tab}`;
	if (loader) loader.classList.add("block");

	let data = await fetch(url);
	data = await data.json();
	if (!data.error) {
		if (data.orders && data.orders.length > 0) {
			data.orders.forEach(order => {
				let id = order._id;
				if ($(`#${tab}-${id}`).length === 0) {
					toAppend = `
								<tr>
									<th scope="row" class="date-grid">${order.date_f}</th>
									<td class="status-grid">${order.status}</td>
									<td class="price-grid">${order.price}€</td>
									<td class="name-grid">${order.firstname[0]}. ${order.lastname}</td>
									<td class="id-grid"><a id="${tab}-${order._id}" href="/Admin/Order/${order._id}">#${order._id}</a></td>
								</tr>`;

					$(`#container-admin-orders-${tab}`).append(toAppend);
				} else {
					$("#infinitebtn").val("Nothing more to load");
					$("#infinitebtn").attr("disabled");
					loadbtn.dataset.target = tab + "-block";
				}
			});
		} else {
			$("#infinitebtn").val("Nothing more to load");
			$("#infinitebtn").attr("disabled");
			loadbtn.dataset.target = tab + "-block";
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
	let tab = "approval";
	if (document.getElementById("infinitebtn").dataset.target === "all") tab = "all";
	if (val1 >= val2) infiniteOrders(tab);
});
