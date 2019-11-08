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
      if (response.error === false) {
        console.log(response)
        var cartQty = parseInt(document.getElementById("cartQty").innerText) + 1;
        document.getElementById("cartQty").innerText = cartQty;
        let rowId = document.getElementById(itemId);
        if (rowId.childNodes[5] != undefined && rowId.childNodes[5].childNodes[3] != undefined && rowId.childNodes[5].childNodes[3].childNodes[0] != undefined) {
          let currTotal = parseFloat(document.getElementById("total-price").innerText);
          console.log(currTotal, response.totalPrice)
          if (currTotal != response.totalPrice) {
            let currQty = parseInt(rowId.childNodes[5].childNodes[3].childNodes[0].innerText);
            rowId.childNodes[5].childNodes[3].childNodes[0].innerText = currQty + 1;
            document.getElementById("total-price").innerText = response.totalPrice + "€";
            document.getElementById("total-qty").innerText = parseInt(document.getElementById("total-qty").innerText) + 1;
            document.getElementById("total-price-input").setAttribute("value", response.totalPrice);
          }
        }
      }
      else {
        console.log("error:", response)
      }
      let alert = `<div id="alert" class="alert alert-info" role="alert">
                      <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                      ${response.msg}
                    </div>`;
      addAlert(alert, "#header");
    })  
    .catch((err) => {
      console.log(err);
    })
    return ;
}

/* 

  .then(response => response.json())
            .then(data => {
                if (data.err) {
                    let alert = `
                    <div id="alert" class="alert alert-warning" role="alert">
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                        ${data.msg}
                    </div>`;
                    addAlert(alert, "#header")
                } else 
                    window.location.href = data.url                
            })

            */

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
      if (response.error === false) {
        console.log(response)
        var cartQty = parseInt(document.getElementById("cartQty").innerText) - 1;
        if (cartQty < 0)
          cartQty = 0;
        document.getElementById("cartQty").innerText = cartQty;
        let rowId = document.getElementById(itemId);
        if (rowId.childNodes[5] != undefined && rowId.childNodes[5].childNodes[3] != undefined && rowId.childNodes[5].childNodes[3].childNodes[0] != undefined) {
          let currTotal = parseFloat(document.getElementById("total-price").innerText);
          console.log(currTotal, response.totalPrice)
          if (currTotal != response.totalPrice) {
            let currQty = parseInt(rowId.childNodes[5].childNodes[3].childNodes[0].innerText);
            document.getElementById("total-price").innerText = response.totalPrice + "€";
            document.getElementById("total-qty").innerText = parseInt(document.getElementById("total-qty").innerText) - 1;
            document.getElementById("total-price-input").setAttribute("value", response.totalPrice);
            if (currQty <= 1)
              rowId.remove();
            else 
              rowId.childNodes[5].childNodes[3].childNodes[0].innerText = currQty - 1;
          }
        }
      }
      else {
        console.log("error:", response)
      }
      let alert = `<div id="alert" class="alert alert-info" role="alert">
                      <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                      ${response.msg}
                    </div>`;
      addAlert(alert, "#header");
    })  
    .catch((err) => {
      console.log(err);
    })
    return ;
}