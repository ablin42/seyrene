async function infiniteTags() {
    lastId = $(".card:last").attr("id");
    nbItem = $(".card").length;
    page = 1 + Math.floor(nbItem / 6);
        //show/hide loader
        let urlToFetch = `http://127.0.0.1:8089/api/gallery/tags?page=${page}`;
        let parsedURL = new URL(window.location.href);
        let tagsParam = parsedURL.searchParams.get("t");
        console.log(tagsParam)
        if (tagsParam)
            urlToFetch += `&t=${tagsParam}`;
        else 
            urlToFetch = `http://127.0.0.1:8089/api/gallery?page=${page}`;
        console.log(urlToFetch)
        await fetch(urlToFetch)
        .then(function(response) {
            response.json().then(function(data) {
                console.log(data)
            data.forEach(gallery => {
                let id = gallery._id;
                if ($(`#${id}`).length === 0) {
                    let div = document.createElement('div');
                    div.setAttribute("id", id);
                    div.setAttribute("class", "card");
                    div.setAttribute("style", "width: 18rem");
                    let toAppend =  `
                        <a href="#expand"><img onclick="expand(this);" src="/api/image/${gallery.mainImgId}" class="card-img-top" alt="${gallery.title}"></a>
                        <div class="card-body">
                            <h5 class="card-title"><i><a href="/Galerie/${id}">${gallery.title}</a></i></h5>
                            <p class="card-text gallery-description">${gallery.content}</p>
                            <p class="card-text">`;
                    gallery.tags.forEach(tag => {
                        toAppend += ` <a href="/Galerie/Tags?t=${tag}">#${tag}</a>`;
                    })
                    toAppend += `</p></div>`;
                    div.innerHTML = toAppend;  
                    id++;
                    $("#container-gallery").append(div);
                }});
            })
        })
}

$(window).scroll(function() {
    val1 = Math.ceil($(window).scrollTop() + $(window).height());
    val2 = $(document).height();
    if (val1 >= val2) {
        infiniteTags();
    }
});