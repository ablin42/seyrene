let PWINTY_ITEMS = {
    "FRA": {
            "sharedAttributes": {
                "substrateType": [{"BAP" : "Budget Art Paper"}, {"BPP" : "Budget Photo Paper"}, {"CPP" : "Box Poster Paper"}, {"CPWP" : "Cold Press Watercolour Paper"}, {"EMA" : "Enhanced Matte Art Paper"},
                    {"HFAP" : "Hahnemühle Fine Art Paper"}, {"HGE" : "Hahnemühle German Etching"}, {"HPG" : "Hahnemühle Photo Glossy"}, {"HPL" : "Hahnemühle Photo Lustre"},
                    {"HPR" : "Hahnemühle Photo Rag"}, {"LPP" : "Lustre Photo Paper"}, {"MFA" : "Museum Fine Art Paper"}, {"MG" : "Metallic Gloss"}, {"SAP" : "Smooth Art Paper"}, {"SPR" : "Smooth Photo Rag"}],
                "size": [{"20x20" : "20x20cm"}, {"20x30" : "20x30cm"}, {"A4" : "21x29.7cm"}, {"30x30" : "30x30cm"}, {"28x35" : "28x35.5cm"}, {"30x40" : "30x40cm"},
                    {"A3" : "29.7x42cm"}, {"25x50" : "25x50cm"}, {"30x45" : "30x45cm"}, {"40x40" : "40x40cm"}, {"40x50" : "40x50cm"}, {"40x60" : "40x60cm"}, {"A2" : "42x59.4cm"},
                    {"50x50" : "50x50cm"}, {"45x60" : "45x60cm"}, {"40x80" : "40x80cm"}, {"50x70" : "50x70cm"}, {"60x60" : "60x60cm"}, {"50x75" : "50x75cm"}, {"60x80" : "60x80cm"},
                    {"A1" : "59.4x84.1cm"}, {"70x70" : "70x70cm"}, {"50x100" : "50x100cm"}, {"60x90" : "60x90cm"}, {"75x75" : "75x75cm"}, {"80x80" : "80x80cm"}, {"70x100" : "70x100cm"}, {"90x90" : "90x90cm"}],
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

class PwintyObject {
    constructor(item) {
        this.SKU = "";
        this.category = item.value;
        this.subcategory = ""
        this.attributes = {};

        document.getElementById("subcategories").innerHTML = "";
        document.getElementById("attributes").innerHTML = "";
        this.hidePricing()

        let selection = `<div class="row">`;
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
        document.getElementById("subcategories").innerHTML = selection + "</div>";
    }

    loadSubCategory(subcategory) {
        this.hidePricing();
        this.subcategory = subcategory.value;
        this.attributes = {};

        let selection = `<div class="row">`;
        Object.keys(PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"]).forEach(attribute => {
            this.attributes[attribute] = "";
    
            let attributeSelect = `<label for="${attribute}">
                                    <div class="sku-item unselectable">
                                        <p>${attribute}</p>
                                        <select data-attribute="${attribute}" name="${attribute}" id="${attribute}" onchange="Pwinty.updateAttribute(this)">
                                            <option value="" disabled selected>Pick one</option>`;
            
            PWINTY_ITEMS[subcategory.dataset.category]["sharedAttributes"][attribute].forEach(selectOption => {
                attributeSelect += `<option value="${Object.keys(selectOption)}">${Object.values(selectOption)}</option>`;
            });
    
            attributeSelect +=              `</select>
                                    </div>
                                </label>`;
            selection += attributeSelect;
        });
        Object.keys(PWINTY_ITEMS[subcategory.dataset.category][this.subcategory]).forEach(attribute => {
            this.attributes[attribute] = "";
    
            let attributeSelect = `<label for="${attribute}">
                                    <div class="sku-item unselectable">
                                        <p>${attribute}</p>
                                        <select data-attribute="${attribute}" name="${attribute}" id="${attribute}" onchange="Pwinty.updateAttribute(this)">
                                            <option value="" disabled selected>Pick one</option>`;
            
            PWINTY_ITEMS[subcategory.dataset.category][this.subcategory][attribute].forEach(selectOption => {
                attributeSelect += `<option value="${Object.keys(selectOption)}">${Object.values(selectOption)}</option>`;
            });
    
            attributeSelect +=              `</select>
                                    </div>
                                </label>`;
            selection += attributeSelect;
        });
        document.getElementById("attributes").innerHTML = selection + "</div>";
        this.printInfo();
    }

    updateAttribute(attribute) {
        this.attributes[attribute.name] = attribute.options[attribute.selectedIndex].value;

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
            let alert = `<div id="alert" class="alert alert-warning" role="alert" style="position: fixed;z-index: 33;margin: -5% 50% 0 50%;transform: translate(-50%,0px);">
                            <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                              ${err.message}
                          </div>`;
            addAlert(alert, "#header");
          })
    }

    displayPricing() {
        document.getElementById("price").innerHTML = this.price + "€";
        document.getElementById("purchasebox").setAttribute("style", "display: block");
    }

    cartAdd() {
        console.log("adding to cart...");
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