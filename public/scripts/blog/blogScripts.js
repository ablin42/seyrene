async function postBlog(e) {
    e.preventDefault();
    let tagInput = document.getElementsByClassName("label-info"),
        title = $("#title").val(),
        content = $("#content").val(),
        img = document.querySelector('#img'),
        formData = new FormData(),
        tags = [];
    
    for (i = 0; i < tagInput.length; i++)
        tags.push(tagInput[i].textContent);
    
    for (i = 0; i < img.files.length; i++) 
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
            let alert = `
            <div id="alert" class="alert alert-warning" role="alert">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                ${data.msg}
            </div>`;
            addAlert(alert, "#header")
        } else 
            window.location.href = data.url                
    })
}