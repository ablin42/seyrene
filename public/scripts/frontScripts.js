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
                let alert = createAlertNode(data.msg, "warning");
                addAlert(alert, "#header");
            } else {
                let alert = createAlertNode(data.msg, "success");
                addAlert(alert, "#header");
            }
        });
    }
    else {
        let alert = createAlertNode(" Image was successfully deleted!", "success");
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
        let reader = new FileReader();
    
        reader.onload = function(e) {
            $(targetImgId).attr('src', e.target.result);
            $(targetImgId).attr('data-uploaded', "false");
            $(targetImgId).attr('style',"display: block");
            $(targetDeleteId).attr('style', "display: inline-block");
            $(targetUploadId).attr('style', "display: block");
            $(targetBtnId).attr('style', "display: none");
        };
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
            let alert = createAlertNode(data.msg, "warning");
            addAlert(alert, "#header");
        } else {
            let alert = createAlertNode(data.msg, "success");
            addAlert(alert, "#header");
        }
    });
}