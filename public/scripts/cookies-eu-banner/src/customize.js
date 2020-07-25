new CookiesEuBanner(function () {
	// Your code to launch when user accept cookies
	let response = fetch(`/api/auth/cookies/accept`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		credentials: "include",
		mode: "same-origin"
	});
}, true);
