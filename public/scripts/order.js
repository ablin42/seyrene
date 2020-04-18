function closeDialog () {
  if ($("#alert-dialog").length !== 0) {
    $("#alert-dialog").parent().css('opacity', 0);
    setTimeout(() => {
      $("#alert-dialog").parent().remove();
      $("#alert-dialog").remove();
    }, 300)
  }
  return ;
}

async function confirmAction(orderId) {
  closeDialog ();
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

function abortAction() {
  closeDialog ();
  return;
}

async function cancelOrder(orderId) {
    console.log("CANCEL ORDER:", orderId);

    if ($("#alert-dialog").length === 0) {
      $('body').append(`<div id="alert-dialog" class="alert-dialog"> \
                          <h3>Cancel the order?</h3><span>This action is irreversible, are you sure?</span> \
                          <button class="tab-btn" onclick="confirmAction('${orderId}')">CONFIRM</button><button class="tab-btn" onclick="abortAction()">ABORT</button> \
                        </div>`);
      $("#alert-dialog").wrap('<div onclick="closeDialog()" class="dialog-wrapper"></div>');
    
      setTimeout(() => {
        $("#alert-dialog").parent().css('background-color', 'rgba(17,17,17, 0.2)');
        $("#alert-dialog").parent().css('opacity', '1');
      }, 100)
    }
    return ;
  }
