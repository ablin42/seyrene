async function postGallery(e) {
    e.preventDefault();
    let tagInput = document.getElementsByClassName("label-info"),
        title = $("#title").val(),
        content = $("#content").val(),
        img = document.querySelector('#img'),
        formData = new FormData(),
        tags = [];
    
    for (let i = 0; i < tagInput.length; i++)
        tags.push(tagInput[i].textContent);
    
    for (let i = 0; i < img.files.length; i++) 
        formData.append('img', img.files[i]);
 
    formData.append('title', title);
    formData.append('content', content);
    formData.append('tags', JSON.stringify(tags));
    
    fetch('/api/gallery/post', {
        method: 'post',
        mode: 'same-origin',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.err) {
            let alert = createAlertNode(data.msg, "warning");
            addAlert(alert, "#header");
        } else 
            window.location.href = data.url ;               
    });
}

async function patchGallery(e, galleryId) {
    e.preventDefault();
    let tagInput = document.getElementsByClassName("label-info"),
        title = $("#title").val(),
        content = $("#content").val(),
        img = document.querySelector('#img'),
        formData = new FormData(),
        tags = [];
        
    for (let i = 0; i < tagInput.length; i++)
        tags.push(tagInput[i].textContent);

    for (let i = 0; i < img.files.length; i++) 
        formData.append('img', img.files[i]);

    formData.append('title', title);
    formData.append('content', content);
    formData.append('tags', JSON.stringify(tags));
        
    fetch(`/api/gallery/patch/${galleryId}`, {
        method: 'post',
        mode: 'same-origin',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
    if (data.err) {
        let alert = createAlertNode(data.msg, "warning");
        addAlert(alert, "#header");
    } else 
        window.location.href = data.url;            
    });
}

async function filterByTags(e) {
    e.preventDefault();
    let tagInput = document.getElementsByClassName("label-info"),
        tags = "";
    
    if (tagInput.length > 0) {
        tags = "?t=";
        for (let i = 0; i < tagInput.length; i++)
        {
            if (i + 1 ===  tagInput.length)
                tags += tagInput[i].textContent;
            else
                tags += tagInput[i].textContent + ",";
        }
    }

    window.location.href = `/Galerie/Tags${tags}`;
}


function setMain(e, item) {
    e.preventDefault();
    fetch(item.href, {
        method: 'get',
        mode: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
    let type = "success";
    if (data.err === true) 
        type = "warning";
    else {
        let divs = $(`.action-div`);
        console.log(divs);
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
   });
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
        addAlert(alertErr, "#header");
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
    }});
}