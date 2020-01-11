async function postShop(e) {
    e.preventDefault();
    let title = $("#title").val(),
        content = $("#content").val(),
        price = $("#price").val(),
        isUnique = $("#isUnique").is(":checked"),
        img = document.querySelector('#img'),
        formData = new FormData();
    
    for (i = 0; i < img.files.length; i++) 
        formData.append('img', img.files[i]);

    formData.append('title', title);
    formData.append('content', content);
    formData.append('price', price);
    formData.append('isUnique', isUnique);
    
    fetch('/api/shop/post', {
        method: 'post',
        mode: 'same-origin',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.err) {
            let alert = `
            <div id="alert" class="alert alert-warning" role="alert">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                ${data.msg}
            </div>`;
            addAlert(alert, "#header");
        } else 
            window.location.href = data.url                
    })
}

async function patchShop(e, shopId) {
    e.preventDefault();
    let title = $("#title").val(),
        content = $("#content").val(),
        price = $("#price").val(),
        isUnique = $("#isUnique").is(":checked"),
        img = document.querySelector('#img'),
        formData = new FormData();
   
    for (i = 0; i < img.files.length; i++) 
        formData.append('img', img.files[i]);

    formData.append('title', title);
    formData.append('content', content);
    formData.append('price', price);
    formData.append('isUnique', isUnique);
        
    fetch(`/api/shop/patch/${shopId}`, {
        method: 'post',
        mode: 'same-origin',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
    if (data.err) {
        let alert = `
        <div id="alert" class="alert alert-warning" role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
            ${data.msg}
        </div>`;
        addAlert(alert, "#header");
    } else 
        window.location.href = data.url                
    })
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
    addAlert(alertErr, "#header");
   })
}

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
            addAlert(alertSuccess, "#header"); 
    }})
}

function expand(image){
    let expand = $("#expandImg");
    expand.src = image.src;
    expand.attr("src", image.src);
}
  
function openTab(tabName) {
    let tab = document.getElementsByClassName("tab");
    for (let i = 0; i < tab.length; i++) {
      tab[i].style.display = "none";  
    }
    document.getElementById(tabName).style.display = "grid";
    document.getElementById("load").setAttribute("onclick", `infiniteShopItems("${tabName}");`);
}