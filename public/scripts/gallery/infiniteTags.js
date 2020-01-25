async function infiniteTags() {
    let nbItem = $(".card").length;
        page = 1 + Math.floor(nbItem / 6),
        loader = $("#loader"),
        urlToFetch = `http://127.0.0.1:8089/api/gallery/tags?page=${page}`,
        parsedURL = new URL(window.location.href),
        tagsParam = parsedURL.searchParams.get("t");
    loader.css("display","block");
    if (tagsParam)
        urlToFetch += `&t=${tagsParam}`;
    else 
        urlToFetch = `http://127.0.0.1:8089/api/gallery?page=${page}`;
    await fetch(urlToFetch)
    .then(function(response) {
        response.json().then(function(data) {
            if (!data.error) {
                if (data.length > 0) {
                    data.forEach(gallery => {
                        let id = gallery._id;
                        if ($(`#${id}`).length === 0) {
                            let div = document.createElement('div');
                            div.setAttribute("class", "expandable-card");
                            div.setAttribute("id", id);
                            toAppend = `
                            <div class="face face1 blog-overlay-wrapper mt-0">
                                <a href="#expand">
                                    <img onclick="expand(this);" src="/api/image/${gallery.mainImgId}" class="card-img-top" alt="${gallery.shorttitle}">
                                </a>
                            
                            <div class="blog-overlay">
                                <h4><i><a href="/Galerie/${id}">${gallery.shorttitle}</a></i></h4>
                                <div class="gallery-tags mt-5">`;
    
                                gallery.tags.forEach(tag => {
                                    toAppend += ` <a href="/Galerie/Tags?t=${tag}">#${tag}</a>`;
                                })
                                toAppend += `   </div>
                                            <form action="/Galerie/${id}"><button class="blog-btn">Lire plus</button></form>
                                            </div></div>`;
                                div.innerHTML = toAppend;
                                $("#container-gallery").append(div);
                        } else {
                            $("#infinitebtn").val("Nothing more to load");
                            $("#infinitebtn").attr("disabled");
                            $("#infinitebtn").attr("onclick", "");
                        }
                    });
                } else {
                    $("#infinitebtn").val("Nothing more to load");
                    $("#infinitebtn").attr("disabled");
                    $("#infinitebtn").attr("onclick", "");
                }
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
    if (val1 >= val2) {
        infiniteTags();
    }
});