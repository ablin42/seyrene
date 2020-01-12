async function infiniteBlogs() {
  let nbItem = $(".blog-row").length,
    page = 1 + Math.floor(nbItem / 6),
    loader = $("#loader");
  loader.css("display", "block");
  await fetch(`http://127.0.0.1:8089/api/blog?page=${page}`)
    .then(function(response) {
      response.json().then(function(data) {
        if (!data.error) {
          data.forEach(blog => {
            let id = blog._id;
            if ($(`#${id}`).length === 0) {
              let div = document.createElement("div");
              div.setAttribute("class", "blog-row");
              div.setAttribute("id", id);
              let toAppend = `
                    <h3 class="blog-titlex"><ahref="/Blog/${id}">${blog.shorttitle}...</a></h3> 
                `;

              if (blog.mainImgId)
                toAppend += `<img src="/api/image/${blog.mainImgId}">`;
              toAppend += `
                        <p class="blog-info">posté par 
                        <b class="blog-author">${blog.author}</b>,
                        <i class="blog-date">${blog.date}</i>
                    </p>
                    <hr />

                    <div class="blog-overlay-wrapper">
                        <img class="blog-img" src="https://images-na.ssl-images-amazon.com/images/I/61fjVsjuuVL._SL1500_.jpg">
                        <div class="blog-overlay">
                        <p>${blog.shortcontent}...</p>
                        <form action="/Blog/${id}"><button class="blog-btn">Lire plus</button></form>
                        </div>
                    </div>
                `;
              div.innerHTML = toAppend;
              id++;
              $("#container-blog").append(div);
            }
          });
        } else {
          let alert = `<div id="alert" class="alert alert-warning" role="alert">
                                <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                                ${data.message}
                            </div>`;
          addAlert(alert, "#header");
        }
      });
    })
    .catch(err => {
      let alert = `<div id="alert" class="alert alert-warning" role="alert">
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                          ${err.message}
                      </div>`;
      addAlert(alert, "#header");
    });
  loader.css("display", "none");
}

$(window).scroll(function() {
  val1 = Math.ceil($(window).scrollTop() + $(window).height());
  val2 = $(document).height();
  console.log(val1, val2);
  if (val1 >= val2) {
    infiniteBlogs();
  }
});
