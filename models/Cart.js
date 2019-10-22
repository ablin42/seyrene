module.exports = function Cart(oldCart) {
    this.items = oldCart.items || {};
    this.totalQty = oldCart.totalQty || 0;
    this.totalPrice = oldCart.totalPrice || 0;

    this.add = function (item, id) {
        var storedItem = this.items[id];
        if (!storedItem) {
            storedItem = this.items[id] = {item: item, qty: 0, price: 0};
            itemPrice = parseFloat(storedItem.item.price);
        } else 
            itemPrice = parseFloat(storedItem.item.price.$numberDecimal);

        storedItem.qty++;
        storedItem.price = itemPrice * storedItem.qty;
        this.totalQty++;
        this.totalPrice += itemPrice;
    };

    this.generateArray = function () {
        let arr = [];
        for (let id in this.items) {
            arr.push(this.items[id]);
        }
        return arr;
    };
}