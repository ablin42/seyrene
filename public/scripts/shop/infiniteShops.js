async function infiniteShopItems(tab) {
    let nbItem = $(`#${tab} > .card`).length,
        page = 1 + Math.floor(nbItem / 6),
        loader = $("#loader"),
        url = `http://127.0.0.1:8089/api/shop?page=${page}&tab=${tab}`;
    loader.css("display","block");
    await fetch(url)
    .then(function(response) {
        response.json().then(function(data) {
            if (!data.error) {
                data.forEach(shop => {
                    let id = shop._id;
                    if ($(`#${id}`).length === 0) {
                        let div = document.createElement('div');
                        div.setAttribute("id", id);
                        div.setAttribute("class", "card");
                        div.setAttribute("style", "width: 18rem");
                        let toAppend =  `
                            <a href="#expand"><img onclick="expand(this);" src="/api/image/${shop.mainImgId}" class="card-img-top" alt="${shop.title}"></a>
                            <div class="card-body">
                                <h5 class="card-title"><i><a href="/Shop/${id}">${shop.title}</a></i></h5>
                                <p class="card-text gallery-description">${shop.content}</p>
                                <p class="card-text">
                                    <b>${shop.price}€</b><br />
                                </p>
                                <input type="submit" class="logbtn" value="Add to cart" onclick="cartAdd('${id}', this)">
                            </div>`;
                        div.innerHTML = toAppend;  
                        id++;
                        $(`#${tab}`).append(div);
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
let tab = "original";
if (document.getElementById("load").getAttribute("onclick").indexOf("original") === -1)
    tab = "print";
if (val1 >= val2) {
    infiniteShopItems(tab);
}
});