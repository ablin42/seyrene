async function cartAdd(itemId, caller) {
    caller.disabled = true;
    caller.style.pointerEvents = 'none';
    setTimeout(() => {
      caller.disabled = false;
      caller.style.pointerEvents = 'auto';
    }, 1500);
    await fetch(`http://localhost:8089/api/cart/add/${itemId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: "include",
      mode: "same-origin"
    })
    .then((res) => {return res.json()})
    .then(function(response) {
      let alertType = "info";
      if (response.error === false) {
        console.log(response)
        let totalQty = response.cart.totalQty;
        let totalPrice = response.cart.totalPrice;
        let rowId = document.getElementById(itemId);

        document.getElementById("cartQty").innerText = totalQty;
        if (!rowId.classList.contains("card")) {
          let itemQty = response.cart.items[itemId].qty;
          let itemPrice = response.cart.items[itemId].price;

          rowId.childNodes[5].childNodes[3].childNodes[0].innerText = itemQty;
          rowId.childNodes[3].childNodes[1].childNodes[0].innerText = itemPrice + "€";
          document.getElementById("total-price").innerText = totalPrice + "€"; //format here or in api
          document.getElementById("total-qty").innerText = totalQty;
        }
      }
      else {
        console.log("error:", response)
        alertType = "warning";
      }
      let alert = `<div id="alert" class="alert alert-${alertType}" role="alert">
                      <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                      ${response.msg}
                    </div>`;
      addAlert(alert, "#header");
    })  
    .catch((err) => {
      console.log(err);
      let alert = `<div id="alert" class="alert alert-danger" role="alert">
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                    ${err.message}
                  </div>`;
    addAlert(alert, "#header");
    })
  return ;
}

async function cartDel(itemId, caller) {
    caller.disabled = true;
    caller.style.pointerEvents = 'none';
    setTimeout(() => {
      caller.disabled = false;
      caller.style.pointerEvents = 'auto';
    }, 1500);
    await fetch(`http://localhost:8089/api/cart/del/${itemId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: "include",
      mode: "same-origin"
    })
    .then((res) => {return res.json()})
    .then(function(response) {
      console.log(response)
      let alertType = "info";
      if (response.error === false) {
        let totalQty = response.cart.totalQty;
        let totalPrice = response.cart.totalPrice;
        if (totalPrice == 0)  {
          $('#purchase').attr("style", "display: none");
          $('#total-price-span').attr("style", "display: none");
          $('#total-qty-span').attr("style", "display: none");
          $('#alertEmpty').attr("style", "display: inline-block");
        }

        let rowId = document.getElementById(itemId);

        document.getElementById("cartQty").innerText = totalQty;
        if (!rowId.classList.contains("card")) {
          if (response.cart.items[itemId]) {
            let itemQty = response.cart.items[itemId].qty;
            let itemPrice = response.cart.items[itemId].price;
  
            rowId.childNodes[5].childNodes[3].childNodes[0].innerText = itemQty;
            rowId.childNodes[3].childNodes[1].childNodes[0].innerText = itemPrice + "€";
          } else 
            rowId.remove();
         
          document.getElementById("total-price").innerText = totalPrice + "€"; //format here or in api
          document.getElementById("total-qty").innerText = totalQty;
        }
      }
      else {
        console.log("error:", response)
        alertType = "warning";
      }
      let alert = `<div id="alert" class="alert alert-${alertType}" role="alert">
                      <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                      ${response.msg}
                    </div>`;
      addAlert(alert, "#header");
    })  
    .catch((err) => {
      console.log(err);
      let alert = `<div id="alert" class="alert alert-danger" role="alert">
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                    ${err.message}
                  </div>`;
      addAlert(alert, "#header");
    })
  return ;
}