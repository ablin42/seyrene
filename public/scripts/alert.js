function dismissAlert(closeBtn)
{
	let alert = closeBtn.parentElement,
		wrap = document.getElementById("alertwrapper");
	if (wrap)
		wrap.remove();
	alert.remove();
}

function addAlert(alert, where)
{
	let node = document.createElement("div"),
		alertDiv = document.getElementById("alert"),
		wrap = document.getElementById("alertwrapper");

	node.setAttribute("id", "alertwrapper");
	if (alertDiv){
		if (wrap) 
			wrap.remove();
		alertDiv.remove();
	}
	node.innerHTML += alert;
	$(where).after(node);
}

function createAlertNode(message, alertType = "info", style = "") {
	return `<div id="alert" class="alert alert-${alertType}" role="alert" style="${style}">
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                    ${message}
                </div>`;
}