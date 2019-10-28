async function cartAdd(itemId) {
    await fetch(`http://localhost:8089/api/cart/addd/${itemId}`, {
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
      var cartQty = parseInt(document.getElementById("cartQty").innerText) + 1;
      document.getElementById("cartQty").innerText = cartQty;
      //update cart on front end
      //location.reload();
    })  
    .catch((err) => {
      console.log(err);
    })
    return ;
}

async function cartDel(itemId) {
    await fetch(`http://localhost:8089/api/cart/dell/${itemId}`, {
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
      var cartQty = parseInt(document.getElementById("cartQty").innerText) - 1;
      if (cartQty < 0)
        cartQty = 0;
      document.getElementById("cartQty").innerText = cartQty;
      //update cart on front end
      //location.reload();
    })  
    .catch((err) => {
      console.log(err);
    })
    return ;
}