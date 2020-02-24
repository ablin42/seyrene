const PWINTY_ITEMS = {
    "framed": {
            "Box": {
                "substrateType": ["BAP", "BPP", "CPP", "CPWP", "EMA", "HFAP", "HGE", "HPG", "HPL", "HPR", "LPP", "MFA", "MG", "SAP", "SPR"],
                "substrateWeight": ["180gsm", "170gsm", "200gsm", "240gsm", "260gsm", "280gsm", "285gsm", "308gsm", "310gsm", "315gsm"], //maybe useless param // does not modifiy sku
                "mountType": ["1.4mm", "2.0mm", "NM"],
                "glaze": ["Acrylic / Perspex", "Float Glass", "Tru View Museum Glass"],
                "size": ["8x8", "8x12", "8.3x11.7", "12x12"],
                "colour": ['Black', 'Brown', 'White', 'Natural'],//does not modifiy sku
                "mountColour": ["Snow White", "Off-White", "Black"],//does not modifiy sku
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

function loadCategory(item) {
    let selection = `<div class="row">`;
    let category = item.value;

    Object.keys(PWINTY_ITEMS[category]).forEach(subcategory => {
        //forge subcategories selection div checkboxes

        let subcategoryRadio = `<label for="${subcategory}">
                                <div class="sku-item unselectable">
                                    <p>${subcategory}</p>
                                    <input data-category="${category}" name="pwinty-subcategory" id="${subcategory}" value="${subcategory}" type="radio" onclick="loadsSubCategory(this)">
                                </div>
                            </label>`;
        selection += subcategoryRadio;
    });
    document.getElementById("subcategories").innerHTML = selection + "</div>";
}

function loadsSubCategory(subcategory) {
    //console.log(PWINTY_ITEMS[subcategory.dataset.category][subcategory.value]);
    let selection = `<div class="row">`;
    Object.keys(PWINTY_ITEMS[subcategory.dataset.category][subcategory.value]).forEach(attribute => {
        //forge subcategories selection div checkboxes

        let attributeSelect = `<label for="${attribute}">
                                <div class="sku-item unselectable">
                                    <p>${attribute}</p>
                                    <select data-attribute="${attribute}" name="${attribute}" id="${attribute}" onchange="checkAttributes('${subcategory.dataset.category}', '${subcategory.value}')">
                                        <option value="" disabled selected>Pick one</option>`;
        
        PWINTY_ITEMS[subcategory.dataset.category][subcategory.value][attribute].forEach(selectOption => {
            attributeSelect += `<option value="${selectOption}">${selectOption}</option>`;
        });

        attributeSelect +=              `</select>
                                </div>
                            </label>`;
        selection += attributeSelect;
    });
    document.getElementById("attributes").innerHTML = selection + "</div>";
}

//check if all attributes have been selected, if yes, generate sku and calculate price, else do nothing/wait
function checkAttributes(category, subcategory) {
    //console.log(category, subcategory)
    let attributes = document.querySelectorAll('[data-attribute]');
    let nbAttributes = attributes.length;
    let selectedAttributes = 0;

    attributes.forEach(attribute => {
        if (attribute.options[attribute.selectedIndex].value !== "")
            selectedAttributes++; 
    })
    if (selectedAttributes === nbAttributes)
        generateSku("data");
}

function generateSku(data) {
    console.log("OK!")
}