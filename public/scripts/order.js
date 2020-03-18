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
      let alert = createAlertNode(response.msg);
      addAlert(alert, "#header");
    })  
    .catch((err) => {
      console.log(err);
    })
    return ;
  }