async function infiniteGalleries() {
    console.log("called")
    lastId = $(".card:last").attr("id");
    nbItem = $(".card").length;
    page = 1 + Math.floor(nbItem / 5);
        //show/hide loader
        await fetch(`http://127.0.0.1:8089/api/gallery?page=${page}`)
        .then(function(response) {
            response.json().then(function(data) {
                console.log(data)
            data.forEach(gallery => {
                let id = gallery._id;
                if ($(`#${id}`).length === 0) {
                    let div = document.createElement('div');
                    div.setAttribute("id", id);
                    div.setAttribute("class", "card");//blog-row
                    div.setAttribute("style", "width: 18rem");
                    div.innerHTML =  `
                        <a href="#expand"><img onclick="expand(this);" src="/api/gallery/image/${id}" class="card-img-top" alt="${gallery.title}"></a>
                        <div class="card-body">
                            <h5 class="card-title"><i>${gallery.title}</i></h5>
                            <a href="/Galerie/Patch/${id}"><i class="fas fa-edit"></i></a>
                            <p class="card-text gallery-description">${gallery.content}</p>
                            <p class="card-text">
                                <a href="#">#TAGS</a>
                            </p>
                        </div>`;
                    /* 
                     <p class="card-text">
                            <% locals.galleries[index].tags.forEach(function (tag) { %>
                            <a href="#">#<%= tag %></a>
                            <% }) %>
                        </p>
                    */
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
    infiniteGalleries();
}
});