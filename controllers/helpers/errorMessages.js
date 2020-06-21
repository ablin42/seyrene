const ERROR_MESSAGE = {
	//Generic
	sendMail: "An error occurred while trying to send the mail, please retry",
	serverError: "An error occurred, please try again later",
	readFile: "File couldn't be read",
	incorrectInput: "Incorrect input",
	pageEmpty: "This page is under maintenance, please come back later",

	//User
	logInNeeded: "You need to be logged in",
	alreadyLoggedIn: "You're already logged in",
	invalidCredentials: "Invalid credentials",
	emailTaken: "An account already exist with this e-mail",
	userNameTaken: "An account already exist with this username",
	userNotFound: "An error occurred while looking for your user account, please try again",
	userUpdate: "An error occurred while updating your user account, please try again",
	pwDontMatch: "Password confirmation does not match password",
	createAccount: "An error occurred while creating your account, please try again",
	unverifiedAccount: "Your account has not been verified. Please check your e-mails",
	alreadyVerified: "This user has already been verified",
	unauthorized: "Unauthorized. Contact your administrator if you think this is a mistake",

	//Update
	updateQty: "Quantity for an item must be between 0 and 99",
	updateError: "Something went wrong while updating the item(s)",

	//Fetch
	fetchImg: "An error occurred while fetching the image",
	fetchStatus: "We could not check the status of your order, please try again later",
	fetchError: "An error occurred while fetching the item(s)",

	//Delete
	delImg: "An error occurred while deleting the image, please try again",
	mainImgDel: "You cannot delete the main image, delete the whole item or add a new image to replace the main image",
	delError: "An error occurred while deleting the item(s), please try again",

	//Save
	saveError: "Something went wrong while saving the item(s)/data",

	//Not found
	deliveryAddressNotFound: "An error occured looking for your delivery address",
	tokenNotFound: "An error occurred while looking for your token, please try again",
	itemNotFound: "An error occurred while looking for an item you tried to purchase",
	notFoundCatalog: "This item is not available in this format, please try another one",
	noResult: "No result found",

	//Delivery/Order/Cart
	missingBilling: "You need to fill in your billing informations",
	unsetDeliveryAddress: "You need to set your delivery address",
	noShipment: "Sorry, there are no shipment options available to the selected destination for these products",
	countryCode: "We cannot find your country ISO code, please contact us if the error persist",
	noStreetNb: "You did not mention a street number!",
	cancelOrder: "We could not cancel your order, please try again later",
	badOrderStatus: "Your order status does not allow it to be cancelled",
	submitOrder: "An error occurred while submitting your order, please try again later",
	emptyCart: "Your cart is empty!"
};

module.exports = {
	ERROR_MESSAGE
};
