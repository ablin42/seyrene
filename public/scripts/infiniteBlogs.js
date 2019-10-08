async function infiniteBlogs() {
        lastId = $(".blog-row:last").attr("id");
        nbItem = $(".blog-row").length;
        page = 1 + Math.floor(nbItem / 5);
            //show/hide loader
            await fetch(`http://127.0.0.1:8089/api/blog?page=${page}`)
            .then(function(response) {
                response.json().then(function(data) {
                data.forEach(blog => {
                    let id = blog._id;
                    if ($(`#${id}`).length === 0) {
                        let div = document.createElement('div');
                        div.setAttribute("id", id);
                        div.setAttribute("class", "blog-row");
                        div.innerHTML = 
                            `<div class='col-8 offset-2'>
                                <h3 class="blog-title"><a href="Blog/${id}">${blog.title}</a></h3> 
                                <p class="blog-info">posté par 
                                    <b class="blog-author">${blog.author}</b>, <i class="blog-date">${blog.date}</i>
                                </p>
                                <p class="blog-content">${blog.content}</p>
                            </div>
                            <hr />`
                        id++;
                        $("#container-blog").append(div);
                    }});
                })
            })
}

$(window).scroll(function() {
    val1 = Math.ceil($(window).scrollTop() + $(window).height());
    val2 = $(document).height();
    if (val1 >= val2) {
        infiniteBlogs();
    }
});