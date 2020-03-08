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

    this.pwintyAdd = function (data) {
        storedItem = this.items[data.SKU];
        let attributes = data.attributes
        if (!storedItem) 
            storedItem = this.items[data.SKU] = {elements: [{attributes : attributes, qty: 1}], qty: 1, price: data.price, unitPrice: data.price};
        else {
            let found = 0;
            this.items[data.SKU].qty++; 
            this.items[data.SKU].price = parseFloat((Math.round(this.items[data.SKU].unitPrice * this.items[data.SKU].qty * 100) / 100).toFixed(2));

            storedItem.elements.forEach((element, index) => {
                if (JSON.stringify(element.attributes) === JSON.stringify(data.attributes)) {
                    found++;
                    this.items[data.SKU].elements[index].qty++;
                }
            });
            if (found === 0) 
                storedItem.elements.push({attributes : attributes, qty: 1});
        }
        console.log(this.items, this.items[data.SKU].elements)

        this.totalQty++;
        this.totalPrice = parseFloat((Math.round((this.totalPrice + data.price) * 100) / 100).toFixed(2));
    }

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