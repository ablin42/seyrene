function closeAllSelect(elmnt) {
    var x, y, i, arrNo = [];
    x = document.getElementsByClassName("select-items");
    y = document.getElementsByClassName("select-selected");

    for (i = 0; i < y.length; i++) {
        if (elmnt == y[i]) 
            arrNo.push(i)
        else 
            y[i].classList.remove("select-arrow-active");
    }
    for (i = 0; i < x.length; i++) {
        if (arrNo.indexOf(i))
            x[i].classList.add("select-hide");
    }
}

/*
What file size do I need for printing good quality prints at different sizes?
The following table shows pixel values and the equivalent size for which we could guarantee a good result, subject to the image being in focus with the correct image brightness and colour balance.

Image size	Canvas	Prints (framed, mounted)
0.3 MP	12"	8"
0.5 MP	16"	12"
1.8 MP	20"	16"
2.9 MP	24"	20"
4.8 MP	30"	24"
6.7 MP	40"	30"
7.4 MP	60"	40"
9.3 MP	No limit	No limit
*/

class PwintyObject {
    constructor(item) {
        this.SKU = "";
        this.category = item.value;
        this.subcategory = ""
        this.attributes = {};
        this.width = $('img[alt="0slide"]')[0].naturalWidth;
        this.height = $('img[alt="0slide"]')[0].naturalHeight;
        this.megapixel = this.width * this.height;
        
        document.getElementById("subcategories").innerHTML = "";
        document.getElementById("attributes").innerHTML = "";
        this.hidePricing()

        let selection = ``;
        console.log(Object.keys(PWINTY_ITEMS[this.category]).length)
        if (Object.keys(PWINTY_ITEMS[this.category]).length === 1) {
            console.log("oof")
            //this.loadSubCategory("PRINTS")
            //display attributes instead
        } else {
            Object.keys(PWINTY_ITEMS[this.category]).forEach(subcategory => {
                let subcategoryRadio = `<label for="${subcategory}">
                                        <div class="sku-item unselectable">
                                            <p>${subcategory}</p>
                                            <input data-category="${this.category}" name="pwinty-subcategory" id="${subcategory}" value="${subcategory}" type="radio" onclick="Pwinty.loadSubCategory(this)">
                                        </div>
                                    </label>`;
                if (subcategory !== "sharedAttributes")
                    selection += subcategoryRadio;
                document.getElementById("subcategories").innerHTML = selection;
            });
        }
    }

    loadSubCategory(subcategory) {
        this.hidePricing();
        this.subcategory = subcategory.value;
        this.attributes = {};

        let selection = ``;
        Object.keys(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"]).forEach(attribute => {
            this.attributes[attribute] = "";
    
            let attributeSelect = `<label for="${attribute}">
                                    <div class="sku-item unselectable select-list">
                                        <p>${attribute}</p>
                                        <div class="select-wrapper">
                                        <select data-attribute="${attribute}" name="${attribute}" id="${attribute}">
                                            <option disabled selected>Pick one</option>`;
            
            for (let i = 0; i < Object.keys(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"][attribute]).length; i++) {
                if (attribute !== "size") {
                    attributeSelect += `<option value="${Object.keys(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"][attribute])[i]}">\
                                            ${Object.values(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"][attribute])[i]}</option>`;
                }
                else {
                    let dimensions = Object.keys(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"][attribute])[i].split("x");
                    if (isNaN(parseInt(dimensions[0]))) {
                        for (let j = 0; j < A_FORMAT.length; j++) {
                            if (dimensions[0] === A_FORMAT[j].code)
                                dimensions = A_FORMAT[j].size.split("x");
                        }
                    }

                    let maxDimension = parseInt(dimensions[0]);
                    if (parseInt(dimensions[1]) > parseInt(dimensions[0]))
                        maxDimension = parseInt(dimensions[1]);               

                    if (this.megapixel > 9300000) {
                        attributeSelect += `<option value="${Object.keys(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"][attribute])[i]}">\
                            ${Object.values(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"][attribute])[i]}</option>`;
                    }
                    else {
                        let i = 0;
                        while (this.megapixel > DIMENSIONS_FRAMES[i].megapixel) 
                            i++;
                        var max = DIMENSIONS_FRAMES[i].max;
                        if (maxDimension <= max) {
                            attributeSelect += `<option value="${Object.keys(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"][attribute])[i]}">\
                                ${Object.values(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"][attribute])[i]}</option>`;
                        }
                    }
                }
            }
            attributeSelect +=              `</select></div>
                                    </div>
                                </label>`;
            selection += attributeSelect;
        });

        Object.keys(PWINTY_ITEMS[subcategory.dataset.category][this.subcategory]).forEach(attribute => {
            this.attributes[attribute] = "";
    
            let attributeSelect = `<label for="${attribute}">
                                    <div class="sku-item unselectable select-list">
                                        <p>${attribute}</p>
                                        <div class="select-wrapper">
                                        <select data-attribute="${attribute}" name="${attribute}" id="${attribute}">
                                            <option disabled selected>Pick one</option>`;
 
            for (let i = 0; i < Object.keys(PWINTY_ITEMS[subcategory.dataset.category][this.subcategory][attribute]).length; i++) {
                attributeSelect += `<option value="${Object.keys(PWINTY_ITEMS[subcategory.dataset.category][this.subcategory][attribute])[i]}">\
                                        ${Object.values(PWINTY_ITEMS[subcategory.dataset.category][this.subcategory][attribute])[i]}</option>`;
            }
    
            attributeSelect +=              `</select></div>
                                    </div>
                                </label>`;
            selection += attributeSelect;
        });
        document.getElementById("attributes").innerHTML = selection;
        this.selectScript();
        //this.printInfo();
    }

    selectScript() {
        var x, i, j, selElmnt, a, b, c;
        x = document.getElementsByClassName("select-wrapper");

        for (i = 0; i < x.length; i++) {
            selElmnt = x[i].getElementsByTagName("select")[0];
            a = document.createElement("DIV");
            a.setAttribute("class", "select-selected");
            a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
            x[i].appendChild(a);
            b = document.createElement("DIV");
            b.setAttribute("class", "select-items select-hide");

            for (j = 1; j < selElmnt.length; j++) {
                c = document.createElement("DIV");
                c.dataset.value = selElmnt.options[j].value;
                c.innerHTML = selElmnt.options[j].innerHTML;

                c.addEventListener("click", function(e) {
                    var y, i, k, s, h;
                    s = this.parentNode.parentNode.getElementsByTagName("select")[0];
                    h = this.parentNode.previousSibling;

                    Pwinty.updateAttribute(s, this.dataset.value)

                    for (i = 0; i < s.length; i++) {
                        if (s.options[i].innerHTML == this.innerHTML) {
                            s.selectedIndex = i;
                            h.innerHTML = this.innerHTML;
                            y = this.parentNode.getElementsByClassName("same-as-selected");
                            for (k = 0; k < y.length; k++) 
                                y[k].removeAttribute("class");
                            this.setAttribute("class", "same-as-selected");
                            break;
                        }
                    }
                    h.click();
                });
                b.appendChild(c);
            }
            x[i].appendChild(b);
            
            a.addEventListener("click", function(e) {
                e.stopPropagation();
                closeAllSelect(this);
                this.nextSibling.classList.toggle("select-hide");
                this.classList.toggle("select-arrow-active");
            });
        }
        document.addEventListener("click", closeAllSelect(this));
    }

    updateAttribute(attribute, optionValue = "") {
        if (optionValue === "")
            this.attributes[attribute.name] = attribute.options[attribute.selectedIndex].value;
        else 
            this.attributes[attribute.name] = optionValue;

        this.checkAttributes();
        //this.printInfo();
    }

    hideAttribute(attributeName) {
        let attributeItem = document.getElementById(attributeName);
        attributeItem.parentNode.parentNode.setAttribute("style", "display: none")
        //this.attributes[attributeName] = ""; enable this doesnt refresh price when selecting mount from no mount option
    }

    displayAttribute(attributeName) {
        let attributeItem = document.getElementById(attributeName);
        attributeItem.parentNode.parentNode.setAttribute("style", "display: block");
    }

    checkAttributes() {
        let nbAttributes = this.checkDisabledAttributes();
        let selectedAttributes = 0;
    
        Object.keys(this.attributes).forEach(attribute => {
            if (this.attributes[attribute] !== "")
                selectedAttributes++; 
        })
        if (selectedAttributes >= nbAttributes)
            this.generateSku();
    }

    checkDisabledAttributes() {
        let nbAttributes = Object.keys(this.attributes).length;
        if (this.attributes["mountType"]) {
            if (this.attributes["mountType"] === "NM") { //loop for all elements that could cancel eachother
                this.hideAttribute("mountColour");
                nbAttributes--;
            }
            else 
                this.displayAttribute("mountColour");
        }
        
        return nbAttributes;
    }

    generateSku() { /* call different function depending on category/subcategory */
        this.SKU = "";
        if (this.category === "FRA") {
            this.SKU += this.category + "-" + this.subcategory + "-" + this.attributes["substrateType"]+ "-";
          
    
            if (this.attributes["mountType"])
                this.SKU += this.attributes["mountType"] + "-";
            else if (this.category === "FRA" && !this.attributes["mountType"])
                this.SKU += "NM" + "-";
            if (this.attributes["glaze"])
                this.SKU += this.attributes["glaze"] + "-";
            this.SKU += this.attributes["size"];

        } else if (this.category === "CAN") {
            if (this.subcategory === "ROL") {
                this.SKU += this.category + "-" + this.subcategory + "-" + this.attributes["substrateType"] + "-" + this.attributes["size"];
                if (this.attributes["glaze"])
                    this.SKU += "-VAR";
            } else {
                this.SKU = "GLOBAL" + "-";
                if (this.subcategory !== "STR") 
                    this.SKU += this.subcategory + "-";
                this.SKU += this.category + "-" +  this.attributes["size"];
            }
        } else if (this.category === "PRINT") {
            if (this.subcategory === "GLOBAL")
                this.SKU = this.subcategory + "-" + this.attributes["substrateType"]+ "-";
            this.SKU += this.attributes["size"];
        }
        //this.SKU = "CAN-19MM-HMC-10X10"
        console.log(this.SKU)
        this.generatePricing();
    }

    generatePricing() {
        //contact API to get item price + add our pricing
        fetch('/api/pwinty/countries/FR', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({skus: [this.SKU]})
          })
          .then((res) => {return res.json()})
          .then((data) => {
            if (data.prices[0].price){
                if (data.prices[0].price === 0)
                    throw new Error("Something went wrong while searching this item in our catalog");
                this.price = data.prices[0].price / 100; //+ convert to eur
                this.displayPricing();
            }
            else 
                throw new Error("Something went wrong while searching this item in our catalog");
          })
          .catch((err) => {
            this.hidePricing();
            let alert = createAlertNode(err.message, "warning", "position: fixed;z-index: 33;margin: -5% 50% 0 50%;transform: translate(-50%,0px);");
            addAlert(alert, "#header");
          })
    }

    displayPricing() {
        document.getElementById("price").innerHTML = this.price + "€";
        document.getElementById("purchasebox").setAttribute("style", "display: block");
    }

    async cartAdd(itemId, caller) {
        let SKU = this.SKU;
        let attributes = this.attributes;
        attributes.category = this.category;
        attributes.subcategory = this.subcategory;
        let price = this.price;

        caller.disabled = true;
        caller.style.pointerEvents = "none";
        setTimeout(() => {
          caller.disabled = false;
          caller.style.pointerEvents = "auto";
        }, 1500);

        await fetch(`http://localhost:8089/api/cart/add/pwinty/${itemId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({SKU, price, attributes}),
          credentials: "include",
          mode: "same-origin"
        })
        .then(res => {return res.json();})
        .then(function(response) {
            let alertType = "success";
            if (response.error === false) {
              let totalQty = response.cart.totalQty;
              document.getElementById("cartQty").innerText = totalQty;
            } else 
                alertType = "warning";

            let alert = createAlertNode(response.msg, alertType, "position: fixed;z-index: 33;margin: -5% 50% 0 50%;transform: translate(-50%,0px);");
            addAlert(alert, "#header");
        })
        .catch(err => {
            let alert = createAlertNode(response.msg, alertType, "position: fixed;z-index: 33;margin: -5% 50% 0 50%;transform: translate(-50%,0px);");
            addAlert(alert, "#header");
        });
        return;
    }

    hidePricing() {document.getElementById("purchasebox").setAttribute("style", "display: none");}
    printInfo() {console.log(this)}
}

let Pwinty;
function loadCategory(item) {
    Pwinty = new PwintyObject(item);
    Pwinty.printInfo();
    return ;
}