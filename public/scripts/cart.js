function checkoutCaller(isLogged, isDelivery) {
  if (isLogged === "") {
    window.location.href = "http://localhost:8089/Account"; //need req message
  } else {
    if (isDelivery === "true") {
      // fetch total price from API
      fetch("/api/cart/totalprice", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        }
      })
        .then(res => {
          return res.json();
        })
        .then(data => {
          console.log(data);
          if (data.err === false) {
            let price = Math.round(parseFloat(data.total) * 100); //stripe amount is in cents
            if (price != 0) {
              stripeHandler.open({
                amount: price,
                currency: "eur"
              });
            }
          } else {
            console.log("Something went wrong while fetching your cart items!");
            throw new Error(data.msg);
          }
        })
        .catch(err => {
          let alert = createAlertNode(err.message);
          addAlert(alert, "#header");
        });
    } else {
      let alert = createAlertNode("You need to fill your delivery informations <a href='/User'>here</a> in order to be able to purchase!");
      addAlert(alert, "#header");
    }
  }
}

async function cartAdd(itemId, caller) {
  caller.disabled = true;
  caller.style.pointerEvents = "none";
  setTimeout(() => {
    caller.disabled = false;
    caller.style.pointerEvents = "auto";
  }, 1500);
  await fetch(`http://localhost:8089/api/cart/add/${itemId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    credentials: "include",
    mode: "same-origin"
  })
    .then(res => {
      return res.json();
    })
    .then(function(response) {
      let alertType = "info";
      if (response.error === false) {
        let totalQty = response.cart.totalQty;
        let totalPrice = response.cart.totalPrice;
        let rowId = document.getElementById(itemId);
        document.getElementById("cartQty").innerText = totalQty;
        if (rowId.classList.contains("cart-row-item")) {
      

          let itemQty = response.cart.items[itemId].qty;
          let itemPrice = response.cart.items[itemId].price;

          $(`#qty-${itemId}`).val(itemQty);
          rowId.childNodes[5].childNodes[1].childNodes[0].innerText = itemPrice + "€";
          document.getElementById("total-price").innerText = totalPrice + "€";
          document.getElementById("total-qty").innerText = totalQty;
        }
      } else 
        alertType = "warning";
      let alert = createAlertNode(response.message, alertType);
      addAlert(alert, "#header");
    })
    .catch(err => {
      console.log(err);
      let alert = createAlertNode(err.message, "danger");
      addAlert(alert, "#header");
    });
  return;
}

async function updateValue(e, item) {
  try {
    if (item.value) {
      let value = parseInt(item.value);
      if (Number.isInteger(value) && value >= 0) {
        let itemId = item.id.substring(4);
        await fetch(
          `http://localhost:8089/api/cart/update/${itemId}/${value}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json"
            },
            credentials: "include",
            mode: "same-origin"
          }
        )
          .then(res => {
            return res.json();
          })
          .then(function(response) {
            console.log("response:", response);
            let alertType = "info";
            if (response.error === false) {
              let totalQty = response.cart.totalQty;
              let totalPrice = response.cart.totalPrice;
              let rowId = document.getElementById(itemId);

              document.getElementById("total-price").innerText =
                totalPrice + "€"; //format here or in api
              document.getElementById("total-qty").innerText = totalQty;

              if (value === 0) document.getElementById(itemId).remove();
              else {
                if (!rowId.classList.contains("card")) {
                  let itemQty = response.cart.items[itemId].qty;
                  let itemPrice = response.cart.items[itemId].price;

                  item.value = itemQty;
                  rowId.childNodes[5].childNodes[1].childNodes[0].innerText = itemPrice + "€";
                }
              }
            } else {
              console.log("API answered with error:", response);
              alertType = "warning";
            }
            let alert = createAlertNode(response.message, alertType);
            addAlert(alert, "#header");
          })
          .catch(err => {
            console.log("An error occured while contacting the API:", err);
            let alert = createAlertNode(err.message, "danger");
            addAlert(alert, "#header");
          });
      } else
        throw new Error("The <b>quantity</b> has to be a positive integer");
    } else throw new Error("The <b>quantity</b> you entered is invalid");
  } catch (err) {
    item.value = 1;
    let alert = createAlertNode(err.message, "warning");
    addAlert(alert, "#header");
  }
}

async function cartDel(itemId, caller) {
  caller.disabled = true;
  caller.style.pointerEvents = "none";
  setTimeout(() => {
    caller.disabled = false;
    caller.style.pointerEvents = "auto";
  }, 1500);
  await fetch(`http://localhost:8089/api/cart/del/${itemId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    credentials: "include",
    mode: "same-origin"
  })
    .then(res => {
      return res.json();
    })
    .then(function(response) {
      console.log(response);
      let alertType = "info";
      if (response.error === false) {
        let totalQty = response.cart.totalQty;
        let totalPrice = response.cart.totalPrice;
        if (totalPrice == 0) {
          $(".payment-div").attr("style", "display: none");
          $("#alertEmpty").attr("style", "display: inline-block");
          $("#cart-row-header").attr("style", "display: none");
        }

        let rowId = document.getElementById(itemId);

        document.getElementById("cartQty").innerText = totalQty;
        if (!rowId.classList.contains("card")) {
          if (response.cart.items[itemId]) {
            let itemQty = response.cart.items[itemId].qty;
            let itemPrice = response.cart.items[itemId].price;

            $(`#qty-${itemId}`).val(itemQty);
            rowId.childNodes[5].childNodes[1].childNodes[0].innerText = itemPrice + "€";
          } else rowId.remove();

          document.getElementById("total-price").innerText = totalPrice + "€"; //format here or in api
          document.getElementById("total-qty").innerText = totalQty;
        }
      } else {
        console.log("error:", response);
        alertType = "warning";
      }
      let alert = createAlertNode(response.message, alertType);
      addAlert(alert, "#header");
    })
    .catch(err => {
      console.log(err);
      let alert = createAlertNode(err.message, "danger");
      addAlert(alert, "#header");
    });
  return;
}
