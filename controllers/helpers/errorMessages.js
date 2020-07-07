const ERROR_MESSAGE = {
	//Generic
	sendMail: "An error occurred while trying to send the mail, please retry",
	serverError: "An error occurred, please try again later",
	readFile: "File couldn't be read",
	incorrectInput: "Incorrect input",
	pageEmpty: "This page is under maintenance, please come back later",
	failedCaptcha: "Failed captcha verification, please try again",

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
	deliveryAddressNotFound: "An error occured looking for your address",
	tokenNotFound: "An error occurred while looking for your token, please try again",
	itemNotFound: "An error occurred while looking for an item you tried to purchase",
	notFoundCatalog: "This item is not available in this format, please try another one",
	noResult: "No result found",

	//Delivery/Order/Cart
	missingBilling: "You need to fill in your billing informations",
	unsetDeliveryAddress: "You need to set your delivery address",
	noShipment: "Sorry, there are no shipment options available to the selected destination for these products",
	countryCode:
		"We cannot find your country ISO code, you can resolve this issue by creating an account and filling the delivery form",
	noStreetNb: "You did not mention a street number!",
	cancelOrder: "We could not cancel your order, please try again later",
	badOrderStatus: "Your order status does not allow it to be cancelled",
	submitOrder: "An error occurred while submitting your order, please try again later",
	emptyCart: "Your cart is empty!",
	addTwiceUnique: "You can't buy an unique painting more than once!",

	addedToCart: "Item added to cart",
	removedFromCart: "Item removed from cart",
	qtyUpdated: "Item quantity updated",
	cancelOrderSuccess: "Your order was successfully cancelled",

	orderUpdated: "La commande a bien été mise à jour",
	itemUploaded: "L'item a bien été enregistré/mis à jour",
	itemUploadedSelectMain: "L'item a bien été enregistré, n'oubliez pas de choisir une image principale",
	itemDeleted: "L'item a bien été supprimé",
	accountCreated: "Account created successfully, please check your emails to confirm your account",
	sentEmail: "Email sent! We will answer as soon as we can",
	loggedIn: "Logged in successfully!",
	verified: "Your account has been verified. Please log in",

	lostpwEmail: "An e-mail was sent to your address, please follow the link we sent you",
	updatedPw: "Password successfully modified",
	updatedUsername: "Username successfully modified",
	updatedEmail: "Email successfully modified, please confirm your new e-mail by clicking on the link we sent you",
	savedBilling: "Billing information successfully saved",
	updatedDelivery: "Delivery informations successfully updated",
	placedOrder: "Purchase successful, your order has been placed!",

	//Validators
	nameLength: "Userame must contain between 4 and 30 characters",
	nameAlpha: "Userame must be alphanumeric",
	emailLength: "Email must be 256 characters max",
	emailInvalid: "Email must be valid",
	pwLength: "Password must contain between 8 and 256 characters",
	pwAlpha: "Password must be atleast alphanumeric",
	titleContact: "Title must contain between 10 and 256 characters",
	contentContact: "Content must contain between 64 and 2048 characters",
	address: "Address cannot be empty!",
	street: "Street name cannot be empty!",
	city: "City cannot be empty!",
	state: "State cannot be empty!",
	zipcode: "Postal code cannot be empty!",
	country: "Country cannot be empty!",
	firstname: "First Name must contain between 8 and 256 characters",
	lastname: "Last Name must contain between 8 and 256 characters"
};

module.exports = {
	ERROR_MESSAGE
};
