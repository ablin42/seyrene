async function infiniteGalleries() {
    let nbItem = $(".expandable-card").length,
        page = 1 + Math.floor(nbItem / 6),
        loader = $("#loader");
    loader.css("display","block");
    await fetch(`http://127.0.0.1:8089/api/gallery?page=${page}`)
    .then(function(response) {
        response.json().then(function(data) {
            if (!data.error) {
                data.forEach(gallery => {
                    let id = gallery._id;
                    if ($(`#${id}`).length === 0) {
                        let div = document.createElement('div');
                        div.setAttribute("class", "expandable-card");
                        div.setAttribute("id", id);
                        toAppend = `
                        <div class="face face1">
                            <a href="#expand">
                                <img onclick="expand(this);" src="/api/image/${gallery.mainImgId}" class="card-img-top" alt="${gallery.shorttitle}">
                            </a>
                        </div>
                        <div class="face face2">
                            <h5 class="card-title"><i><a href="/Galerie/${id}">${gallery.shorttitle}</a></i></h5>
                            <p class="gallery-description">${gallery.shortcontent}...</p>
                            <div class="gallery-tags">`;

                        gallery.tags.forEach(tag => {
                            toAppend += ` <a href="/Galerie/Tags?t=${tag}">#${tag}</a>`;
                        })
                        toAppend += `   </div>
                                        <form action="/Galerie/${id}"><button class="blog-btn">Lire plus</button></form>
                                        </div>`;
                        div.innerHTML = toAppend;  
                        $("#container-gallery").append(div);
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
if (val1 >= val2) {
    infiniteGalleries();
}
});