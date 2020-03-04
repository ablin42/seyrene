const PWINTY_ITEMS = {
    "framed": {
            "Box": {
                "substrateType": [{"BAP" : "BAP"}, {"BPP" : "BPP"}, {"CPP" : "CPP"}, {"CPWP" : "CPWP"}, {"EMA" : "EMA"}, {"HFAP" : "HFAP"},
                 {"HGE" : "HGE"}, {"HPG" : "HPG"}, {"HPL" : "HPL"}, {"HPR" : "HPR"}, {"LPP" : "LPP"}, {"MFA" : "MFA"}, {"MG" : "MG"}, {"SAP" : "SAP"}, {"SPR" : "SPR"}],
                "substrateWeight": [{"180gsm" : "180gsm"}, {"170gsm" : "170gsm"}, {"200gsm" : "200gsm"}, {"240gsm" : "240gsm"},
                 {"260gsm" : "260gsm"}, {"280gsm" : "280gsm"}, {"285gsm" : "285gsm"}, {"308gsm" : "308gsm"}, {"310gsm" : "310gsm"}, {"315gsm" : "315gsm"}], //maybe useless param // does not modifiy sku
                "mountType": [{"1.4mm" : "1.4mm"}, {"2.0mm" : "2.0mm"}, {"NM" : "NO MOUNT"}],
                "glaze": [{"Acrylic / Perspex" : "Acrylic / Perspex"}, {"Float Glass" : "Float Glass"}, {"Tru View Museum Glass" : "Tru View Museum Glass"}],
                "size": [{"8x8" : "8x8"}, {"8x12" : "8x12"}, {"8.3x11.7" : "8.3x11.7"}, {"12x12" : "12x12"}],
                "colour": [{'Black' : 'Black'}, {'Brown' : 'Brown'}, {'White' : 'White'}, {'Natural' : 'Natural'}],//does not modifiy sku
                "mountColour": [{"Snow White" : "Snow White"}, {"Off-White" : "Off-White"}, {"Black" : "Black"}],//does not modifiy sku
            }, "Classic": {
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
        /*"colour": ['Black', 'Brown', 'White', 'Natural'],
        "mountType": ["1.4mm", "2.0mm", "NM"],
        "mountColour": ["Snow White", "Off-White", "Black"],
        "glaze": ["Acrylic / Perspex", "Float Glass", "Tru View Museum Glass"],
        "size": ["8x8", "8x12", "8.3x11.7", "12x12"],
        //"frame": ["Box", "Classic", "Gloss", "Spacer", "Surface (30mm)", "Surface (50mm)", "Swoop"],
        "substrate": []
        //substratetype/substrateweight
        //resolution/optimum dimensions*/
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
                console.log(selectOption)
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
        this.printInfo();
    }

    checkAttributes() {
        let nbAttributes = Object.keys(this.attributes).length;
        let selectedAttributes = 0;
    
        //save attribute in object
        Object.keys(this.attributes).forEach(attribute => {
            if (this.attributes[attribute] !== "")
                selectedAttributes++; 
        })
        if (selectedAttributes === nbAttributes)
            this.generateSku();
    }

    generateSku() {
        console.log("generating SKU")

        this.generatePricing();
    }

    generatePricing() {
        console.log("generating pricing");
        //contact API + add our pricing
    }
}

let Pwinty;
function loadCategory(item) {
    Pwinty = new PwintyObject(item);
    Pwinty.printInfo();
    return ;
}