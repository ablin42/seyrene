async function infiniteBlogs() {
    let nbItem = $(".blog-row").length,
        page = 1 + Math.floor(nbItem / 6),
        loader = $("#loader");
    loader.css("display","block");
    await fetch(`http://127.0.0.1:8089/api/blog?page=${page}`)
    .then(function(response) {
        response.json().then(function(data) {
            if (!data.error) {
                data.forEach(blog => {
                    let id = blog._id;
                    if ($(`#${id}`).length === 0) {
                        let div = document.createElement('div');
                        div.setAttribute("id", id);
                        div.setAttribute("class", "blog-row");
                        div.innerHTML = `<div class='col-8 offset-2'><h3 class="blog-title"><a href="/Blog/${id}">${blog.title}</a></h3> `;
                        if (blog.mainImgId) 
                            div.innerHTML += `<img src="/api/image/${blog.mainImgId}">`;
                        div.innerHTML +=    `<p class="blog-info">posté par 
                                                <b class="blog-author">${blog.author}</b>, <i class="blog-date">${blog.date}</i>
                                            </p>
                                            <p class="blog-content">${blog.content}</p>
                                        </div>
                                        <hr />`
                        id++;
                        $("#container-blog").append(div);
                    }
                });
            } else {
                let alert = `<div id="alert" class="alert alert-warning" role="alert">
                                <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                                ${data.message}
                            </div>`;
                addAlert(alert, "#header");
            }
        })
    })
    .catch((err) => {
        let alert = `<div id="alert" class="alert alert-warning" role="alert">
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                          ${err.message}
                      </div>`;
        addAlert(alert, "#header");
    })
    loader.css("display","none");
}

$(window).scroll(function() {
    val1 = Math.ceil($(window).scrollTop() + $(window).height());
    val2 = $(document).height();
    console.log(val1, val2)
    if (val1 >= val2) {
        infiniteBlogs();
    }
});