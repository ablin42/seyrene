function openTab(btn, tabName) {
	let tab = document.getElementsByClassName("tab");
	let buttons = document.getElementsByClassName("tab-btn");

	for (let i = 0; i < buttons.length; i++) buttons[i].classList.remove("active");

	btn.classList.add("active");

	for (let i = 0; i < tab.length; i++) tab[i].style.display = "none";

	document.getElementById(tabName).style.display = "grid";
	document.getElementById("infinitebtn").setAttribute("onclick", `infiniteOrders("${tabName}");`);
	document.getElementById("infinitebtn").setAttribute("value", "Load More");
	document.getElementById("infinitebtn").removeAttribute("disabled");
}

async function infiniteOrders(tab) {
	if ($(`#container-admin-orders-${tab}`).length === 0) return;
	let nbItem = $(`#container-admin-orders-${tab} > tr`).length,
		page = 1 + Math.floor(nbItem / 20),
		loader = $("#loader"),
		url = `/api/order?page=${page}&tab=${tab}`;
	console.log(url, nbItem, page);
	loader.css("display", "block");

	await fetch(url)
		.then(function (response) {
			response.json().then(function (data) {
				if (!data.error) {
					if (data.orders.length > 0) {
						data.orders.forEach(order => {
							let id = order._id;
							console.log(id, $(`#${id}`));
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
	let tab = "approval";
	if (document.getElementById("infinitebtn").getAttribute("onclick").indexOf("approval") === -1) tab = "all";
	if (val1 >= val2) infiniteOrders(tab);
});
