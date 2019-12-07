async function infiniteShopItems(tab) {
    lastId = $(`#${tab} > .card:last`).attr("id");
    nbItem = $(`#${tab} > .card`).length;
    page = 1 + Math.floor(nbItem / 1);
    url = `http://127.0.0.1:8089/api/shop?page=${page}&tab=${tab}`;
        //show/hide loader
        await fetch(url)
        .then(function(response) {
            response.json().then(function(data) {
            data.forEach(shop => {
                let id = shop._id;
                console.log(id)
                if ($(`#${id}`).length === 0) {
                    let div = document.createElement('div');
                    div.setAttribute("id", id);
                    div.setAttribute("class", "card");
                    div.setAttribute("style", "width: 18rem");
                    let toAppend =  `
                        <a href="#expand"><img onclick="expand(this);" src="/api/image/${shop.mainImgId}" class="card-img-top" alt="${shop.title}"></a>
                        <div class="card-body">
                            <h5 class="card-title"><i><a href="Shop/${id}">${shop.title}</a></i></h5>
                            <p class="card-text gallery-description">${shop.content}</p>
                            <p class="card-text">
                                <b>${shop.price}€</b><br />
                                ${shop.isUnique}
                            </p>
                            <input type="submit" class="logbtn" value="Add to cart" onclick="cartAdd('${id}', this)">
                        </div>`;
                  
                    div.innerHTML = toAppend;  
                    id++;
                    $(`#${tab}`).append(div);
                }});
            })
        })
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