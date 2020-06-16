async function infiniteShopItems(tab) {
  let nbItem = $(`#${tab} > .card`).length,
    page = 1 + Math.floor(nbItem / 3),
    loader = $("#loader"),
    url = `/api/shop?page=${page}&tab=${tab}`;
  loader.css("display", "block");
  await fetch(url)
    .then(function(response) {
      response.json().then(function(data) {
        if (!data.error) {
          if (data.length > 0) {
            data.forEach(shop => {
              let id = shop._id;
              if ($(`#${id}`).length === 0) {
                let div = document.createElement("div");
                div.setAttribute("class", "card");
                div.setAttribute("id", id);

                let toAppend = `
                        <a class="card-img-expand" href="/Shop/${id}"><img src="/api/image/${shop.mainImgId}" class="card-img-top" alt="${shop.title}"></a>
                        <div class="card-body">
                            <h5 class="card-title"><i><a href="/Shop/${id}">${shop.shorttitle}</a></i></h5>
                            <p class="card-text gallery-description mb-5">${shop.shortcontent}</p>
                            <div class="row shop-price-row mt-4">
                                <div class="shop-price-col col-6">
                                    <b class="card-price">${shop.price}€</b>`;

                if (shop.isUnique) {
                  toAppend += "<b class='isUnique'>Toile unique</b>";
                }
                toAppend += `    
                                </div>
                                <div class="col-6">
                                    <input type="submit" class="logbtn" value="Ajouter au panier" onclick="cartAdd('${id}', this)">
                                </div>
                            </div>
                        </div>`;

                div.innerHTML = toAppend;
                id++;
                $(`#${tab}`).append(div);
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
          let alert = createAlertNode(data.message, "warning");
          addAlert(alert, "#header");
        }
      });
    })
    .catch(err => {
      let alert = createAlertNode(err.message, "warning");
      addAlert(alert, "#header");
    });
  loader.css("display", "none");
}

$(window).scroll(function() {
  val1 = Math.ceil($(window).scrollTop() + $(window).height());
  val2 = $(document).height();
  let tab = "original";
  if (
    document
      .getElementById("infinitebtn")
      .getAttribute("onclick")
      .indexOf("original") === -1
  )
  tab = "print";
  if (val1 >= val2) {
    infiniteShopItems(tab);
  }
});
