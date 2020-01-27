function deleteImage (item, e) {
    e.preventDefault();
    let imageItemId = "image" + item.id.substr(6, 1);
    let imageItem = document.getElementById(imageItemId);

    removeItem(imageItem);
    removeItem(item);
    let groupId = $("#uploadGroup" + item.id.substr(6, 1));
    let uploadBtnId = $("#uploadbtn" + item.id.substr(6, 1));
    uploadBtnId.attr("style", "display: none");
    groupId.attr("style", "display: block");
    
    if (imageItem.getAttribute("data-uploaded") === "true") {
        fetch(`/api/front/delete/${item.id.substr(6, 1)}`, {
            method: 'get',
            mode: 'same-origin',
        })
        .then(response => response.json())
        .then(data => {
            if (data.err) {
                let alert = `
                    <div id="alert" class="alert alert-warning" role="alert" style="position: fixed;z-index: 33;margin: 0 50% 0 50%;transform: translate(-50%,0px);">
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                        ${data.msg}
                    </div>`;
                addAlert(alert, "#header");
            } else {
                let alert = `
                    <div id="alert" class="alert alert-success" role="alert" style="position: fixed;z-index: 33;margin: 0 50% 0 50%;transform: translate(-50%,0px);">
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                        ${data.msg}
                    </div>`;
                addAlert(alert, "#header");
            }
        })
    }
    else {
        let alert = `
            <div id="alert" class="alert alert-success" role="alert" style="position: fixed;z-index: 33;margin: 0 50% 0 50%;transform: translate(-50%,0px);">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                Image was successfully deleted!
            </div>`;
        addAlert(alert, "#header");
    }
}

function removeItem (item) {
    item.style = "display: none;";
    item.src = "";
}

function readURL(input) {
    let targetImgId = "#image" + input.id.substr(6, 1);
    let targetBtnId = "#uploadGroup" + input.id.substr(6, 1);
    let targetDeleteId = "#delete" + input.id.substr(6, 1);
    let targetUploadId = "#uploadbtn" + input.id.substr(6, 1);
    if (input.files && input.files[0]) {
        var reader = new FileReader();
    
        reader.onload = function(e) {
            $(targetImgId).attr('src', e.target.result);
            $(targetImgId).attr('data-uploaded', "false");
            $(targetImgId).attr('style',"display: block");
            $(targetDeleteId).attr('style', "display: inline-block");
            $(targetUploadId).attr('style', "display: block");
            $(targetBtnId).attr('style', "display: none");
        }
        reader.readAsDataURL(input.files[0]);
    } 
}

async function postFront(e, form) {
    e.preventDefault();
            
    let formData = new FormData();
    formData.append('img', form.querySelector('input[type="file"]').files[0]);
    formData.append('referenceId', form.querySelector('input[name="referenceId"]').value);
            
    fetch('/api/front/post', {
        method: 'post',
        mode: 'same-origin',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.err) {
            let alert = `
            <div id="alert" class="alert alert-warning" role="alert" style="position: fixed;z-index: 33;margin: 0 50% 0 50%;transform: translate(-50%,0px);">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                ${data.msg}
            </div>`;
            addAlert(alert, "#header");
        } else {
            let alert = `
            <div id="alert" class="alert alert-success" role="alert" style="position: fixed;z-index: 33;margin: 0 50% 0 50%;transform: translate(-50%,0px);">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                ${data.msg}
            </div>`;
            addAlert(alert, "#header");
        }
    })
}