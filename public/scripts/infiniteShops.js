async function infiniteShopItems(tab) {
    console.log(tab)
    //if og else if print
    lastId = $(".card:last").attr("id");
    nbItem = $(".card").length;
    page = 1 + Math.floor(nbItem / 5);
        //show/hide loader
        await fetch(`http://127.0.0.1:8089/api/shop?page=${page}`)
        .then(function(response) {
            response.json().then(function(data) {
            data.forEach(shop => {
                let id = shop._id;
                if ($(`#${id}`).length === 0) {
                    let div = document.createElement('div');
                    div.setAttribute("id", id);
                    div.setAttribute("class", "card");
                    div.setAttribute("style", "width: 18rem");
                    let toAppend =  `
                        <a href="#expand"><img onclick="expand(this);" src="/api/shop/image/${id}" class="card-img-top" alt="${shop.title}"></a>
                        <div class="card-body">
                            <h5 class="card-title"><i><a href="Shop/${id}">${shop.title}</a></i></h5>
                            <a href="/Shop/Patch/${id}"><i class="fas fa-edit"></i></a>
                            <p class="card-text gallery-description">${shop.content}</p>
                            <p class="card-text">
                                <b>${shop.price}€</b><br />
                                ${shop.isUnique}
                            </p>
                            <input type="submit" class="logbtn" value="Add to cart" onclick="cartAdd('${id}', this)">
                        </div>`;
                  
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
let tab = "original";
if (document.getElementById("load").getAttribute("onclick").indexOf("original") === -1)
    tab = "print";
if (val1 >= val2) {
    infiniteShopItems(tab);
}
});