$(window).scroll(async function() {
    if(Math.ceil($(window).scrollTop() + $(window).height()) == Math.ceil($(document).height())) {
        lastId = parseInt($(".blog-row:last").attr("id"), 10) + 1;
        if (lastId % 5 === 0) { //might not be that great
            page = 1 + (lastId / 5);
            const response = await fetch(`http://127.0.0.1:8089/api/post/blog?page=${page}`);
            const myJson = await response.json();
            let id = lastId;
            //show loader
            myJson.forEach(blog => {
                let div = document.createElement('div');
                div.setAttribute("id", id);
                div.setAttribute("class", "blog-row");
                div.innerHTML = 
                `<div class='col-8 offset-2'>
                    <h3 class="blog-title">${blog.title}</h3> 
                    <p class="blog-info">posté par 
                        <b class="blog-author">${blog.author}</b>, <i class="blog-date">${blog.date}</i>
                    </p>
                    <p class="blog-content">${blog.content}</p>
                </div>
                <hr />`
                id++;
                $("#container-blog").append(div);
            });
            //hide loader
        }
    }
 });