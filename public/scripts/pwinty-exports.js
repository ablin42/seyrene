const substrateType = {
    BAP: "Budget Art Paper", BPP: "Budget Photo Paper", CPP: "Classic Poster Paper", CPWP: "Cold Press Watercolour Paper", EMA: "Enhanced Matte Art Paper",
    HFAP: "Hahnemühle Fine Art Paper", HGE: "Hahnemühle German Etching", HPG: "Hahnemühle Photo Glossy", HPL: "Hahnemühle Photo Lustre",
    HPR: "Hahnemühle Photo Rag", LPP: "Lustre Photo Paper", MFA: "Museum Fine Art Paper", MG: "Metallic Gloss", SAP: "Smooth Art Paper", SPR: "Smooth Photo Rag"
}

const FRA_sizes = {
    "20x20": "20x20cm", "20x30": "20x30cm", "A4": "21x29.7cm",
    "30x30": "30x30cm", "28x35": "28x35.5cm", "30x40": "30x40cm",
    "A3": "29.7x42cm", "25x50": "25x50cm", "30x45": "30x45cm",
    "40x40": "40x40cm", "40x50": "40x50cm", "40x60": "40x60cm",
    "A2": "42x59.4cm", "50x50": "50x50cm", "45x60": "45x60cm",
    "40x80": "40x80cm", "50x70": "50x70cm", "60x60": "60x60cm",
    "50x75": "50x75cm", "60x80": "60x80cm","A1": "59.4x84.1cm",
    "70x70": "70x70cm", "50x100": "50x100cm", "60x90": "60x90cm",
    "75x75": "75x75cm", "80x80": "80x80cm", "70x100": "70x100cm",
    "90x90": "90x90cm"
}

const PRINT_substrate = {
    FAP: "Enhanced Matte Art Paper", HGE: "Hahnemühle German Etching", HPR: "Hahnemühle Photo Rag", PAP: "Lustre Photo Paper"
}

const PRINT_sizes = { //left sizes are in inches CARE
    "8x8": "20x20cm", "8x12": "20x30cm", "A4": "21x29.7cm",
    "12x12": "30x30cm", "11x14": "28x35.5cm", "12x16": "30x40cm",
    "A3": "29.7x42cm", "10x20": "25x50cm", "12x18": "30x45cm",
    "16x16": "40x40cm", "16x20": "40x50cm", "16x24": "40x60cm",
    "A2": "42x59.4cm", "20x20": "50x50cm", "18x24": "45x60cm",
    "16x32": "40x80cm", "20x28": "50x70cm", "24x24": "60x60cm",
    "20x30": "50x75cm", "24x32": "60x80cm","A1": "59.4x84.1cm",
    "28x28": "70x70cm", "20x40": "50x100cm", "24x36": "60x90cm",
    "30x30": "75x75cm", "32x32": "80x80cm", "28x40": "70x100cm",
    "36x36": "90x90cm", "A0": "84.1x118.9cm", "40x40": "100x100cm",
    "30x60": "75x150cm", "40x48": "100x120cm", "48x48": "120x120cm",
    "40x60": "100x150cm", "40x80": "100x200cm", 
}


const PWINTY_ITEMS = {
    "FRA": {
        "sharedAttributes": {
            "substrateType": substrateType,
            "size": FRA_sizes,
        },
        "BOX": {
            "mountType": {MOUNT1: "1.4mm", MOUNT2: "2.0mm", NM: "NO MOUNT"},
            "glaze": {ACRY: "Acrylic / Perspex", GLA: "Float Glass", TRU: "Tru View Museum Glass"},
            "frameColour": {Black: "Black", Brown: "Brown", White: "White", Natural: "Natural"},
            "mountColour": {"Snow White": "Snow White", "Off-White": "Off-White", Black: "Black"}
        },
        "CLA": {
            "mountType": {MOUNT1: "1.4mm", MOUNT2: "2.0mm", NM: "NO MOUNT"},
            "glaze": {ACRY: "Acrylic / Perspex", GLA: "Float Glass", TRU: "Tru View Museum Glass"},
            "frameColour": {Black: "Black", Brown: "Brown", White: "White", Natural: "Natural", Silver: "Silver", Gold: "Gold"},
            "mountColour": {"Snow White": "Snow White", "Off-White": "Off-White", Black: "Black"}
        }, 
        "GLO": {
            "mountType": {MOUNT1: "1.4mm", MOUNT2: "2.0mm", NM: "NO MOUNT"},
            "glaze": {ACRY: "Acrylic / Perspex"},// {"GLA" : "Float Glass"}
            "frameColour": {Black: "Black", White: "White"},
            "mountColour": {"Snow White": "Snow White", "Off-White": "Off-White", Black: "Black"}
        }, 
        "SPACE": {
            "glaze": {ACRY: "Acrylic / Perspex", GLA: "Float Glass", TRU: "Tru View Museum Glass"},
            "frameColour": {Black: "Black", Brown: "Brown", White: "White", Natural: "Natural", Silver: "Silver", Gold: "Gold"}
        }, 
        "SUR1": {
            "frameColour": {Black: "Black", White: "White"}
        }, 
        "SUR2": {
            "frameColour": {Black: "Black", White: "White"}
        }, 
        "SWO": {
            "mountType": {MOUNT1: "1.4mm", MOUNT2: "2.0mm", NM: "NO MOUNT"},
            "glaze": {ACRY: "Acrylic / Perspex"}, //, {"GLA" : "Float Glass"}
            "frameColour": {Black: "Black", White: "White"},
            "mountColour": {"Snow White": "Snow White", "Off-White": "Off-White", Black: "Black"}
        },
    },
    "PRINT": {
        "sharedAttributes": {
            "size": PRINT_sizes,
            "substrateType": PRINT_substrate,
        },
        "GLOBAL": {

        }
    },
}

let A_FORMAT = [{code:"A4", size:"21x29.7"}, {code:"A3", size:"29.7x42"}, {code:"A2", size:"42x59.4"}, {code:"A1", size:"59.4x84.1"}]

let DIMENSIONS_FRAMES = [{megapixel: 500000, max: 20}, {megapixel: 1800000, max: 30}, {megapixel: 2900000, max: 40}, {megapixel: 4800000, max: 50},
    {megapixel: 6700000, max: 60}, {megapixel: 7400000, max: 75}, {megapixel: 9300000, max: 100}];

let DIMENSIONS_CANVAS = [{megapixel: 9300000, max: 150}, {megapixel: 9300000, max: 100}, {megapixel: 7400000, max: 75}, {megapixel: 6700000, max: 60}, 
    {megapixel: 4800000, max: 50}, {megapixel: 2900000, max: 40}, {megapixel: 1800000, max: 30}];