/*var stripe = Stripe('pk_test_tFWKfxLQuvpYUl0fasc0GWjd00uwLqE3Xl');

let form = $('#checkout');

const elements = stripe.elements();
const card = elements.create('card');

console.log(card)

/* {
    number: $('#credit-card-number').val(),
    cvc: $('#CVC').val(),
    exp_month: $('#expiration-month').val(),
    exp_year: $('#expiration-year').val(),
    name: $('#name').val()} 

form.submit((e) => {
    $('#charge-error').addClass('hidden');
    console.log("XD")
    form.find('button').prop('disabled', true);
    stripe.createToken(card).then(function(response) {
            if (response.error) {

                $('#charge-error').text(response.error.message);
                $('#charge-error').removeClass('hidden');
                form.find('button').prop('disabled', false);
            } else {
                let token = response.id;
                form.append($('<input type="hidden" name="stripeToken">').val(token));
        
                form.get(0).submit();
            }
      });
    return false;
});*/