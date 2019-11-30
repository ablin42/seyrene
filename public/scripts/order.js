async function cancelOrder(orderId) {
    console.log("CANCEL ORDER:", orderId);
    await fetch(`http://localhost:8089/api/order/cancel/${orderId}`, {
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