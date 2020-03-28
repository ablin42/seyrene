let PWINTY_ITEMS = {
    "FRA": {
            "sharedAttributes": {
                "substrateType": [{"BAP" : "Budget Art Paper"}, {"BPP" : "Budget Photo Paper"}, {"CPP" : "Box Poster Paper"}, {"CPWP" : "Cold Press Watercolour Paper"}, {"EMA" : "Enhanced Matte Art Paper"},
                    {"HFAP" : "Hahnemühle Fine Art Paper"}, {"HGE" : "Hahnemühle German Etching"}, {"HPG" : "Hahnemühle Photo Glossy"}, {"HPL" : "Hahnemühle Photo Lustre"},
                    {"HPR" : "Hahnemühle Photo Rag"}, {"LPP" : "Lustre Photo Paper"}, {"MFA" : "Museum Fine Art Paper"}, {"MG" : "Metallic Gloss"}, {"SAP" : "Smooth Art Paper"}, {"SPR" : "Smooth Photo Rag"}],
                "size": [{"20x20" : "20x20cm"}, {"20x30" : "20x30cm"}, {"A4" : "21x29.7cm"},
                    {"30x30" : "30x30cm"}, {"28x35" : "28x35.5cm"}, {"30x40" : "30x40cm"},
                    {"A3" : "29.7x42cm"}, {"25x50" : "25x50cm"}, {"30x45" : "30x45cm"},
                    {"40x40" : "40x40cm"}, {"40x50" : "40x50cm"}, {"40x60" : "40x60cm"},
                    {"A2" : "42x59.4cm"}, {"50x50" : "50x50cm"}, {"45x60" : "45x60cm"},
                    {"40x80" : "40x80cm"}, {"50x70" : "50x70cm"}, {"60x60" : "60x60cm"},
                    {"50x75" : "50x75cm"}, {"60x80" : "60x80cm"},{"A1" : "59.4x84.1cm"},
                    {"70x70" : "70x70cm"}, {"50x100" : "50x100cm"}, {"60x90" : "60x90cm"},
                    {"75x75" : "75x75cm"}, {"80x80" : "80x80cm"}, {"70x100" : "70x100cm"},
                    {"90x90" : "90x90cm"}],
            },
            "BOX": {
                "mountType": [{"MOUNT1" : "1.4mm"}, {"MOUNT2" : "2.0mm"}, {"NM" : "NO MOUNT"}],
                "glaze": [{"ACRY" : "Acrylic / Perspex"}, {"GLA" : "Float Glass"}, {"TRU" : "Tru View Museum Glass"}],
                "frameColour": [{"Black" : "Black"}, {"Brown" : "Brown"}, {"White" : "White"}, {"Natural" : "Natural"}],
                "mountColour": [{"Snow White" : "Snow White"}, {"Off-White" : "Off-White"}, {"Black" : "Black"}]
            },
            "CLA": {
                "mountType": [{"MOUNT1" : "1.4mm"}, {"MOUNT2" : "2.0mm"}, {"NM" : "NO MOUNT"}],
                "glaze": [{"ACRY" : "Acrylic / Perspex"}, {"GLA" : "Float Glass"}, {"TRU" : "Tru View Museum Glass"}],
                "frameColour": [{"Black" : "Black"}, {"Brown" : "Brown"}, {"White" : "White"}, {"Natural" : "Natural"}, {"Silver" : "Silver"}, {"Gold" : "Gold"}],
                "mountColour": [{"Snow White" : "Snow White"}, {"Off-White" : "Off-White"}, {"Black" : "Black"}]
            }, 
            "GLO": {
                "mountType": [{"MOUNT1" : "1.4mm"}, {"MOUNT2" : "2.0mm"}, {"NM" : "NO MOUNT"}],
                "glaze": [{"ACRY" : "Acrylic / Perspex"}], //, {"GLA" : "Float Glass"}
                "frameColour": [{"Black" : "Black"}, {"White" : "White"}],
                "mountColour": [{"Snow White" : "Snow White"}, {"Off-White" : "Off-White"}, {"Black" : "Black"}]
            }, 
            "SPACE": {
                "glaze": [{"ACRY" : "Acrylic / Perspex"}, {"GLA" : "Float Glass"}, {"TRU" : "Tru View Museum Glass"}],
                "frameColour": [{"Black" : "Black"}, {"Brown" : "Brown"}, {"White" : "White"}, {"Natural" : "Natural"}, {"Silver" : "Silver"}, {"Gold" : "Gold"}]
            }, 
            "SUR1": {
                "frameColour": [{"Black" : "Black"}, {"White" : "White"}]
            }, 
            "SUR2": {
                "frameColour": [{"Black" : "Black"}, {"White" : "White"}]
            }, 
            "SWO": {
                "mountType": [{"MOUNT1" : "1.4mm"}, {"MOUNT2" : "2.0mm"}, {"NM" : "NO MOUNT"}],
                "glaze": [{"ACRY" : "Acrylic / Perspex"}], //, {"GLA" : "Float Glass"}
                "frameColour": [{"Black" : "Black"}, {"White" : "White"}],
                "mountColour": [{"Snow White" : "Snow White"}, {"Off-White" : "Off-White"}, {"Black" : "Black"}]
            },
    },
    "mounted": [],
}

let A_FORMAT = [{code:"A4", size:"21x29.7"}, {code:"A3", size:"29.7x42"}, {code:"A2", size:"42x59.4"}, {code:"A1", size:"59.4x84.1"}]

let DIMENSIONS_FRAMES = [{megapixel: 500000, max: 20}, {megapixel: 1800000, max: 30}, {megapixel: 2900000, max: 40}, {megapixel: 4800000, max: 50},
    {megapixel: 6700000, max: 60}, {megapixel: 7400000, max: 75}, {megapixel: 9300000, max: 100}];

let DIMENSIONS_CANVAS = [{megapixel: 9300000, max: 150}, {megapixel: 9300000, max: 100}, {megapixel: 7400000, max: 75}, {megapixel: 6700000, max: 60}, 
    {megapixel: 4800000, max: 50}, {megapixel: 2900000, max: 40}, {megapixel: 1800000, max: 30}];

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
        Object.keys(PWINTY_ITEMS[this.category]).forEach(subcategory => {
            let subcategoryRadio = `<label for="${subcategory}">
                                    <div class="sku-item unselectable">
                                        <p>${subcategory}</p>
                                        <input data-category="${this.category}" name="pwinty-subcategory" id="${subcategory}" value="${subcategory}" type="radio" onclick="Pwinty.loadSubCategory(this)">
                                    </div>
                                </label>`;
            if (subcategory !== "sharedAttributes")
                selection += subcategoryRadio;
        });
        document.getElementById("subcategories").innerHTML = selection;
    }

    loadSubCategory(subcategory) {
        this.hidePricing();
        this.subcategory = subcategory.value;
        this.attributes = {};

        let selection = ``;
        Object.keys(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"]).forEach(attribute => {
            this.attributes[attribute] = "";
    
            let attributeSelect = `<label for="${attribute}">
                                    <div class="sku-item unselectable">
                                        <p>${attribute}</p>
                                        <div class="select-wrapper">
                                        <select data-attribute="${attribute}" name="${attribute}" id="${attribute}" onchange="Pwinty.updateAttribute(this)">
                                            <option disabled selected>Pick one</option>`;
            
            PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"][attribute].forEach(selectOption => {
                if (attribute !== "size")
                    attributeSelect += `<option value="${Object.keys(selectOption)[0]}">${Object.values(selectOption)[0]}</option>`;
                else {
                    let dimensions = Object.keys(selectOption)[0].split("x");
                    if (isNaN(parseInt(dimensions[0]))) {
                        for (let i = 0; i < A_FORMAT.length; i++) {
                            if (dimensions[0] === A_FORMAT[i].code)
                                dimensions = A_FORMAT[i].size.split("x");
                        }
                    }

                    let maxDimension = parseInt(dimensions[0]);
                    if (parseInt(dimensions[1]) > parseInt(dimensions[0]))
                        maxDimension = parseInt(dimensions[1]);               

                    if (this.megapixel > 9300000) 
                        attributeSelect += `<option value="${Object.keys(selectOption)[0]}">${Object.values(selectOption)[0]}</option>`;
                    else {
                        let i = 0;
                        while (this.megapixel > DIMENSIONS_FRAMES[i].megapixel) 
                            i++;
                        var max = DIMENSIONS_FRAMES[i].max;
                        if (maxDimension <= max)
                            attributeSelect += `<option value="${Object.keys(selectOption)[0]}">${Object.values(selectOption)[0]}</option>`;
                    }
                }
            });
            attributeSelect +=              `</select></div>
                                    </div>
                                </label>`;
            selection += attributeSelect;
        });
        Object.keys(PWINTY_ITEMS[subcategory.dataset.category][this.subcategory]).forEach(attribute => {
            this.attributes[attribute] = "";
    
            let attributeSelect = `<label for="${attribute}">
                                    <div class="sku-item unselectable">
                                        <p>${attribute}</p>
                                        <div class="select-wrapper">
                                        <select data-attribute="${attribute}" name="${attribute}" id="${attribute}" onchange="Pwinty.updateAttribute(this)">
                                            <option disabled selected>Pick one</option>`;
            
            PWINTY_ITEMS[subcategory.dataset.category][this.subcategory][attribute].forEach(selectOption => {
                attributeSelect += `<option value="${Object.keys(selectOption)}">${Object.values(selectOption)}</option>`;
            });
    
            attributeSelect +=              `</select></div>
                                    </div>
                                </label>`;
            selection += attributeSelect;
        });
        document.getElementById("attributes").innerHTML = selection;
        this.selectScript();
        this.printInfo();
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
        console.log(attribute, optionValue)
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

    generateSku() {
        this.SKU = "";
        this.SKU += this.category + "-" + this.subcategory + "-" + this.attributes["substrateType"]+ "-";
        if (this.attributes["mountType"])
            this.SKU += this.attributes["mountType"] + "-";
        else if (this.category === "FRA" && !this.attributes["mountType"])
            this.SKU += "NM" + "-";
        if (this.attributes["glaze"])
            this.SKU += this.attributes["glaze"] + "-";
        this.SKU += this.attributes["size"];
        console.log(this.SKU);
        
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