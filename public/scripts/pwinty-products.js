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
    let selection = ``;
    Object.keys(PWINTY_ITEMS[item.value]).forEach(element => {
        //forge subcategories selection div checkboxes

        //change checkboxes to radio
        let subcategory = `<label for="${element}">
                                <div class="sku-item unselectable">
                                    <p>${element}</p>
                                    <input data-category="${item.value}" name="${element}" id="${element}" value="${element}" type="checkbox" onclick="loadsSubCategory(this)">
                                </div>
                            </label>`;
        selection += subcategory;
    });
    document.getElementById("subcategories").innerHTML = selection;
    //fetchAvailableOptions(item.value)
}

function loadsSubCategory(item) {
    console.log(PWINTY_ITEMS[item.dataset.category][item.value]);
}