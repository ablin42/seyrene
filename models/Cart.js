module.exports = function Cart(oldCart) {
    this.items = oldCart.items || {};
    this.totalQty = oldCart.totalQty || 0;
    this.totalPrice = oldCart.totalPrice || 0;

    this.add = function (item, id) {
        var storedItem = this.items[id];
        if (!storedItem) 
            storedItem = this.items[id] = {item: item, qty: 0, price: 0};
        itemPrice = parseFloat(storedItem.item.price);

        storedItem.qty++;
        storedItem.price = parseFloat((itemPrice * storedItem.qty).toFixed(2));
        this.totalQty++;
        this.totalPrice = parseFloat((Math.round((this.totalPrice + itemPrice) * 100) / 100).toFixed(2));
    };

    this.update = function (item, id, qty) {
        var storedItem = this.items[id];
        if (!storedItem) //shoudlt need
            storedItem = this.items[id] = {item: item, qty: 0, price: 0}; //either
             
        let itemPrice = parseFloat(storedItem.item.price);
        let currItemQty = storedItem.qty;
        let qtyOffset = qty - currItemQty;
        let priceOffset = parseFloat(qtyOffset * itemPrice);

        if (qty <= 0) {
            this.items[id] = undefined;
            storedItem = undefined;

            this.totalQty = this.totalQty - currItemQty;
            this.totalPrice = parseFloat((Math.round((this.totalPrice - (currItemQty * itemPrice)) * 100) / 100).toFixed(2));
            return ;
        }

        storedItem.qty = qty;
        storedItem.price = parseFloat((itemPrice * storedItem.qty).toFixed(2));
        this.totalQty = this.totalQty + qtyOffset;
        this.totalPrice = parseFloat((Math.round((this.totalPrice + priceOffset) * 100) / 100).toFixed(2));
    }
    
    this.delete = function (item, id) {
        var storedItem = this.items[id];
        if (storedItem) {
            let singlePrice = parseFloat((storedItem.price / storedItem.qty).toFixed(2));
            if (storedItem.qty === 1) {
                this.items[id] = undefined;
                storedItem = undefined;
                this.totalQty--;
                this.totalPrice = parseFloat((Math.round((this.totalPrice - singlePrice) * 100) / 100).toFixed(2));
            } else if (storedItem.qty > 1) {
                storedItem.qty--;
                storedItem.price = parseFloat((storedItem.qty * singlePrice).toFixed(2));
                this.totalQty--;
                this.totalPrice = parseFloat((Math.round((this.totalPrice - singlePrice) * 100) / 100).toFixed(2));
            }
        }
    }

    this.clearCart = function () {
        this.items = {};
        this.totalQty = 0;
        this.totalPrice = 0;
    }

    this.generateArray = function () {
        let arr = [];
        for (let id in this.items) {
            arr.push(this.items[id]);
        }
        return arr;
    };
}