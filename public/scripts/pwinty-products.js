const PWINTY_ITEMS = {
    "FRA": {
            "BOX": {
                "substrateType": [{"BAP" : "Budget Art Paper"}, {"BPP" : "Budget Photo Paper"}, {"CPP" : "Box Poster Paper"}, {"CPWP" : "Cold Press Watercolour Paper"}, {"EMA" : "Enhanced Matte Art Paper"},
                    {"HFAP" : "Hahnemühle Fine Art Paper"}, {"HGE" : "Hahnemühle German Etching"}, {"HPG" : "Hahnemühle Photo Glossy"}, {"HPL" : "Hahnemühle Photo Lustre"},
                    {"HPR" : "Hahnemühle Photo Rag"}, {"LPP" : "Lustre Photo Paper"}, {"MFA" : "Museum Fine Art Paper"}, {"MG" : "Metallic Gloss"}, {"SAP" : "Smooth Art Paper"}, {"SPR" : "Smooth Photo Rag"}],
                "substrateWeight": [{"180gsm" : "180gsm"}, {"170gsm" : "170gsm"}, {"200gsm" : "200gsm"}, {"240gsm" : "240gsm"},
                 {"260gsm" : "260gsm"}, {"280gsm" : "280gsm"}, {"285gsm" : "285gsm"}, {"308gsm" : "308gsm"}, {"310gsm" : "310gsm"}, {"315gsm" : "315gsm"}], //maybe useless param // does not modifiy sku
                "mountType": [{"MOUNT1" : "1.4mm"}, {"MOUNT2" : "2.0mm"}, {"NM" : "NO MOUNT"}],
                "glaze": [{"ACRY" : "Acrylic / Perspex"}, {"GLA" : "Float Glass"}, {"TRU" : "Tru View Museum Glass"}],
                "size": [{"20x20" : "20x20cm"}, {"20x30" : "20x30cm"}, {"A4" : "21x29.7cm"}, {"25x50" : "25x50cm"}],
                "frameColour": [{"Black" : "Black"}, {"Brown" : "Brown"}, {"White" : "White"}, {"Natural" : "Natural"}],//does not modifiy sku
                "mountColour": [{"Snow White" : "Snow White"}, {"Off-White" : "Off-White"}, {"Black" : "Black"}],//does not modifiy sku
            }, 
            "CLA": {
                "colour": ['zz', 'zxwn', 'Wfze', 'Nagaral'],
                "mountType": ["1.azeazefm", "2.afzzaf0mm", "NM"],
                "mountColour": ["Snoafze", "Oazfite", "Blafzk"],
                "glaze": ["Acryliaferspex", "Flazfss", "Tru azfuseum Glass"],
                "size": ["8azf2", "8.aaaa.7", "12wwwwx12"],
                "substrate": ["xzaafdzf"]
            }, "Gloss": {
                
            }, "Spacer": {
                
            }, "Surface (30mm)": {
                
            }, "Surface (50mm)": {
                
            }, "Swoop": {
                
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
            selection += subcategoryRadio;
        });
        document.getElementById("subcategories").innerHTML = selection + "</div>";
    }

    printInfo() {
        console.log(this)
    }

    loadSubCategory(subcategory) {
        console.log("loading sub")
        this.hidePricing();
        this.subcategory = subcategory.value;
        this.attributes = {};

        let selection = `<div class="row">`;
        Object.keys(PWINTY_ITEMS[subcategory.dataset.category][this.subcategory]).forEach(attribute => {
            this.attributes[attribute] = "";
    
            let attributeSelect = `<label for="${attribute}">
                                    <div class="sku-item unselectable">
                                        <p>${attribute}</p>
                                        <select data-attribute="${attribute}" name="${attribute}" id="${attribute}" onchange="Pwinty.updateAttribute(this)">
                                            <option value="" disabled selected>Pick one</option>`;//'${subcategory.dataset.category}', '${this.subcategory}'
            
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
        /*  let value = attribute.options[attribute.selectedIndex].value;
        let name = attribute.name;
        this.attributes[attribute.name] = { [value] : name }; */
        this.attributes[attribute.name] = attribute.options[attribute.selectedIndex].value;
        this.checkAttributes();
        //this.printInfo();
    }

    checkAttributes() {
        let nbAttributes = Object.keys(this.attributes).length;
        let selectedAttributes = 0;
    
        Object.keys(this.attributes).forEach(attribute => {
            if (this.attributes[attribute] !== "")
                selectedAttributes++; 
        })
        if (selectedAttributes === nbAttributes)
            this.generateSku();
    }

    generateSku() {
        this.SKU = "";
        this.SKU += this.category + "-" + this.subcategory + "-";
        this.SKU += this.attributes["substrateType"] + "-" + this.attributes["mountType"] + "-" + this.attributes["glaze"] + "-" + this.attributes["size"];
        console.log(this.SKU);
        
        this.generatePricing();
    }

    generatePricing() {
        console.log("generating pricing");
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
            let alert = `<div id="alert" class="alert alert-info" role="alert">
                            <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>
                              ${err.message}
                          </div>`;
            addAlert(alert, "#header");
          })
    }

    displayPricing() {
        //this.price;
        //display price and purchase button
        document.getElementById("price").innerHTML = this.price + "€";
        document.getElementById("purchasebox").setAttribute("style", "display: block");
    }

    hidePricing() {
        document.getElementById("purchasebox").setAttribute("style", "display: none");
    }

    //function to hide purchase box when changing category/sub etc
}

let Pwinty;
function loadCategory(item) {
    Pwinty = new PwintyObject(item);
    Pwinty.printInfo();
    return ;
}