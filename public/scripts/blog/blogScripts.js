function deleteImage(e, item) {
    e.preventDefault();
    fetch(item.href, {
        method: 'get',
        mode: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
    if (data.err === true) {
        var alertErr = `
        <div id="alert" class="alert alert-warning" role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
            ${data.msg}
        </div>`;
        addAlert(alertErr, "#header")
    } else {
        $(`#${item.id.substr(3)}`).remove();
        $(`#sel${item.id.substr(3)}`).remove();
        item.remove();
        var alertSuccess = `
        <div id="alert" class="alert alert-success" role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
            ${data.msg}
        </div>`;
        addAlert(alertSuccess, "#header")      
    }})
}

function setMain(e, item) {
    e.preventDefault();
    fetch(item.href, {
        method: 'get',
        mode: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
    let type = "success"
    if (data.err === true) 
        type = "warning";
    else {
        let divs = $(`.action-div`);
        console.log(divs)
        for (let i = 0; i < divs.length; i++) {
            divs[i].setAttribute("style", "display: block");
        }
        $(`#actDiv${item.id.substr(3)}`).attr("style", "display: none");
    }
    var alertErr = `
        <div id="alert" class="alert alert-${type}" role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
            ${data.msg}
        </div>`;
    addAlert(alertErr, "#header")
   })
}

function expand(image){
    let expand = $("#expandImg");
    expand.src = image.src;
    expand.attr("src", image.src);
}