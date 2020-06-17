const substrateType = {
    BAP: "Budget Art Paper", CPP: "Classic Poster Paper", CPWP: "Cold Press Watercolour Paper", EMA: "Enhanced Matte Art Paper", HFAP: "Hahnemühle Fine Art Paper", HGE: "Hahnemühle German Etching", MFA: "Museum Fine Art Paper", MG: "Metallic Gloss", SAP: "Smooth Art Paper"
};

const substrateTypeCLA = {
    BAP: "Budget Art Paper", CPP: "Classic Poster Paper", CPWP: "Cold Press Watercolour Paper", HFAP: "Hahnemühle Fine Art Paper", HGE: "Hahnemühle German Etching", MFA: "Museum Fine Art Paper", MG: "Metallic Gloss", SAP: "Smooth Art Paper"
};


const mountType = {MOUNT1: "1.4mm", MOUNT2: "2.0mm", NM: "NO MOUNT"};

const glazeType = {ACRY: "Acrylic / Perspex", GLA: "Float Glass", TRU: "Tru View Museum Glass"};

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
};

const FRA_SUR_sizes = {
    "21x29": "A4", "29x42": "A3", "42x59": "A2", "59x84": "A1"
};

const PRINT_substrate = {
    FAP: "Enhanced Matte Art Paper", HGE: "Hahnemühle German Etching"
};

const PRINT_sizes = {
    "6x4": "15x10cm", "6x6": "15x15cm", "8x8": "20x20cm", "8x12": "20x30cm", "A4": "21x29.7cm",
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
};

const CAN_substrate = {
    PC: "Polycanvas", SC: "Standard Canvas", HMC: "Hahnemühle Monet Canvas", //MC: "Metallic Canvas" (too much errors)
};

//Stretched/Framed canvas (GLOBAL)
const CAN_sizes = { 
    "8x8": "20x20cm", "8x10": "20x25cm", "8x12": "20x30cm",
    "10x10": "25x25cm", "10x12": "25x30cm", "12x12": "30x30cm",
    "12x16": "30x40cm", "12x18": "30x45cm", "16x16": "40x40cm", "16x20": "40x50cm", "16x24": "40x60cm",
    "20x20": "50x50cm", "18x24": "45x60cm",
    "20x24": "50x60", "20x28": "50x70cm", "24x24": "60x60cm",
    "20x30": "50x75cm", "24x32": "60x80cm", "28x28": "70x70cm", "24x36": "60x90cm",
    "32x32": "80x80cm", "28x40": "70x100cm", "30x40": "76x101cm",
};

const CAN_ROL_sizes = {
    "8x8": "20x20cm", "8x10": "20x25cm", "8x12": "20x30cm", "8x14": "20x36cm", "8x16": "20x41cm", "8x18": "20x46cm", "8x20": "20x51cm", "8x22": "20x56cm", "8x24": "20x61cm", "8x26": "20x66cm", "8x28": "20x71cm", "8x30": "20x76cm", "8x32": "20x81cm", "8x34": "20x86cm", "8x36": "20x91cm", "8x38": "20x97cm", "8x40": "20x102cm", "8x42": "20x107cm", "8x44": "20x112cm", "8x46": "20x117cm", "8x48": "20x122cm", "8x50": "20x127cm", "8x51": "20x130cm", "8x54": "20x137cm", "8x55": "20x140cm", "8x56": "20x142cm", "8x60": "20x152cm", "8x63": "20x160cm", "8x67": "20x170cm", "8x72": "20x183cm", "8x79": "20x201cm", "8x98": "20x249cm", "8x118": "20x300cm", "10x10": "25x25cm", "10x12": "25x30cm", "10x14": "25x36cm", "10x16": "25x41cm", "10x18": "25x46cm", "10x20": "25x51cm", "10x22": "25x56cm", "10x24": "25x61cm", "10x26": "25x66cm", "10x28": "25x71cm", "10x30": "25x76cm", "10x32": "25x81cm", "10x34": "25x86cm", "10x36": "25x91cm", "10x38": "25x97cm", "10x40": "25x102cm", "10x42": "25x107cm", "10x44": "25x112cm", "10x46": "25x117cm", "10x48": "25x122cm", "10x50": "25x127cm", "10x51": "25x130cm", "10x54": "25x137cm", "10x55": "25x140cm", "10x56": "25x142cm", "10x60": "25x152cm", "10x63": "25x160cm", "10x67": "25x170cm", "10x72": "25x183cm", "10x79": "25x201cm", "10x98": "25x249cm", "10x118": "25x300cm", "12x12": "30x30cm", "12x14": "30x36cm", "12x16": "30x41cm", "12x18": "30x46cm", "12x20": "30x51cm", "12x22": "30x56cm", "12x24": "30x61cm", "12x26": "30x66cm", "12x28": "30x71cm", "12x30": "30x76cm", "12x32": "30x81cm", "12x34": "30x86cm", "12x36": "30x91cm", "12x38": "30x97cm", "12x40": "30x102cm", "12x42": "30x107cm", "12x44": "30x112cm", "12x46": "30x117cm", "12x48": "30x122cm", "12x50": "30x127cm", "12x51": "30x130cm", "12x54": "30x137cm", "12x55": "30x140cm", "12x56": "30x142cm", "12x60": "30x152cm", "12x63": "30x160cm", "12x67": "30x170cm", "12x72": "30x183cm", "12x79": "30x201cm", "12x98": "30x249cm", "12x118": "30x300cm", "14x14": "36x36cm", "14x16": "36x41cm", "14x18": "36x46cm", "14x20": "36x51cm", "14x22": "36x56cm", "14x24": "36x61cm", "14x26": "36x66cm", "14x28": "36x71cm", "14x30": "36x76cm", "14x32": "36x81cm", "14x34": "36x86cm", "14x36": "36x91cm", "14x38": "36x97cm", "14x40": "36x102cm", "14x42": "36x107cm", "14x44": "36x112cm", "14x46": "36x117cm", "14x48": "36x122cm", "14x50": "36x127cm", "14x51": "36x130cm", "14x54": "36x137cm", "14x55": "36x140cm", "14x56": "36x142cm", "14x60": "36x152cm", "14x63": "36x160cm", "14x67": "36x170cm", "14x72": "36x183cm", "14x79": "36x201cm", "14x98": "36x249cm", "14x118": "36x300cm", "16x16": "41x41cm", "16x18": "41x46cm", "16x20": "41x51cm", "16x22": "41x56cm", "16x24": "41x61cm", "16x26": "41x66cm", "16x28": "41x71cm", "16x30": "41x76cm", "16x32": "41x81cm", "16x34": "41x86cm", "16x36": "41x91cm", "16x38": "41x97cm", "16x40": "41x102cm", "16x42": "41x107cm", "16x44": "41x112cm", "16x46": "41x117cm", "16x48": "41x122cm", "16x50": "41x127cm", "16x51": "41x130cm", "16x54": "41x137cm", "16x55": "41x140cm", "16x56": "41x142cm", "16x60": "41x152cm", "16x63": "41x160cm", "16x67": "41x170cm", "16x72": "41x183cm", "16x79": "41x201cm", "16x98": "41x249cm", "16x118": "41x300cm", "18x18": "46x46cm", "18x20": "46x51cm", "18x22": "46x56cm", "18x24": "46x61cm", "18x26": "46x66cm", "18x28": "46x71cm", "18x30": "46x76cm", "18x32": "46x81cm", "18x34": "46x86cm", "18x36": "46x91cm", "18x38": "46x97cm", "18x40": "46x102cm", "18x42": "46x107cm", "18x44": "46x112cm", "18x46": "46x117cm", "18x48": "46x122cm", "18x50": "46x127cm", "18x51": "46x130cm", "18x54": "46x137cm", "18x55": "46x140cm", "18x56": "46x142cm", "18x60": "46x152cm", "18x63": "46x160cm", "18x67": "46x170cm", "18x72": "46x183cm", "18x79": "46x201cm", "18x98": "46x249cm", "18x118": "46x300cm", "20x20": "51x51cm", "20x22": "51x56cm", "20x24": "51x61cm", "20x26": "51x66cm", "20x28": "51x71cm", "20x30": "51x76cm", "20x32": "51x81cm", "20x34": "51x86cm", "20x36": "51x91cm", "20x38": "51x97cm", "20x40": "51x102cm", "20x42": "51x107cm", "20x44": "51x112cm", "20x46": "51x117cm", "20x48": "51x122cm", "20x50": "51x127cm", "20x51": "51x130cm", "20x54": "51x137cm", "20x55": "51x140cm", "20x56": "51x142cm", "20x60": "51x152cm", "20x63": "51x160cm", "20x67": "51x170cm", "20x72": "51x183cm", "20x79": "51x201cm", "20x98": "51x249cm", "20x118": "51x300cm", "22x22": "56x56cm", "22x24": "56x61cm", "22x26": "56x66cm", "22x28": "56x71cm", "22x30": "56x76cm", "22x32": "56x81cm", "22x34": "56x86cm", "22x36": "56x91cm", "22x38": "56x97cm", "22x40": "56x102cm", "22x42": "56x107cm", "22x44": "56x112cm", "22x46": "56x117cm", "22x48": "56x122cm", "22x50": "56x127cm", "22x51": "56x130cm", "22x54": "56x137cm", "22x55": "56x140cm", "22x56": "56x142cm", "22x60": "56x152cm", "22x63": "56x160cm", "22x67": "56x170cm", "22x72": "56x183cm", "22x79": "56x201cm", "22x98": "56x249cm", "22x118": "56x300cm", "24x24": "61x61cm", "24x26": "61x66cm", "24x28": "61x71cm", "24x30": "61x76cm", "24x32": "61x81cm", "24x34": "61x86cm", "24x36": "61x91cm", "24x38": "61x97cm", "24x40": "61x102cm", "24x42": "61x107cm", "24x44": "61x112cm", "24x46": "61x117cm", "24x48": "61x122cm", "24x50": "61x127cm", "24x51": "61x130cm", "24x54": "61x137cm", "24x55": "61x140cm", "24x56": "61x142cm", "24x60": "61x152cm", "24x63": "61x160cm", "24x67": "61x170cm", "24x72": "61x183cm", "24x79": "61x201cm", "24x98": "61x249cm", "24x118": "61x300cm", "26x26": "66x66cm", "26x28": "66x71cm", "26x30": "66x76cm", "26x32": "66x81cm", "26x34": "66x86cm", "26x36": "66x91cm", "26x38": "66x97cm", "26x40": "66x102cm", "26x42": "66x107cm", "26x44": "66x112cm", "26x46": "66x117cm", "26x48": "66x122cm", "26x50": "66x127cm", "26x51": "66x130cm", "26x54": "66x137cm", "26x55": "66x140cm", "26x56": "66x142cm", "26x60": "66x152cm", "26x63": "66x160cm", "26x67": "66x170cm", "26x72": "66x183cm", "26x79": "66x201cm", "26x98": "66x249cm", "26x118": "66x300cm", "28x28": "71x71cm", "28x30": "71x76cm", "28x32": "71x81cm", "28x34": "71x86cm", "28x36": "71x91cm", "28x38": "71x97cm", "28x40": "71x102cm", "28x42": "71x107cm", "28x44": "71x112cm", "28x46": "71x117cm", "28x48": "71x122cm", "28x50": "71x127cm", "28x51": "71x130cm", "28x54": "71x137cm", "28x55": "71x140cm", "28x56": "71x142cm", "28x60": "71x152cm", "28x63": "71x160cm", "28x67": "71x170cm", "28x72": "71x183cm", "28x79": "71x201cm", "28x98": "71x249cm", "28x118": "71x300cm", "30x30": "76x76cm", "30x32": "76x81cm", "30x34": "76x86cm", "30x36": "76x91cm", "30x38": "76x97cm", "30x40": "76x102cm", "30x42": "76x107cm", "30x44": "76x112cm", "30x46": "76x117cm", "30x48": "76x122cm", "30x50": "76x127cm", "30x51": "76x130cm", "30x54": "76x137cm", "30x55": "76x140cm", "30x56": "76x142cm", "30x60": "76x152cm", "30x63": "76x160cm", "30x67": "76x170cm", "30x72": "76x183cm", "30x79": "76x201cm", "30x98": "76x249cm", "30x118": "76x300cm", "32x32": "81x81cm", "32x34": "81x86cm", "32x36": "81x91cm", "32x38": "81x97cm", "32x40": "81x102cm", "32x42": "81x107cm", "32x44": "81x112cm", "32x46": "81x117cm", "32x48": "81x122cm", "32x50": "81x127cm", "32x51": "81x130cm", "32x54": "81x137cm", "32x55": "81x140cm", "32x56": "81x142cm", "32x60": "81x152cm", "32x63": "81x160cm", "32x67": "81x170cm", "32x72": "81x183cm", "32x79": "81x201cm", "32x98": "81x249cm", "32x118": "81x300cm", "34x34": "86x86cm", "34x36": "86x91cm", "34x38": "86x97cm", "34x40": "86x102cm", "34x42": "86x107cm", "34x44": "86x112cm", "34x46": "86x117cm", "34x48": "86x122cm", "34x50": "86x127cm", "34x51": "86x130cm", "34x54": "86x137cm", "34x55": "86x140cm", "34x56": "86x142cm", "34x60": "86x152cm", "34x63": "86x160cm", "34x67": "86x170cm", "34x72": "86x183cm", "34x79": "86x201cm", "34x98": "86x249cm", "34x118": "86x300cm", "36x36": "91x91cm", "36x38": "91x97cm", "36x40": "91x102cm", "36x42": "91x107cm", "36x44": "91x112cm", "36x46": "91x117cm", "36x48": "91x122cm", "36x50": "91x127cm", "36x51": "91x130cm", "36x54": "91x137cm", "36x55": "91x140cm", "36x56": "91x142cm", "36x60": "91x152cm", "36x63": "91x160cm", "36x67": "91x170cm", "36x72": "91x183cm", "36x79": "91x201cm", "36x98": "91x249cm", "36x118": "91x300cm", "38x38": "97x97cm", "38x40": "97x102cm", "38x42": "97x107cm", "38x44": "97x112cm", "38x46": "97x117cm", "38x48": "97x122cm", "38x50": "97x127cm", "38x51": "97x130cm", "38x54": "97x137cm", "38x55": "97x140cm", "38x56": "97x142cm", "38x60": "97x152cm", "38x63": "97x160cm", "38x67": "97x170cm", "38x72": "97x183cm", "38x79": "97x201cm", "38x98": "97x249cm", "38x118": "97x300cm", "40x40": "102x102cm", "40x42": "102x107cm", "40x44": "102x112cm", "40x46": "102x117cm", "40x48": "102x122cm", "40x50": "102x127cm", "40x51": "102x130cm", "40x54": "102x137cm", "40x55": "102x140cm", "40x56": "102x142cm", "40x60": "102x152cm", "40x63": "102x160cm", "40x67": "102x170cm", "40x72": "102x183cm", "40x79": "102x201cm", "40x98": "102x249cm", "40x118": "102x300cm", "42x42": "107x107cm", "42x44": "107x112cm", "42x46": "107x117cm", "42x48": "107x122cm", "42x50": "107x127cm", "42x51": "107x130cm", "42x54": "107x137cm", "42x55": "107x140cm", "42x56": "107x142cm", "42x60": "107x152cm", "42x63": "107x160cm", "42x67": "107x170cm", "42x72": "107x183cm", "42x79": "107x201cm", "42x98": "107x249cm", "42x118": "107x300cm", "44x44": "112x112cm", "44x46": "112x117cm", "44x48": "112x122cm", "44x50": "112x127cm", "44x51": "112x130cm", "44x54": "112x137cm", "44x55": "112x140cm", "44x56": "112x142cm", "44x60": "112x152cm", "44x63": "112x160cm", "44x67": "112x170cm", "44x72": "112x183cm", "44x79": "112x201cm", "44x98": "112x249cm", "44x118": "112x300cm", "46x46": "117x117cm", "46x48": "117x122cm", "46x50": "117x127cm", "46x51": "117x130cm", "46x54": "117x137cm", "46x55": "117x140cm", "46x56": "117x142cm", "46x60": "117x152cm", "46x63": "117x160cm", "46x67": "117x170cm", "46x72": "117x183cm", "46x79": "117x201cm", "46x98": "117x249cm", "46x118": "117x300cm", "48x48": "122x122cm", "48x50": "122x127cm", "48x51": "122x130cm", "48x54": "122x137cm", "48x55": "122x140cm", "48x56": "122x142cm", "48x60": "122x152cm", "48x63": "122x160cm", "48x67": "122x170cm", "48x72": "122x183cm", "48x79": "122x201cm", "48x98": "122x249cm", "48x118": "122x300cm", "50x50": "127x127cm", "50x51": "127x130cm", "50x54": "127x137cm", "50x55": "127x140cm", "50x56": "127x142cm", "50x60": "127x152cm", "50x63": "127x160cm", "50x67": "127x170cm", "50x72": "127x183cm", "50x79": "127x201cm", "50x98": "127x249cm", "50x118": "127x300cm", "51x51": "130x130cm", "51x54": "130x137cm", "51x55": "130x140cm", "51x56": "130x142cm", "51x60": "130x152cm", "51x63": "130x160cm", "51x67": "130x170cm", "51x72": "130x183cm", "51x79": "130x201cm", "51x98": "130x249cm", "51x118": "130x300cm", "54x54": "137x137cm", "54x55": "137x140cm", "54x56": "137x142cm", "54x60": "137x152cm", "54x63": "137x160cm", "54x67": "137x170cm", "54x72": "137x183cm", "54x79": "137x201cm", "54x98": "137x249cm", "54x118": "137x300cm", "55x55": "140x140cm", "55x56": "140x142cm", "55x60": "140x152cm", "55x63": "140x160cm", "55x67": "140x170cm", "55x72": "140x183cm", "55x79": "140x201cm", "55x98": "140x249cm", "55x118": "140x300cm", "56x56": "142x142cm", "56x60": "142x152cm", "56x63": "142x160cm", "56x67": "142x170cm", "56x72": "142x183cm", "56x79": "142x201cm", "56x98": "142x249cm", "56x118": "142x300cm", "60x60": "152x152cm", "60x63": "152x160cm", "60x67": "152x170cm", "60x72": "152x183cm", "60x79": "152x201cm", "60x98": "152x249cm", "60x118": "152x300cm", "72x63": "183x160cm", "72x67": "183x170cm", "72x72": "183x183cm", "72x79": "183x201cm", "72x98": "183x249cm", "72x118": "183x300cm"};

const PWINTY_ITEMS = {
    "FRA": {
        "sharedAttributes": {
        },
        "BOX": {
            "mountType": {MOUNT1: "1.4mm", MOUNT2: "2.0mm", NM: "NO MOUNT"},
            "glaze": {ACRY: "Acrylic / Perspex", GLA: "Float Glass", TRU: "Tru View Museum Glass"},
            "frameColour": {Black: "Black", Brown: "Brown", White: "White", Natural: "Natural"},
            "mountColour": {"Snow White": "Snow White", "Off-White": "Off-White", Black: "Black"},
            "size": FRA_sizes,
            "substrateType": substrateType,
        },
        "CLA": {
            "mountType": {MOUNT1: "1.4mm", MOUNT2: "2.0mm", NM: "NO MOUNT"},
            "glaze": {ACRY: "Acrylic / Perspex", GLA: "Float Glass", TRU: "Tru View Museum Glass"},
            "frameColour": {Black: "Black", Brown: "Brown", White: "White", Natural: "Natural", Silver: "Silver", Gold: "Gold"},
            "mountColour": {"Snow White": "Snow White", "Off-White": "Off-White", Black: "Black"},
            "size": FRA_sizes,
            "substrateType": substrateTypeCLA,
        }, 
        "GLO": {
            "mountType": {MOUNT1: "1.4mm", MOUNT2: "2.0mm", NM: "NO MOUNT"},
            "glaze": {ACRY: "Acrylic / Perspex"},
            "frameColour": {Black: "Black", White: "White"},
            "mountColour": {"Snow White": "Snow White", "Off-White": "Off-White", Black: "Black"},
            "size": FRA_sizes,
            "substrateType": substrateType,
        }, 
        "SPACE": {
            "glaze": {ACRY: "Acrylic / Perspex", GLA: "Float Glass", TRU: "Tru View Museum Glass"},
            "frameColour": {Black: "Black", White: "White"},
            "size": FRA_sizes,
            "substrateType": substrateType,
        }, 
        "SUR1": {
            "frameColour": {Black: "Black", White: "White"},
            "size": FRA_SUR_sizes,
            "substrateType": substrateType,
        }, 
        "SUR2": {
            "frameColour": {Black: "Black", White: "White"},
            "size": FRA_SUR_sizes,
            "substrateType": substrateType,
        }, 
        "SWO": {
            "mountType": {MOUNT1: "1.4mm", MOUNT2: "2.0mm", NM: "NO MOUNT"},
            "glaze": {ACRY: "Acrylic / Perspex"},
            "frameColour": {Black: "Black", White: "White"},
            "mountColour": {"Snow White": "Snow White", "Off-White": "Off-White", Black: "Black"},
            "size": FRA_sizes,
            "substrateType": substrateType,
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

    /*ok so the attributes for framed prints and framed canvases would be framecolour (valid options for global frames are black, white and natural) and for stretched canvases there would be wrap (valid option are image, mirror, black and white)*/
    "CAN": { //sizing: ResizeToProductImageSize
        "sharedAttributes": {},
        "FRA": { //frameColour only exist in black apparently // Global frames come in mounted/matted or non-mounted/non-matted options
            "size": CAN_sizes,
            "wrap":  {"Black": "Black", "White": "White", "ImageWrap": "Image Wrap", "MirrorWrap": "Mirror Wrap"}, //not sure this belong here
        },
        /*"ROL": { //glaze only for -VAR
            "size": CAN_ROL_sizes,
            "glaze": {"NONE": "No Varnish", "Gloss Varnish": "Gloss Varnish", "Matt Varnish": "Matt Varnish"},
            "substrateType": CAN_substrate
        },*/
        "STR": { //edge always 38mm, size in SKU, substrate globalized to SC
            "size": CAN_sizes,
            "wrap":  {"Black": "Black", "White": "White", "ImageWrap": "Image Wrap", "MirrorWrap": "Mirror Wrap"},
        }
    },
};

let A_FORMAT = [{code:"A4", size:"21x29.7"}, {code:"A3", size:"29.7x42"}, {code:"A2", size:"42x59.4"}, {code:"A1", size:"59.4x84.1"}, {code: "A0", size:"84.1x118.9"}];//CONST?

let DIMENSIONS_FRAMES = [{megapixel: 300000, max: 20.3}, {megapixel: 500000, max: 30.5}, {megapixel: 1800000, max: 40.65}, {megapixel: 2900000, max: 50.8},
    {megapixel: 4800000, max: 61}, {megapixel: 6700000, max: 76.2}, {megapixel: 7400000, max: 101.6}];

let DIMENSIONS_CANVAS = [{megapixel: 300000, max: 30.5}, {megapixel: 500000, max: 40.65}, {megapixel: 1800000, max: 50.8}, {megapixel: 2900000, max: 61},
    {megapixel: 4800000, max: 76.2}, {megapixel: 6700000, max: 101.6}, {megapixel: 7400000, max: 155.4}];