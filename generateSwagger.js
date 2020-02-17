let db = require('./api/helpers/database.js');
let fs = require('fs');
yaml = require('js-yaml');
let validation = require('./api/helpers/validation.js');

//needed for vscode debugger breakpoints to work
let agddController = require('./api/controllers/agdd')
let boundariesController = require('./api/controllers/boundaries');
let climateController = require('./api/controllers/climate');
let legendsController = require('./api/controllers/legends');

let agddLayers = [
    "gdd:agdd",
    "gdd:agdd_50f",
    "gdd:agdd_alaska",
    "gdd:agdd_alaska_50f"
];

let agddAnomalyLayers = [
    "gdd:agdd_anomaly",
    "gdd:agdd_anomaly_50f"
];

let bases = [
    32,
    50
];

let sixLayers = [
    "si-x:arnoldred_bloom_ncep_historic",
    "si-x:arnoldred_bloom_ncep",
    "si-x:arnoldred_bloom_prism",
    "si-x:arnoldred_leaf_ncep_historic",
    "si-x:arnoldred_leaf_ncep",
    "si-x:arnoldred_leaf_prism",
    "si-x:average_bloom_best",
    "si-x:average_bloom_ncep_historic",
    "si-x:average_bloom_ncep",
    "si-x:average_bloom_prism",
    "si-x:average_leaf_best",
    "si-x:average_leaf_ncep_historic",
    "si-x:average_leaf_ncep",
    "si-x:average_leaf_prism",
    "si-x:lilac_bloom_ncep_historic",
    "si-x:lilac_bloom_ncep",
    "si-x:lilac_bloom_prism",
    "si-x:lilac_leaf_ncep_historic",
    "si-x:lilac_leaf_ncep",
    "si-x:lilac_leaf_prism",
    "si-x:zabelli_bloom_ncep_historic",
    "si-x:zabelli_bloom_ncep",
    "si-x:zabelli_bloom_prism",
    "si-x:zabelli_leaf_ncep_historic",
    "si-x:zabelli_leaf_ncep",
    "si-x:zabelli_leaf_prism"
];

let sixAnomalyLayers = [
    "si-x:leaf_anomaly",
    "si-x:bloom_anomaly"
];

let climateProviders = [
    "BEST",
    "PRISM",
    "NCEP"
];

let plants = [
    'lilac',
    'arnoldred',
    'zabelli',
    'average'
];

let phenophases = [
    "leaf",
    "bloom"
];

let states = [
    "Alabama",
    "Alaska",
    "American Samoa",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Commonwealth of the Northern Mariana Islands",
    "Connecticut",
    "Delaware",
    "District of Columbia",
    "Florida",
    "Georgia",
    "Guam",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Puerto Rico",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "United States Virgin Islands",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming"
];

let fwsBoundaries = [
    "AGASSIZ NATIONAL WILDLIFE REFUGE",
    "ALAMOSA NATIONAL WILDLIFE REFUGE",
    "ALASKA MARITIME NATIONAL WILDLIFE REFUGE",
    "ALASKA PENINSULA NATIONAL WILDLIFE REFUGE",
    "ALLIGATOR RIVER NATIONAL WILDLIFE REFUGE",
    "AMAGANSETT NATIONAL WILDLIFE REFUGE",
    "ANAHO ISLAND NATIONAL WILDLIFE REFUGE",
    "ANAHUAC NATIONAL WILDLIFE REFUGE",
    "ANKENY NATIONAL WILDLIFE REFUGE",
    "ANTIOCH DUNES NATIONAL WILDLIFE REFUGE",
    "ARANSAS NATIONAL WILDLIFE REFUGE",
    "ARAPAHO NATIONAL WILDLIFE REFUGE",
    "ARCHIE CARR NATIONAL WILDLIFE REFUGE",
    "ARCTIC NATIONAL WILDLIFE REFUGE",
    "ARDOCH NATIONAL WILDLIFE REFUGE",
    "AROOSTOOK NATIONAL WILDLIFE REFUGE",
    "ARROWWOOD NATIONAL WILDLIFE REFUGE",
    "ARTHUR R. MARSHALL LOXAHATCHEE NATIONAL WILDLIFE REFUGE",
    "ASH MEADOWS NATIONAL WILDLIFE REFUGE",
    "ASSABET RIVER NATIONAL WILDLIFE REFUGE",
    "ATCHAFALAYA NATIONAL WILDLIFE REFUGE",
    "ATTWATER PRAIRIE CHICKEN NATIONAL WILDLIFE REFUGE",
    "AUDUBON NATIONAL WILDLIFE REFUGE",
    "BACA NATIONAL WILDLIFE REFUGE",
    "BACK BAY NATIONAL WILDLIFE REFUGE",
    "BAKER ISLAND NATIONAL WILDLIFE REFUGE",
    "BALCONES CANYONLANDS NATIONAL WILDLIFE REFUGE",
    "BALD KNOB NATIONAL WILDLIFE REFUGE",
    "BAMFORTH NATIONAL WILDLIFE REFUGE",
    "BANDON MARSH NATIONAL WILDLIFE REFUGE",
    "BANKS LAKE NATIONAL WILDLIFE REFUGE",
    "BASKETT SLOUGH NATIONAL WILDLIFE REFUGE",
    "BAYOU COCODRIE NATIONAL WILDLIFE REFUGE",
    "BAYOU SAUVAGE NATIONAL WILDLIFE REFUGE",
    "BAYOU TECHE NATIONAL WILDLIFE REFUGE",
    "BEAR BUTTE NATIONAL WILDLIFE REFUGE",
    "BEAR LAKE NATIONAL WILDLIFE REFUGE",
    "BEAR RIVER MIGRATORY BIRD REFUGE",
    "BEAR VALLEY NATIONAL WILDLIFE REFUGE",
    "BECHAROF NATIONAL WILDLIFE REFUGE",
    "BENTON LAKE NATIONAL WILDLIFE REFUGE",
    "BIG BOGGY NATIONAL WILDLIFE REFUGE",
    "BIG BRANCH MARSH NATIONAL WILDLIFE REFUGE",
    "BIG LAKE NATIONAL WILDLIFE REFUGE",
    "BIG MUDDY NATIONAL FISH AND WILDLIFE REFUGE",
    "BIG OAKS NATIONAL WILDLIFE REFUGE",
    "BIG STONE NATIONAL WILDLIFE REFUGE",
    "BILL WILLIAMS RIVER NATIONAL WILDLIFE REFUGE",
    "BILLY FRANK JR. NISQUALLY NATIONAL WILDLIFE REFUGE",
    "BITTER CREEK NATIONAL WILDLIFE REFUGE",
    "BITTER LAKE NATIONAL WILDLIFE REFUGE",
    "BLACK BAYOU LAKE NATIONAL WILDLIFE REFUGE",
    "BLACKBEARD ISLAND NATIONAL WILDLIFE REFUGE",
    "BLACK COULEE NATIONAL WILDLIFE REFUGE",
    "BLACKWATER NATIONAL WILDLIFE REFUGE",
    "BLOCK ISLAND NATIONAL WILDLIFE REFUGE",
    "BLUE RIDGE NATIONAL WILDLIFE REFUGE",
    "BOGUE CHITTO NATIONAL WILDLIFE REFUGE",
    "BOMBAY HOOK NATIONAL WILDLIFE REFUGE",
    "BOND SWAMP NATIONAL WILDLIFE REFUGE",
    "BON SECOUR NATIONAL WILDLIFE REFUGE",
    "BOSQUE DEL APACHE NATIONAL WILDLIFE REFUGE",
    "BOWDOIN NATIONAL WILDLIFE REFUGE",
    "BOYER CHUTE NATIONAL WILDLIFE REFUGE",
    "BRAZORIA NATIONAL WILDLIFE REFUGE",
    "BRETON NATIONAL WILDLIFE REFUGE",
    "BROWNS PARK NATIONAL WILDLIFE REFUGE",
    "BUCK ISLAND NATIONAL WILDLIFE REFUGE",
    "BUENOS AIRES NATIONAL WILDLIFE REFUGE",
    "BUFFALO LAKE NATIONAL WILDLIFE REFUGE (ND)",
    "BUFFALO LAKE NATIONAL WILDLIFE REFUGE (TX)",
    "CABEZA PRIETA NATIONAL WILDLIFE REFUGE",
    "CABO ROJO NATIONAL WILDLIFE REFUGE",
    "CACHE RIVER NATIONAL WILDLIFE REFUGE",
    "CADDO LAKE NATIONAL WILDLIFE REFUGE",
    "CAHABA RIVER NATIONAL WILDLIFE REFUGE",
    "CALOOSAHATCHEE NATIONAL WILDLIFE REFUGE",
    "CAMAS NATIONAL WILDLIFE REFUGE",
    "CAMERON PRAIRIE NATIONAL WILDLIFE REFUGE",
    "CANAAN VALLEY NATIONAL WILDLIFE REFUGE",
    "CANFIELD LAKE NATIONAL WILDLIFE REFUGE",
    "CAPE MAY NATIONAL WILDLIFE REFUGE",
    "CAPE MEARES NATIONAL WILDLIFE REFUGE",
    "CAPE ROMAIN NATIONAL WILDLIFE REFUGE",
    "CAROLINA SANDHILLS NATIONAL WILDLIFE REFUGE",
    "CASTLE ROCK NATIONAL WILDLIFE REFUGE",
    "CATAHOULA NATIONAL WILDLIFE REFUGE",
    "CAT ISLAND NATIONAL WILDLIFE REFUGE",
    "CEDAR ISLAND NATIONAL WILDLIFE REFUGE",
    "CEDAR KEYS NATIONAL WILDLIFE REFUGE",
    "CEDAR POINT NATIONAL WILDLIFE REFUGE",
    "CHARLES M. RUSSELL NATIONAL WILDLIFE REFUGE",
    "CHASE LAKE NATIONAL WILDLIFE REFUGE",
    "CHASSAHOWITZKA NATIONAL WILDLIFE REFUGE",
    "CHAUTAUQUA NATIONAL WILDLIFE REFUGE",
    "CHERRY VALLEY NATIONAL WILDLIFE REFUGE",
    "CHICKASAW NATIONAL WILDLIFE REFUGE",
    "CHINCOTEAGUE NATIONAL WILDLIFE REFUGE",
    "CHOCTAW NATIONAL WILDLIFE REFUGE",
    "CIBOLA NATIONAL WILDLIFE REFUGE",
    "CLARENCE CANNON NATIONAL WILDLIFE REFUGE",
    "CLARKS RIVER NATIONAL WILDLIFE REFUGE",
    "CLEAR LAKE NATIONAL WILDLIFE REFUGE",
    "COACHELLA VALLEY NATIONAL WILDLIFE REFUGE",
    "COKEVILLE MEADOWS NATIONAL WILDLIFE REFUGE",
    "COLD SPRINGS NATIONAL WILDLIFE REFUGE",
    "COLDWATER RIVER NATIONAL WILDLIFE REFUGE",
    "COLUMBIA NATIONAL WILDLIFE REFUGE",
    "COLUSA NATIONAL WILDLIFE REFUGE",
    "CONBOY LAKE NATIONAL WILDLIFE REFUGE",
    "CONSCIENCE POINT NATIONAL WILDLIFE REFUGE",
    "COPALIS NATIONAL WILDLIFE REFUGE",
    "CRAB ORCHARD NATIONAL WILDLIFE REFUGE",
    "CRANE MEADOWS NATIONAL WILDLIFE REFUGE",
    "CREEDMAN COULEE NATIONAL WILDLIFE REFUGE",
    "CRESCENT LAKE NATIONAL WILDLIFE REFUGE",
    "CROCODILE LAKE NATIONAL WILDLIFE REFUGE",
    "CROSS CREEKS NATIONAL WILDLIFE REFUGE",
    "CROSS ISLAND NATIONAL WILDLIFE REFUGE",
    "CRYSTAL RIVER NATIONAL WILDLIFE REFUGE",
    "CULEBRA NATIONAL WILDLIFE REFUGE",
    "CURRITUCK NATIONAL WILDLIFE REFUGE",
    "CYPRESS CREEK NATIONAL WILDLIFE REFUGE",
    "DAHOMEY NATIONAL WILDLIFE REFUGE",
    "DALE BUMPERS WHITE RIVER NATIONAL WILDLIFE REFUGE",
    "D ARBONNE NATIONAL WILDLIFE REFUGE",
    "DEEP FORK NATIONAL WILDLIFE REFUGE",
    "DEER FLAT NATIONAL WILDLIFE REFUGE",
    "DELEVAN NATIONAL WILDLIFE REFUGE",
    "DELTA NATIONAL WILDLIFE REFUGE",
    "DESECHEO NATIONAL WILDLIFE REFUGE",
    "DESERT NATIONAL WILDLIFE RANGE",
    "DES LACS NATIONAL WILDLIFE REFUGE",
    "DESOTO NATIONAL WILDLIFE REFUGE",
    "DETROIT RIVER INTERNATIONAL WILDLIFE REFUGE",
    "DON EDWARDS SAN FRANCISCO BAY NATIONAL WILDLIFE REFUGE",
    "DRIFTLESS AREA NATIONAL WILDLIFE REFUGE",
    "DUNGENESS NATIONAL WILDLIFE REFUGE",
    "EASTERN NECK NATIONAL WILDLIFE REFUGE",
    "EASTERN SHORE OF VIRGINIA NATIONAL WILDLIFE REFUGE",
    "EDWIN B. FORSYTHE NATIONAL WILDLIFE REFUGE",
    "EGMONT KEY NATIONAL WILDLIFE REFUGE",
    "ELIZABETH ALEXANDRA MORTON NATIONAL WILDLIFE REFUGE",
    "ELLICOTT SLOUGH NATIONAL WILDLIFE REFUGE",
    "EMIQUON NATIONAL WILDLIFE REFUGE",
    "ERIE NATIONAL WILDLIFE REFUGE",
    "ERNEST F. HOLLINGS ACE BASIN NATIONAL WILDLIFE REFUGE",
    "EUFAULA NATIONAL WILDLIFE REFUGE",
    "EVERGLADES HEADWATERS NATIONAL WILDLIFE REFUGE AND CONSERVATION AREA",
    "FALLON NATIONAL WILDLIFE REFUGE",
    "FARALLON NATIONAL WILDLIFE REFUGE",
    "FEATHERSTONE NATIONAL WILDLIFE REFUGE",
    "FELSENTHAL NATIONAL WILDLIFE REFUGE",
    "FERN CAVE NATIONAL WILDLIFE REFUGE",
    "FISHERMAN ISLAND NATIONAL WILDLIFE REFUGE",
    "FISH SPRINGS NATIONAL WILDLIFE REFUGE",
    "FLATTERY ROCKS NATIONAL WILDLIFE REFUGE",
    "FLINT HILLS NATIONAL WILDLIFE REFUGE",
    "FLORENCE LAKE NATIONAL WILDLIFE REFUGE",
    "FLORIDA PANTHER NATIONAL WILDLIFE REFUGE",
    "FORT NIOBRARA NATIONAL WILDLIFE REFUGE",
    "FOX RIVER NATIONAL WILDLIFE REFUGE",
    "FRANKLIN ISLAND NATIONAL WILDLIFE REFUGE",
    "FRANZ LAKE NATIONAL WILDLIFE REFUGE",
    "GLACIAL RIDGE NATIONAL WILDLIFE REFUGE",
    "GRAND BAY NATIONAL WILDLIFE REFUGE",
    "GRAND COTE NATIONAL WILDLIFE REFUGE",
    "GRAVEL ISLAND NATIONAL WILDLIFE REFUGE",
    "GRAYS HARBOR NATIONAL WILDLIFE REFUGE",
    "GRAYS LAKE NATIONAL WILDLIFE REFUGE",
    "GREAT BAY NATIONAL WILDLIFE REFUGE",
    "GREAT DISMAL SWAMP NATIONAL WILDLIFE REFUGE",
    "GREAT MEADOWS NATIONAL WILDLIFE REFUGE",
    "GREAT RIVER NATIONAL WILDLIFE REFUGE",
    "GREAT SWAMP NATIONAL WILDLIFE REFUGE",
    "GREAT WHITE HERON NATIONAL WILDLIFE REFUGE",
    "GREEN BAY NATIONAL WILDLIFE REFUGE",
    "GREEN CAY NATIONAL WILDLIFE REFUGE",
    "GRULLA NATIONAL WILDLIFE REFUGE",
    "GUADALUPE-NIPOMO DUNES NATIONAL WILDLIFE REFUGE",
    "GUAM NATIONAL WILDLIFE REFUGE",
    "HACKMATACK NATIONAL WILDLIFE REFUGE",
    "HAGERMAN NATIONAL WILDLIFE REFUGE",
    "HAILSTONE NATIONAL WILDLIFE REFUGE",
    "HAKALAU FOREST NATIONAL WILDLIFE REFUGE",
    "HALFBREED LAKE NATIONAL WILDLIFE REFUGE",
    "HAMDEN SLOUGH NATIONAL WILDLIFE REFUGE",
    "HANALEI NATIONAL WILDLIFE REFUGE",
    "HANDY BRAKE NATIONAL WILDLIFE REFUGE",
    "HARBOR ISLAND NATIONAL WILDLIFE REFUGE",
    "HARRIS NECK NATIONAL WILDLIFE REFUGE",
    "HART MOUNTAIN NATIONAL ANTELOPE REFUGE",
    "HATCHIE NATIONAL WILDLIFE REFUGE",
    "HAVASU NATIONAL WILDLIFE REFUGE",
    "HAWAIIAN ISLANDS NATIONAL WILDLIFE REFUGE",
    "HEWITT LAKE NATIONAL WILDLIFE REFUGE",
    "HILLSIDE NATIONAL WILDLIFE REFUGE",
    "HOBART LAKE NATIONAL WILDLIFE REFUGE",
    "HOBE SOUND NATIONAL WILDLIFE REFUGE",
    "HOLLA BEND NATIONAL WILDLIFE REFUGE",
    "HOLT COLLIER NATIONAL WILDLIFE REFUGE",
    "HOPPER MOUNTAIN NATIONAL WILDLIFE REFUGE",
    "HORICON NATIONAL WILDLIFE REFUGE",
    "HOWLAND ISLAND NATIONAL WILDLIFE REFUGE",
    "HULEIA NATIONAL WILDLIFE REFUGE",
    "HUMBOLDT BAY NATIONAL WILDLIFE REFUGE",
    "HURON NATIONAL WILDLIFE REFUGE",
    "HUTTON LAKE NATIONAL WILDLIFE REFUGE",
    "IMPERIAL NATIONAL WILDLIFE REFUGE",
    "INNOKO NATIONAL WILDLIFE REFUGE",
    "IROQUOIS NATIONAL WILDLIFE REFUGE",
    "ISLAND BAY NATIONAL WILDLIFE REFUGE",
    "IZEMBEK NATIONAL WILDLIFE REFUGE",
    "JAMES CAMPBELL NATIONAL WILDLIFE REFUGE",
    "JAMES RIVER NATIONAL WILDLIFE REFUGE",
    "JARVIS ISLAND NATIONAL WILDLIFE REFUGE",
    "J. CLARK SALYER NATIONAL WILDLIFE REFUGE",
    "J. N. DING DARLING NATIONAL WILDLIFE REFUGE",
    "JOHN HAY NATIONAL WILDLIFE REFUGE",
    "JOHN H. CHAFEE NATIONAL WILDLIFE REFUGE",
    "JOHN HEINZ NATIONAL WILDLIFE REFUGE AT TINICUM",
    "JOHNSON LAKE NATIONAL WILDLIFE REFUGE",
    "JOHNSTON ATOLL NATIONAL WILDLIFE REFUGE",
    "JOHN W. AND LOUISE SEIER NATIONAL WILDLIFE REFUGE",
    "JULIA BUTLER HANSEN REFUGE FOR THE COLUMBIAN WHITE-TAILED DEER",
    "KAKAHAIA NATIONAL WILDLIFE REFUGE",
    "KANKAKEE NATIONAL WILDLIFE REFUGE AND CONSERVATION AREA",
    "KANUTI NATIONAL WILDLIFE REFUGE",
    "KARL E. MUNDT NATIONAL WILDLIFE REFUGE",
    "KEALIA POND NATIONAL WILDLIFE REFUGE",
    "KELLYS SLOUGH NATIONAL WILDLIFE REFUGE",
    "KENAI NATIONAL WILDLIFE REFUGE",
    "KERN NATIONAL WILDLIFE REFUGE",
    "KEY CAVE NATIONAL WILDLIFE REFUGE",
    "KEY WEST NATIONAL WILDLIFE REFUGE",
    "KILAUEA POINT NATIONAL WILDLIFE REFUGE",
    "KINGMAN REEF NATIONAL WILDLIFE REFUGE",
    "KIRWIN NATIONAL WILDLIFE REFUGE",
    "KLAMATH MARSH NATIONAL WILDLIFE REFUGE",
    "KODIAK NATIONAL WILDLIFE REFUGE",
    "KOFA NATIONAL WILDLIFE REFUGE",
    "KOOTENAI NATIONAL WILDLIFE REFUGE",
    "KOYUKUK NATIONAL WILDLIFE REFUGE",
    "LACASSINE NATIONAL WILDLIFE REFUGE",
    "LACREEK NATIONAL WILDLIFE REFUGE",
    "LAGUNA ATASCOSA NATIONAL WILDLIFE REFUGE",
    "LAGUNA CARTAGENA NATIONAL WILDLIFE REFUGE",
    "LAKE ALICE NATIONAL WILDLIFE REFUGE",
    "LAKE ANDES NATIONAL WILDLIFE REFUGE",
    "LAKE GEORGE NATIONAL WILDLIFE REFUGE",
    "LAKE ILO NATIONAL WILDLIFE REFUGE",
    "LAKE ISOM NATIONAL WILDLIFE REFUGE",
    "LAKE MASON NATIONAL WILDLIFE REFUGE",
    "LAKE NETTIE NATIONAL WILDLIFE REFUGE",
    "LAKE OPHELIA NATIONAL WILDLIFE REFUGE",
    "LAKE THIBADEAU NATIONAL WILDLIFE REFUGE",
    "LAKE WALES RIDGE NATIONAL WILDLIFE REFUGE",
    "LAKE WOODRUFF NATIONAL WILDLIFE REFUGE",
    "LAKE ZAHL NATIONAL WILDLIFE REFUGE",
    "LAS VEGAS NATIONAL WILDLIFE REFUGE",
    "LEE METCALF NATIONAL WILDLIFE REFUGE",
    "LESLIE CANYON NATIONAL WILDLIFE REFUGE",
    "LEWIS AND CLARK NATIONAL WILDLIFE REFUGE",
    "LITTLE GOOSE NATIONAL WILDLIFE REFUGE",
    "LITTLE PEND OREILLE NATIONAL WILDLIFE REFUGE",
    "LITTLE RIVER NATIONAL WILDLIFE REFUGE",
    "LITTLE SANDY NATIONAL WILDLIFE REFUGE",
    "LOGAN CAVE NATIONAL WILDLIFE REFUGE",
    "LONG LAKE NATIONAL WILDLIFE REFUGE",
    "LOST TRAIL NATIONAL WILDLIFE REFUGE",
    "LOSTWOOD NATIONAL WILDLIFE REFUGE",
    "LOWER HATCHIE NATIONAL WILDLIFE REFUGE",
    "LOWER KLAMATH NATIONAL WILDLIFE REFUGE",
    "LOWER RIO GRANDE VALLEY NATIONAL WILDLIFE REFUGE",
    "LOWER SUWANNEE NATIONAL WILDLIFE REFUGE",
    "MACKAY ISLAND NATIONAL WILDLIFE REFUGE",
    "MALHEUR NATIONAL WILDLIFE REFUGE",
    "MANDALAY NATIONAL WILDLIFE REFUGE",
    "MARAIS DES CYGNES NATIONAL WILDLIFE REFUGE",
    "MARIANA ARC OF FIRE NATIONAL WILDLIFE REFUGE",
    "MARIANA TRENCH NATIONAL WILDLIFE REFUGE",
    "MARIN ISLANDS NATIONAL WILDLIFE REFUGE",
    "MARTIN NATIONAL WILDLIFE REFUGE",
    "MASHPEE NATIONAL WILDLIFE REFUGE",
    "MASON NECK NATIONAL WILDLIFE REFUGE",
    "MASSASOIT NATIONAL WILDLIFE REFUGE",
    "MATHEWS BRAKE NATIONAL WILDLIFE REFUGE",
    "MATLACHA PASS NATIONAL WILDLIFE REFUGE",
    "MATTAMUSKEET NATIONAL WILDLIFE REFUGE",
    "MAXWELL NATIONAL WILDLIFE REFUGE",
    "MCFADDIN NATIONAL WILDLIFE REFUGE",
    "MCKAY CREEK NATIONAL WILDLIFE REFUGE",
    "MCLEAN NATIONAL WILDLIFE REFUGE",
    "MCNARY NATIONAL WILDLIFE REFUGE",
    "MEDICINE LAKE NATIONAL WILDLIFE REFUGE",
    "MERCED NATIONAL WILDLIFE REFUGE",
    "MEREDOSIA NATIONAL WILDLIFE REFUGE",
    "MERRITT ISLAND NATIONAL WILDLIFE REFUGE",
    "MICHIGAN ISLANDS NATIONAL WILDLIFE REFUGE",
    "MIDDLE MISSISSIPPI RIVER NATIONAL WILDLIFE REFUGE",
    "MIDWAY ATOLL NATIONAL WILDLIFE REFUGE",
    "MILLE LACS NATIONAL WILDLIFE REFUGE",
    "MINGO NATIONAL WILDLIFE REFUGE",
    "MINIDOKA NATIONAL WILDLIFE REFUGE",
    "MINNESOTA VALLEY NATIONAL WILDLIFE REFUGE",
    "MISSISQUOI NATIONAL WILDLIFE REFUGE",
    "MISSISSIPPI SANDHILL CRANE NATIONAL WILDLIFE REFUGE",
    "MOAPA VALLEY NATIONAL WILDLIFE REFUGE",
    "MODOC NATIONAL WILDLIFE REFUGE",
    "MONOMOY NATIONAL WILDLIFE REFUGE",
    "MONTE VISTA NATIONAL WILDLIFE REFUGE",
    "MONTEZUMA NATIONAL WILDLIFE REFUGE",
    "MOODY NATIONAL WILDLIFE REFUGE",
    "MOOSEHORN NATIONAL WILDLIFE REFUGE",
    "MORGAN BRAKE NATIONAL WILDLIFE REFUGE",
    "MORTENSON LAKE NATIONAL WILDLIFE REFUGE",
    "MOUNTAIN BOGS NATIONAL WILDLIFE REFUGE",
    "MOUNTAIN LONGLEAF NATIONAL WILDLIFE REFUGE",
    "MULESHOE NATIONAL WILDLIFE REFUGE",
    "MUSCATATUCK NATIONAL WILDLIFE REFUGE",
    "NANSEMOND NATIONAL WILDLIFE REFUGE",
    "NANTUCKET NATIONAL WILDLIFE REFUGE",
    "NATIONAL BISON RANGE",
    "NATIONAL ELK REFUGE",
    "NATIONAL KEY DEER REFUGE",
    "NAVASSA ISLAND NATIONAL WILDLIFE REFUGE",
    "NEAL SMITH NATIONAL WILDLIFE REFUGE",
    "NECEDAH NATIONAL WILDLIFE REFUGE",
    "NECHES RIVER NATIONAL WILDLIFE REFUGE",
    "NESTUCCA BAY NATIONAL WILDLIFE REFUGE",
    "NINIGRET NATIONAL WILDLIFE REFUGE",
    "NOMANS LAND ISLAND NATIONAL WILDLIFE REFUGE",
    "NORTHERN TALLGRASS PRAIRIE NATIONAL WILDLIFE REFUGE",
    "NORTH PLATTE NATIONAL WILDLIFE REFUGE",
    "NOWITNA NATIONAL WILDLIFE REFUGE",
    "OAHU FOREST NATIONAL WILDLIFE REFUGE",
    "OCCOQUAN BAY NATIONAL WILDLIFE REFUGE",
    "OHIO RIVER ISLANDS NATIONAL WILDLIFE REFUGE",
    "OKEFENOKEE NATIONAL WILDLIFE REFUGE",
    "OPTIMA NATIONAL WILDLIFE REFUGE",
    "OREGON ISLANDS NATIONAL WILDLIFE REFUGE",
    "OTTAWA NATIONAL WILDLIFE REFUGE",
    "OURAY NATIONAL WILDLIFE REFUGE",
    "OVERFLOW NATIONAL WILDLIFE REFUGE",
    "OXBOW NATIONAL WILDLIFE REFUGE",
    "OYSTER BAY NATIONAL WILDLIFE REFUGE",
    "OZARK CAVEFISH NATIONAL WILDLIFE REFUGE",
    "OZARK PLATEAU NATIONAL WILDLIFE REFUGE",
    "PAHRANAGAT NATIONAL WILDLIFE REFUGE",
    "PALMYRA ATOLL NATIONAL WILDLIFE REFUGE",
    "PANTHER SWAMP NATIONAL WILDLIFE REFUGE",
    "PARKER RIVER NATIONAL WILDLIFE REFUGE",
    "PASSAGE KEY NATIONAL WILDLIFE REFUGE",
    "PATHFINDER NATIONAL WILDLIFE REFUGE",
    "PATOKA RIVER NATIONAL WILDLIFE REFUGE",
    "PATUXENT RESEARCH REFUGE",
    "PEA ISLAND NATIONAL WILDLIFE REFUGE",
    "PEARL HARBOR NATIONAL WILDLIFE REFUGE",
    "PEE DEE NATIONAL WILDLIFE REFUGE",
    "PELICAN ISLAND NATIONAL WILDLIFE REFUGE",
    "PETIT MANAN NATIONAL WILDLIFE REFUGE",
    "PIEDMONT NATIONAL WILDLIFE REFUGE",
    "PIERCE NATIONAL WILDLIFE REFUGE",
    "PILOT KNOB NATIONAL WILDLIFE REFUGE",
    "PINCKNEY ISLAND NATIONAL WILDLIFE REFUGE",
    "PINE ISLAND NATIONAL WILDLIFE REFUGE",
    "PINELLAS NATIONAL WILDLIFE REFUGE",
    "PIXLEY NATIONAL WILDLIFE REFUGE",
    "PLUM TREE ISLAND NATIONAL WILDLIFE REFUGE",
    "POCOSIN LAKES NATIONAL WILDLIFE REFUGE",
    "POND CREEK NATIONAL WILDLIFE REFUGE",
    "POND ISLAND NATIONAL WILDLIFE REFUGE",
    "PORT LOUISA NATIONAL WILDLIFE REFUGE",
    "PRESQUILE NATIONAL WILDLIFE REFUGE",
    "PRIME HOOK NATIONAL WILDLIFE REFUGE",
    "PROTECTION ISLAND NATIONAL WILDLIFE REFUGE",
    "QUIVIRA NATIONAL WILDLIFE REFUGE",
    "RACHEL CARSON NATIONAL WILDLIFE REFUGE",
    "RAPPAHANNOCK RIVER VALLEY NATIONAL WILDLIFE REFUGE",
    "RED RIVER NATIONAL WILDLIFE REFUGE",
    "RED ROCK LAKES NATIONAL WILDLIFE REFUGE",
    "REELFOOT NATIONAL WILDLIFE REFUGE",
    "RICE LAKE NATIONAL WILDLIFE REFUGE",
    "RIDGEFIELD NATIONAL WILDLIFE REFUGE",
    "ROANOKE RIVER NATIONAL WILDLIFE REFUGE",
    "ROCK LAKE NATIONAL WILDLIFE REFUGE",
    "ROCKY FLATS NATIONAL WILDLIFE REFUGE",
    "ROCKY MOUNTAIN ARSENAL NATIONAL WILDLIFE REFUGE",
    "ROSE ATOLL NATIONAL WILDLIFE REFUGE",
    "RUBY LAKE NATIONAL WILDLIFE REFUGE",
    "RYDELL NATIONAL WILDLIFE REFUGE",
    "SABINE NATIONAL WILDLIFE REFUGE",
    "SACHUEST POINT NATIONAL WILDLIFE REFUGE",
    "SACRAMENTO NATIONAL WILDLIFE REFUGE",
    "SACRAMENTO RIVER NATIONAL WILDLIFE REFUGE",
    "SADDLE MOUNTAIN NATIONAL WILDLIFE REFUGE",
    "SALINAS RIVER NATIONAL WILDLIFE REFUGE",
    "SALT PLAINS NATIONAL WILDLIFE REFUGE",
    "SAM D. HAMILTON NOXUBEE NATIONAL WILDLIFE REFUGE",
    "SAN ANDRES NATIONAL WILDLIFE REFUGE",
    "SAN BERNARDINO NATIONAL WILDLIFE REFUGE",
    "SAN BERNARD NATIONAL WILDLIFE REFUGE",
    "SAN DIEGO BAY NATIONAL WILDLIFE REFUGE",
    "SAN DIEGO NATIONAL WILDLIFE REFUGE",
    "SAND LAKE NATIONAL WILDLIFE REFUGE",
    "SANDY POINT NATIONAL WILDLIFE REFUGE",
    "SAN JOAQUIN RIVER NATIONAL WILDLIFE REFUGE",
    "SAN JUAN ISLANDS NATIONAL WILDLIFE REFUGE",
    "SAN LUIS NATIONAL WILDLIFE REFUGE",
    "SAN PABLO BAY NATIONAL WILDLIFE REFUGE",
    "SANTA ANA NATIONAL WILDLIFE REFUGE",
    "SANTEE NATIONAL WILDLIFE REFUGE",
    "SAUTA CAVE NATIONAL WILDLIFE REFUGE",
    "SAVANNAH NATIONAL WILDLIFE REFUGE",
    "SEAL BEACH NATIONAL WILDLIFE REFUGE",
    "SEAL ISLAND NATIONAL WILDLIFE REFUGE",
    "SEATUCK NATIONAL WILDLIFE REFUGE",
    "SEEDSKADEE NATIONAL WILDLIFE REFUGE",
    "SELAWIK NATIONAL WILDLIFE REFUGE",
    "SENEY NATIONAL WILDLIFE REFUGE",
    "SEQUOYAH NATIONAL WILDLIFE REFUGE",
    "SEVILLETA NATIONAL WILDLIFE REFUGE",
    "SHAWANGUNK GRASSLANDS NATIONAL WILDLIFE REFUGE",
    "SHELDON NATIONAL WILDLIFE REFUGE",
    "SHELL KEYS NATIONAL WILDLIFE REFUGE",
    "SHELL LAKE NATIONAL WILDLIFE REFUGE",
    "SHERBURNE NATIONAL WILDLIFE REFUGE",
    "SHIAWASSEE NATIONAL WILDLIFE REFUGE",
    "SILETZ BAY NATIONAL WILDLIFE REFUGE",
    "SILVIO O. CONTE NATIONAL FISH AND WILDLIFE REFUGE",
    "SLADE NATIONAL WILDLIFE REFUGE",
    "SONNY BONO SALTON SEA NATIONAL WILDLIFE REFUGE",
    "SQUAW CREEK NATIONAL WILDLIFE REFUGE",
    "ST. CATHERINE CREEK NATIONAL WILDLIFE REFUGE",
    "STEIGERWALD LAKE NATIONAL WILDLIFE REFUGE",
    "STEWART B. MCKINNEY NATIONAL WILDLIFE REFUGE",
    "STEWART LAKE NATIONAL WILDLIFE REFUGE",
    "STILLWATER NATIONAL WILDLIFE REFUGE",
    "ST. JOHNS NATIONAL WILDLIFE REFUGE",
    "ST. MARKS NATIONAL WILDLIFE REFUGE",
    "STONE LAKES NATIONAL WILDLIFE REFUGE",
    "STORM LAKE NATIONAL WILDLIFE REFUGE",
    "STUMP LAKE NATIONAL WILDLIFE REFUGE",
    "ST. VINCENT NATIONAL WILDLIFE REFUGE",
    "SULLYS HILL NATIONAL GAME PRESERVE",
    "SUNBURST LAKE NATIONAL WILDLIFE REFUGE",
    "SUNKHAZE MEADOWS NATIONAL WILDLIFE REFUGE",
    "SUPAWNA MEADOWS NATIONAL WILDLIFE REFUGE",
    "SUSQUEHANNA NATIONAL WILDLIFE REFUGE",
    "SUTTER NATIONAL WILDLIFE REFUGE",
    "SWAN LAKE NATIONAL WILDLIFE REFUGE",
    "SWANQUARTER NATIONAL WILDLIFE REFUGE",
    "SWAN RIVER NATIONAL WILDLIFE REFUGE",
    "TALLAHATCHIE NATIONAL WILDLIFE REFUGE",
    "TAMARAC NATIONAL WILDLIFE REFUGE",
    "TARGET ROCK NATIONAL WILDLIFE REFUGE",
    "TENNESSEE NATIONAL WILDLIFE REFUGE",
    "TENSAS RIVER NATIONAL WILDLIFE REFUGE",
    "TEN THOUSAND ISLANDS NATIONAL WILDLIFE REFUGE",
    "TETLIN NATIONAL WILDLIFE REFUGE",
    "TEWAUKON NATIONAL WILDLIFE REFUGE",
    "TEXAS POINT NATIONAL WILDLIFE REFUGE",
    "THACHER ISLAND NATIONAL WILDLIFE REFUGE",
    "THEODORE ROOSEVELT NATIONAL WILDLIFE REFUGE",
    "TIJUANA SLOUGH NATIONAL WILDLIFE REFUGE",
    "TISHOMINGO NATIONAL WILDLIFE REFUGE",
    "TOGIAK NATIONAL WILDLIFE REFUGE",
    "TOPPENISH NATIONAL WILDLIFE REFUGE",
    "TREMPEALEAU NATIONAL WILDLIFE REFUGE",
    "TRINITY RIVER NATIONAL WILDLIFE REFUGE",
    "TRUSTOM POND NATIONAL WILDLIFE REFUGE",
    "TUALATIN RIVER NATIONAL WILDLIFE REFUGE",
    "TULE LAKE NATIONAL WILDLIFE REFUGE",
    "TURNBULL NATIONAL WILDLIFE REFUGE",
    "TWO PONDS NATIONAL WILDLIFE REFUGE",
    "TWO RIVERS NATIONAL WILDLIFE REFUGE",
    "TYBEE NATIONAL WILDLIFE REFUGE",
    "UL BEND NATIONAL WILDLIFE REFUGE",
    "UMATILLA NATIONAL WILDLIFE REFUGE",
    "UMBAGOG NATIONAL WILDLIFE REFUGE",
    "UNION SLOUGH NATIONAL WILDLIFE REFUGE",
    "UPPER KLAMATH NATIONAL WILDLIFE REFUGE",
    "UPPER MISSISSIPPI RIVER NATIONAL WILDLIFE AND FISH REFUGE",
    "UPPER OUACHITA NATIONAL WILDLIFE REFUGE",
    "UPPER SOURIS NATIONAL WILDLIFE REFUGE",
    "VALENTINE NATIONAL WILDLIFE REFUGE",
    "VALLE DE ORO NATIONAL WILDLIFE REFUGE",
    "VIEQUES NATIONAL WILDLIFE REFUGE",
    "WACCAMAW NATIONAL WILDLIFE REFUGE",
    "WAKE ATOLL NATIONAL WILDLIFE REFUGE",
    "WALLKILL RIVER NATIONAL WILDLIFE REFUGE",
    "WALLOPS ISLAND NATIONAL WILDLIFE REFUGE",
    "WAPACK NATIONAL WILDLIFE REFUGE",
    "WAPANOCCA NATIONAL WILDLIFE REFUGE",
    "WAPATO LAKE NATIONAL WILDLIFE REFUGE",
    "WAR HORSE NATIONAL WILDLIFE REFUGE",
    "WASHITA NATIONAL WILDLIFE REFUGE",
    "WASSAW NATIONAL WILDLIFE REFUGE",
    "WATERCRESS DARTER NATIONAL WILDLIFE REFUGE",
    "WAUBAY NATIONAL WILDLIFE REFUGE",
    "WERTHEIM NATIONAL WILDLIFE REFUGE",
    "WEST SISTER ISLAND NATIONAL WILDLIFE REFUGE",
    "WHEELER NATIONAL WILDLIFE REFUGE",
    "WHITE LAKE NATIONAL WILDLIFE REFUGE",
    "WHITTLESEY CREEK NATIONAL WILDLIFE REFUGE",
    "WICHITA MOUNTAINS WILDLIFE REFUGE",
    "WILLAPA NATIONAL WILDLIFE REFUGE",
    "WILLIAM L. FINLEY NATIONAL WILDLIFE REFUGE",
    "WILLOW LAKE NATIONAL WILDLIFE REFUGE",
    "WOLF ISLAND NATIONAL WILDLIFE REFUGE",
    "YAZOO NATIONAL WILDLIFE REFUGE",
    "YUKON DELTA NATIONAL WILDLIFE REFUGE",
    "YUKON FLATS NATIONAL WILDLIFE REFUGE"
];

async function getStateBoundaryNames() {
    let query = `SELECT name FROM state_boundaries ORDER BY name;`;
    const res = await db.pgPool.query(query);
    return res;
}

function getStateBoundariesParam() {
    return {
        name: 'stateBoundary',
        in: 'query',
        description: 'the state boundary to average over',
        type: 'string',
        enum: states
    };
}

function getPlantsParam() {
    return {
        name: 'plant',
        in: 'query',
        description: 'the spring index plant or average for all three combined (for BEST only average is available)',
        type: 'string',
        enum: plants
    };
}

function getPhenophasesParam() {
    return {
        name: 'phenophase',
        in: 'query',
        description: 'the spring index phenophase to average over',
        type: 'string',
        enum: phenophases
    };
}

function getBaseParam() {
    return {
        name: 'base',
        in: 'query',
        description: 'the agdd base',
        type: 'number',
        enum: bases
    };
}

function getFwsBoundariesParam() {
    return {
        name: 'fwsBoundary',
        in: 'query',
        description: 'the fws boundary to average over',
        type: 'string',
        enum: fwsBoundaries
    };
}

function getBufferedBoundaryParam() {
    return {
        name: 'useBufferedBoundary',
        in: 'query',
        description: 'for FWS boundaries select true to use 30km buffered boundary',
        type: 'boolean'
    };
}

function getConvexHullBoundaryParam() {
    return {
        name: 'useConvexHullBoundary',
        in: 'query',
        description: 'for FWS boundaries select true to clip by the convex hull of the boundary',
        type: 'boolean'
    };
}

function getUseCacheParam() {
    return {
        name: 'useCache',
        in: 'query',
        required: true,
        description: 'whether to try and pull results from the cache table',
        type: 'boolean'
    };
}

function getStyleParam() {
    return {
        name: 'style',
        in: 'query',
        required: true,
        description: 'styled image will be colored; unstyled image will contain actual raster data',
        type: 'boolean'
    };
}

function getImageFormatParam() {
    return {
        name: 'fileFormat',
        in: 'query',
        required: true,
        description: 'the format of the returned clipped image',
        type: 'string',
        enum: ['png', 'tiff']
    };
}

function getResponses(definitionName) {
    return {
        200: {
            description: "successful operation",
            schema: {
                type: 'array',
                items: {
                    $ref: `#/definitions/${definitionName}`
                }
            }
        },
        500: {
            description: "internal server error",
            schema: {
                $ref: `#/definitions/ErrorResponse`
            }
        }
    };
}


let host = `${process.env.SERVICES_HOST}:${process.env.PORT}`;
const version = "1.0.0";
const basePath = "/v1";

let swaggerDefinition = {
    swagger: "2.0",
    info: {
        description: "Welcome to the USA-NPN geospatial services. These services allow one to access geospatial data hosted at the USA-NPN in various ways including timeseries at a lat/long, GeoTIFF maps bounded by a polygon, and aggregated statistics over a ploygon.",
        version: version,
        title: "National Phenology Network Geospatial Services",
        termsOfService: "TODO: Add terms of service here",
        contact: {
            name: "The National Phenology Network",
            email: "support@usanpn.org",
            url: "www.usanpn.org"
        }
    },
    host: host,
    basePath: basePath,
    tags: [],
    schemes: ["https", "http"],
    // securityDefinitions: {
    //     token: {
    //         type: "apiKey",
    //         in: "header",
    //         name: "token"
    //     },
    //     consumer_key: {
    //         type: "apiKey",
    //         in: "header",
    //         name: "consumer_key"
    //     }
    // },
    paths: {},
    definitions: {}
};

function sortObject(o) {
    return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
}

// assumes git checked in host is localhost:3006
async function overwriteHostInSwaggerFiles(swaggerFile) {
    return new Promise((resolve, reject) => {
        fs.readFile(swaggerFile, 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            let host = `${process.env.SERVICES_HOST}:${process.env.PORT}`;
            var result = data.replace(/localhost:3006/g, host);

            fs.writeFile(swaggerFile, result, 'utf8', function (err) {
                if (err) 
                    reject(err);
                else
                    resolve();
            });
        });
    });
}

async function generate() {
    // let stateBoundaries = await getStateBoundaryNames();

    // add definitions

    swaggerDefinition['definitions']['ErrorResponse'] = {
        required: ['message'],
        properties: {
            message: {
                type: "string"
            }
        }
    };

    swaggerDefinition['definitions']['PestDescriptionsResponse'] = {
        properties: {
            pests: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        species: {
                            type: "string"
                        },
                        summary: {
                            type: "string"
                        },
                        agddMethod: {
                            type: "string"
                        },
                        base: {
                            type: "number"
                        },
                        lowerThreshold: {
                            type: "number"
                        },
                        upperThreshold: {
                            type: "number"
                        },
                        startMonthDay: {
                            type: "string"
                        },
                        bounds: {
                            type: "array",
                            items: {
                                type: "number"
                            }
                        },
                        stateNames: {
                            type: "array",
                            items: {
                                type: "string"
                            }
                        },
                        layerName: {
                            type: "string"
                        },
                        sldName: {
                            type: "string"
                        }
                    }
                }
            }
        }
    };

    swaggerDefinition['definitions']['ImageResponse'] = {
        required: ['date', 'layerClippedFrom', 'clippedImage', 'bbox'],
        properties: {
            date: {
                type: "string"
            },
            layerClippedFrom: {
                type: "string"
            },
            clippedImage: {
                type: "string"
            },
            bbox: {
                type: "array",
                items: {
                    type: "number"
                }
            }
        }
    };

    swaggerDefinition['definitions']['SimpleAgddMapResponse'] = {
        required: ['startDate', 'endDate', 'climateProvider', 'temperatureUnit', 'base', 'mapUrl'],
        properties: {
            climateProvider: {
                type: "string"
            },
            temperatureUnit: {
                type: "string"
            },
            startDate: {
                type: "string"
            },
            endDate: {
                type: "string"
            },
            base: {
                type: "number"
            },
            mapUrl: {
                type: "string"
            }
        }
    };

    swaggerDefinition['definitions']['DoubleSineAgddMapResponse'] = {
        required: ['startDate', 'endDate', 'climateProvider', 'temperatureUnit', 'lowerThreshold', 'upperThreshold', 'mapUrl'],
        properties: {
            climateProvider: {
                type: "string"
            },
            temperatureUnit: {
                type: "string"
            },
            startDate: {
                type: "string"
            },
            endDate: {
                type: "string"
            },
            lowerThreshold: {
                type: "number"
            },
            upperThreshold: {
                type: "number"
            },
            mapUrl: {
                type: "string"
            }
        }
    };

    swaggerDefinition['definitions']['SimplePointTimeSeriesResponse'] = {
        required: ['startDate', 'endDate', 'base', 'latitude', 'longitude', 'timeSeries'],
        properties: {
            climateProvider: {
                type: "string"
            },
            temperatureUnit: {
                type: "string"
            },
            startDate: {
                type: "string"
            },
            endDate: {
                type: "string"
            },
            base: {
                type: "number"
            },
            latitude: {
                type: "number"
            },
            longitude: {
                type: "number"
            },
            threshold: {
                type: "number"
            },
            dateAgddThresholdMet: {
                type: "string"
            },
            timeSeries: {
                type: "array",
                items: {
                    type: "number"
                }
            }
        }
    };

    swaggerDefinition['definitions']['DoubleSinePointTimeSeriesResponse'] = {
        required: ['startDate', 'endDate', 'lowerThreshold', 'upperThreshold', 'latitude', 'longitude', 'timeSeries'],
        properties: {
            climateProvider: {
                type: "string"
            },
            temperatureUnit: {
                type: "string"
            },
            startDate: {
                type: "string"
            },
            endDate: {
                type: "string"
            },
            lowerThreshold: {
                type: "number"
            },
            upperThreshold: {
                type: "number"
            },
            latitude: {
                type: "number"
            },
            longitude: {
                type: "number"
            },
            threshold: {
                type: "number"
            },
            dateAgddThresholdMet: {
                type: "string"
            },
            timeSeries: {
                type: "array",
                items: {
                    type: "number"
                }
            }
        }
    };

    swaggerDefinition['definitions']['ClimateTimeSeriesResponse'] = {
        required: ['startDate', 'endDate', 'latitude', 'longitude', 'timeSeries'],
        properties: {
            climateProvider: {
                type: "string"
            },
            climateVariable: {
                type: "string"
            },
            startDate: {
                type: "string"
            },
            endDate: {
                type: "string"
            },
            latitude: {
                type: "number"
            },
            longitude: {
                type: "number"
            },
            timeSeries: {
                type: "array",
                items: {
                    type: "number"
                }
            }
        }
    };

    swaggerDefinition['definitions']['BoundaryResponse'] = {
        required: ['boundary'],
        properties: {
            boundary: {
                type: "string"
            }
        }
    };

    swaggerDefinition['definitions']['BoundaryNamesResponse'] = {
        required: ['boundaryName'],
        properties: {
            boundaryName: {
                type: "array",
                items: {
                    type: "string"
                }
            }
        }
    };

    swaggerDefinition['definitions']['LegendResponse'] = {
        required: ['legendPath'],
        properties: {
            legendPath: {
                type: "string"
            }
        }
    };

    swaggerDefinition['definitions']['SixStatsResponse'] = {
        required: ['date', 'count', 'mean', 'stddev', 'min', 'max', 'percentComplete'],
        properties: {
            date: {
                type: "string"
            },
            count: {
                type: "number"
            },
            mean: {
                type: "number"
            },
            stddev: {
                type: "number"
            },
            min: {
                type: "number"
            },
            max: {
                type: "number"
            },
            percentComplete: {
                type: "number"
            }
        }
    };

    swaggerDefinition['definitions']['AgddStatsResponse'] = {
        required: ['date', 'count', 'mean', 'stddev', 'min', 'max'],
        properties: {
            date: {
                type: "string"
            },
            count: {
                type: "number"
            },
            mean: {
                type: "number"
            },
            stddev: {
                type: "number"
            },
            min: {
                type: "number"
            },
            max: {
                type: "number"
            }
        }
    };

    // add paths

    //agdd

    swaggerDefinition['paths']['/agdd/area/statistics'] = {};
    swaggerDefinition['paths']['/agdd/area/statistics']['x-swagger-router-controller'] = 'agdd';
    swaggerDefinition['paths']['/agdd/area/statistics']['get'] =
        {
            summary: `finds agdd statistics over the selected boundary`,
            description: `Finds agdd statistics for a specified base and date. Also returns paths to download the boundary shapefile and the clipped raster used to generate the statistics.`,
            tags: ['accumlated growing degree days'],
            operationId: `areaStats`,
            consumes: ['application/x-www-form-urlencoded'],
            parameters: [
                {
                    name: 'layerName',
                    in: 'query',
                    description: 'the agdd layer to clip from',
                    type: 'string',
                    enum: agddLayers
                },
                getBaseParam(),
                getStateBoundariesParam(),
                getFwsBoundariesParam(),
                getBufferedBoundaryParam(),
                getConvexHullBoundaryParam(),
                {
                    name: 'date',
                    in: 'query',
                    required: true,
                    description: 'the date to average over for example 2017-08-01.',
                    type: 'string',
                    format: 'date'
                }, getUseCacheParam()
            ],
            responses: getResponses('AgddStatsResponse')
        };

    swaggerDefinition['paths']['/agdd/anomaly/area/statistics'] = {};
    swaggerDefinition['paths']['/agdd/anomaly/area/statistics']['x-swagger-router-controller'] = 'agdd';
    swaggerDefinition['paths']['/agdd/anomaly/area/statistics']['get'] =
        {
            summary: `finds agdd anomaly statistics over the selected boundary`,
            description: `Finds agdd anomaly statistics for a specified base and date. Also returns paths to download the boundary shapefile and the clipped raster used to generate the statistics.`,
            tags: ['accumlated growing degree days'],
            operationId: `anomalyAreaStats`,
            consumes: ['application/x-www-form-urlencoded'],
            parameters: [
                {
                    name: 'layerName',
                    in: 'query',
                    description: 'the agdd anomaly layer to clip from',
                    type: 'string',
                    enum: agddAnomalyLayers
                },
                getBaseParam(),
                getStateBoundariesParam(),
                getFwsBoundariesParam(),
                getBufferedBoundaryParam(),
                getConvexHullBoundaryParam(),
                {
                    name: 'date',
                    in: 'query',
                    required: true,
                    description: 'the date to average over for example 2017-08-01.',
                    type: 'string',
                    format: 'date'
                }, getUseCacheParam()
            ],
            responses: getResponses('AgddStatsResponse')
        };

    swaggerDefinition['paths']['/agdd/area/clippedImage'] = {};
    swaggerDefinition['paths']['/agdd/area/clippedImage']['x-swagger-router-controller'] = 'agdd';
    swaggerDefinition['paths']['/agdd/area/clippedImage']['get'] =
        {
            summary: `gets agdd geotiff over the selected boundary`,
            description: `Gets agdd geotiff for a specified boundary, base, and date.`,
            tags: ['accumlated growing degree days'],
            operationId: `clippedImage`,
            consumes: ['application/x-www-form-urlencoded'],
            parameters: [
                {
                    name: 'layerName',
                    in: 'query',
                    description: 'the agdd layer to clip from',
                    type: 'string',
                    enum: agddLayers
                },
                getBaseParam(),
                getStateBoundariesParam(),
                getFwsBoundariesParam(),
                getBufferedBoundaryParam(),
                getConvexHullBoundaryParam(),
                {
                    name: 'date',
                    in: 'query',
                    required: true,
                    description: 'the date to average over for example 2017-08-01.',
                    type: 'string',
                    format: 'date'
                },
                getStyleParam(),
                getImageFormatParam()
            ],
            responses: getResponses('ImageResponse')
        };

     
    swaggerDefinition['paths']['/phenoforecasts/pestDescriptions'] = {};
    swaggerDefinition['paths']['/phenoforecasts/pestDescriptions']['x-swagger-router-controller'] = 'agdd';
    swaggerDefinition['paths']['/phenoforecasts/pestDescriptions']['get'] =
        {
            summary: `gets various metadata for each pest`,
            description: `Gets various metadata for each pest.`,
            tags: ['phenoforecasts'],
            operationId: `pestDescriptions`,
            consumes: ['application/x-www-form-urlencoded'],
            parameters: [],
            responses: getResponses('PestDescriptionsResponse')
        };    


    swaggerDefinition['paths']['/phenoforecasts/pestMap'] = {};
    swaggerDefinition['paths']['/phenoforecasts/pestMap']['x-swagger-router-controller'] = 'agdd';
    swaggerDefinition['paths']['/phenoforecasts/pestMap']['get'] =
        {
            summary: `gets pest threshold map`,
            description: `Gets pest threshold map for a specified species and date.`,
            tags: ['phenoforecasts'],
            operationId: `pestMap`,
            consumes: ['application/x-www-form-urlencoded'],
            parameters: [
                {
                    name: 'species',
                    in: 'query',
                    required: true,
                    description: 'the species to retrieve map for',
                    type: 'string',
                    enum: [
                        'Apple Maggot', 
                        'Asian Longhorned Beetle',
                        'Bagworm',
                        'Bronze Birch Borer',
                        'Buffelgrass',
                        'Eastern Tent Caterpillar', 
                        'Emerald Ash Borer',
                        'Gypsy Moth',  
                        'Hemlock Woolly Adelgid', 
                        'Magnolia Scale',
                        'Lilac Borer', 
                        'Pine Needle Scale',
                        'Winter Moth'
                    ]
                },
                {
                    name: 'date',
                    in: 'query',
                    required: true,
                    description: 'the date to stop accumulating growing degree days (inclusive) for example 2018-08-04.',
                    type: 'string',
                    format: 'date'
                },
                {
                    name: 'preserveExtent',
                    in: 'query',
                    required: false,
                    description: 'preserve extent to Contiguous United States when clipping.',
                    type: 'boolean'
                }
            ],
            responses: getResponses('ImageResponse')
        };

    
    swaggerDefinition['paths']['/agdd/simple/map'] = {};
    swaggerDefinition['paths']['/agdd/simple/map']['x-swagger-router-controller'] = 'agdd';
    swaggerDefinition['paths']['/agdd/simple/map']['get'] =
    {
        summary: `gets simple agdd raster from startDate through endDate for given base`,
        description: `Gets simple agdd raster from startDate through endDate for given base.`,
        tags: ['accumlated growing degree days'],
        operationId: `simpleAgddMap`,
        consumes: ['application/x-www-form-urlencoded'],
        parameters: [
            {
                name: 'climateProvider',
                in: 'query',
                required: true,
                description: 'the backing climate data provider. NCEP available from 2016 on, PRISM available from 1981 through previous year.',
                type: 'string',
                enum: [
                    "PRISM",
                    "NCEP"
                ]
            },
            {
                name: 'temperatureUnit',
                in: 'query',
                required: true,
                description: 'the unit of temperature.',
                type: 'string',
                enum: [
                    "celsius",
                    "fahrenheit"
                ]
            },
            {
                name: 'startDate',
                in: 'query',
                required: true,
                description: 'the date to start accumulating growing degree days for example 2018-02-15.',
                type: 'string',
                format: 'date'
            },
            {
                name: 'endDate',
                in: 'query',
                required: true,
                description: 'the date to stop accumulating growing degree days (inclusive) for example 2018-08-04.',
                type: 'string',
                format: 'date'
            },
            {
                name: 'base',
                in: 'query',
                required: true,
                description: 'the base used to compute the agdd',
                type: 'integer'
            }
        ],
        responses: getResponses('SimpleAgddMapResponse')
    };


    swaggerDefinition['paths']['/agdd/double-sine/map'] = {};
    swaggerDefinition['paths']['/agdd/double-sine/map']['x-swagger-router-controller'] = 'agdd';
    swaggerDefinition['paths']['/agdd/double-sine/map']['get'] =
    {
        summary: `gets double-sine agdd raster from startDate through endDate for given lower and upper thresholds`,
        description: `Gets double-sine agdd raster from startDate through endDate for given lower and upper thresholds.`,
        tags: ['accumlated growing degree days'],
        operationId: `doubleSineAgddMap`,
        consumes: ['application/x-www-form-urlencoded'],
        parameters: [
            {
                name: 'climateProvider',
                in: 'query',
                required: true,
                description: 'the backing climate data provider. NCEP available from 2016 on, PRISM available from 1981 through previous year.',
                type: 'string',
                enum: [
                    "NCEP",
                    "PRISM"
                ]
            },
            {
                name: 'temperatureUnit',
                in: 'query',
                required: true,
                description: 'the unit of temperature.',
                type: 'string',
                enum: [
                    "celsius",
                    "fahrenheit"
                ]
            },
            {
                name: 'startDate',
                in: 'query',
                required: true,
                description: 'the date to start accumulating growing degree days for example 2018-02-15.',
                type: 'string',
                format: 'date'
            },
            {
                name: 'endDate',
                in: 'query',
                required: true,
                description: 'the date to stop accumulating growing degree days (inclusive) for example 2018-08-04.',
                type: 'string',
                format: 'date'
            },
            {
                name: 'lowerThreshold',
                in: 'query',
                required: true,
                description: 'the lowerThreshold used to compute the double-sine agdd',
                type: 'number'
            },
            {
                name: 'upperThreshold',
                in: 'query',
                required: true,
                description: 'the upperThreshold used to compute the double-sine agdd',
                type: 'number'
            }
        ],
        responses: getResponses('DoubleSineAgddMapResponse')
    };


    swaggerDefinition['paths']['/agdd/simple/pointTimeSeries'] = {};
    swaggerDefinition['paths']['/agdd/simple/pointTimeSeries']['x-swagger-router-controller'] = 'agdd';
    swaggerDefinition['paths']['/agdd/simple/pointTimeSeries']['get'] =
        {
            summary: `gets agdd timeseries at a lat,long from startDate through endDate for given base`,
            description: `Gets agdd timeseries at a lat,long from startDate through endDate for given base.`,
            tags: ['accumlated growing degree days'],
            operationId: `simplePointTimeSeries`,
            consumes: ['application/x-www-form-urlencoded'],
            parameters: [
                {
                    name: 'climateProvider',
                    required: true,
                    in: 'query',
                    description: 'the backing climate data provider. NCEP available from 2016 on, PRISM available from 1981 through previous year.',
                    type: 'string',
                    enum: [
                        "NCEP",
                        "PRISM"
                    ]
                },
                {
                    name: 'temperatureUnit',
                    in: 'query',
                    required: true,
                    description: 'the unit of temperature.',
                    type: 'string',
                    enum: [
                        "celsius",
                        "fahrenheit"
                    ]
                },
                {
                    name: 'startDate',
                    in: 'query',
                    required: true,
                    description: 'the date to start accumulating growing degree days for example 2017-02-15.',
                    type: 'string',
                    format: 'date'
                },
                {
                    name: 'endDate',
                    in: 'query',
                    required: true,
                    description: 'the date to stop accumulating growing degree days (inclusive) for example 2017-02-41.',
                    type: 'string',
                    format: 'date'
                },
                {
                    name: 'base',
                    in: 'query',
                    required: true,
                    description: 'the base used to compute the agdd - for example 12',
                    type: 'integer'
                },
                {
                    name: 'latitude',
                    in: 'query',
                    required: true,
                    description: 'the latitude used to compute the agdd - for example 32.2',
                    type: 'number'
                },
                {
                    name: 'longitude',
                    in: 'query',
                    required: true,
                    description: 'the longitude used to compute the agdd - for example -110',
                    type: 'number'
                },
                {
                    name: 'agddThreshold',
                    in: 'query',
                    description: 'if provided, response will include the date that the agdd threshold was met - for example 1000',
                    type: 'number'
                }
            ],
            responses: getResponses('SimplePointTimeSeriesResponse')
        };


        swaggerDefinition['paths']['/agdd/simple/pointTimeSeries/30YearAvg'] = {};
        swaggerDefinition['paths']['/agdd/simple/pointTimeSeries/30YearAvg']['x-swagger-router-controller'] = 'agdd';
        swaggerDefinition['paths']['/agdd/simple/pointTimeSeries/30YearAvg']['get'] =
            {
                summary: `gets agdd 30 year average timeseries at a lat,long from startDate through endDate for given base`,
                description: `Gets agdd 30 year average timeseries at a lat,long from startDate through endDate for given base.`,
                tags: ['accumlated growing degree days'],
                operationId: `simplePointTimeSeries30YearAvg`,
                consumes: ['application/x-www-form-urlencoded'],
                parameters: [
                    {
                        name: 'temperatureUnit',
                        in: 'query',
                        required: true,
                        description: 'the unit of temperature.',
                        type: 'string',
                        enum: [
                            "celsius",
                            "fahrenheit"
                        ]
                    },
                    {
                        name: 'base',
                        in: 'query',
                        required: true,
                        description: 'the base used to compute the agdd - for example 12',
                        type: 'integer'
                    },
                    {
                        name: 'latitude',
                        in: 'query',
                        required: true,
                        description: 'the latitude used to compute the agdd - for example 32.2',
                        type: 'number'
                    },
                    {
                        name: 'longitude',
                        in: 'query',
                        required: true,
                        description: 'the longitude used to compute the agdd - for example -110',
                        type: 'number'
                    },
                    {
                        name: 'agddThreshold',
                        in: 'query',
                        description: 'if provided, response will include the date that the agdd threshold was met - for example 1000',
                        type: 'number'
                    }
                ],
                responses: getResponses('SimplePointTimeSeriesResponse')
            };

    
        swaggerDefinition['paths']['/agdd/double-sine/pointTimeSeries'] = {};
        swaggerDefinition['paths']['/agdd/double-sine/pointTimeSeries']['x-swagger-router-controller'] = 'agdd';
        swaggerDefinition['paths']['/agdd/double-sine/pointTimeSeries']['get'] =
            {
                summary: `gets agdd timeseries at a lat,long from startDate through endDate for given lower and upper thresholds`,
                description: `Gets agdd timeseries at a lat,long from startDate through endDate for given lower and upper thresholds.`,
                tags: ['accumlated growing degree days'],
                operationId: `doubleSinePointTimeSeries`,
                consumes: ['application/x-www-form-urlencoded'],
                parameters: [
                    {
                        name: 'climateProvider',
                        required: true,
                        in: 'query',
                        description: 'the backing climate data provider. NCEP available from 2016 on, PRISM available from 1981 through previous year.',
                        type: 'string',
                        enum: [
                            "NCEP",
                            "PRISM"
                        ]
                    },
                    {
                        name: 'temperatureUnit',
                        in: 'query',
                        required: true,
                        description: 'the unit of temperature.',
                        type: 'string',
                        enum: [
                            "celsius",
                            "fahrenheit"
                        ]
                    },
                    {
                        name: 'startDate',
                        in: 'query',
                        required: true,
                        description: 'the date to start accumulating growing degree days for example 2017-02-15.',
                        type: 'string',
                        format: 'date'
                    },
                    {
                        name: 'endDate',
                        in: 'query',
                        required: true,
                        description: 'the date to stop accumulating growing degree days (inclusive) for example 2017-02-41.',
                        type: 'string',
                        format: 'date'
                    },
                    {
                        name: 'lowerThreshold',
                        in: 'query',
                        required: true,
                        description: 'the lower threshold in celcius used to compute the agdd - for example 0',
                        type: 'number'
                    },
                    {
                        name: 'upperThreshold',
                        in: 'query',
                        required: true,
                        description: 'the upper threshold in celcius used to compute the agdd - for example 30',
                        type: 'number'
                    },
                    {
                        name: 'latitude',
                        in: 'query',
                        required: true,
                        description: 'the latitude used to compute the agdd - for example 32.2',
                        type: 'number'
                    },
                    {
                        name: 'longitude',
                        in: 'query',
                        required: true,
                        description: 'the longitude used to compute the agdd - for example -110',
                        type: 'number'
                    },
                    {
                        name: 'agddThreshold',
                        in: 'query',
                        description: 'if provided, response will include the date that the agdd threshold was met - for example 1000',
                        type: 'number'
                    }
                ],
                responses: getResponses('DoubleSinePointTimeSeriesResponse')
            };    


    swaggerDefinition['paths']['/agdd/anomaly/area/clippedImage'] = {};
    swaggerDefinition['paths']['/agdd/anomaly/area/clippedImage']['x-swagger-router-controller'] = 'agdd';
    swaggerDefinition['paths']['/agdd/anomaly/area/clippedImage']['get'] =
        {
            summary: `gets agdd anomaly geotiff over the selected boundary`,
            description: `Gets agdd anomaly geotiff for a specified boundary, base, and date.`,
            tags: ['accumlated growing degree days'],
            operationId: `anomalyClippedImage`,
            consumes: ['application/x-www-form-urlencoded'],
            parameters: [
                {
                    name: 'layerName',
                    in: 'query',
                    description: 'the agdd anomaly layer to clip from',
                    type: 'string',
                    enum: agddAnomalyLayers
                },
                getBaseParam(),
                getStateBoundariesParam(),
                getFwsBoundariesParam(),
                getBufferedBoundaryParam(),
                getConvexHullBoundaryParam(),
                {
                    name: 'date',
                    in: 'query',
                    required: true,
                    description: 'the date to average over for example 2017-08-01.',
                    type: 'string',
                    format: 'date'
                },
                getStyleParam(),
                getImageFormatParam()
            ],
            responses: getResponses('ImageResponse')
        };

    //climate

    swaggerDefinition['paths']['/climate/pointTimeSeries'] = {};
    swaggerDefinition['paths']['/climate/pointTimeSeries']['x-swagger-router-controller'] = 'climate';
    swaggerDefinition['paths']['/climate/pointTimeSeries']['get'] =
        {
            summary: `gets timeseries at a lat,long from startDate through endDate for a given climate provider and variable`,
            description: `Gets timeseries at a lat,long from startDate through endDate for a given climate provider and variable.`,
            tags: ['climate data'],
            operationId: `pointTimeSeries`,
            consumes: ['application/x-www-form-urlencoded'],
            parameters: [
                {
                    name: 'climateProvider',
                    in: 'query',
                    required: true,
                    description: 'the backing climate data provider.',
                    type: 'string',
                    enum: [
                        "NCEP",
                        "PRISM"
                    ]
                },
                {
                    name: 'climateVariable',
                    in: 'query',
                    required: true,
                    description: 'the climate variable (currently only 2018 prism precip, 2018 ncep tmin, tmax, or tavg).',
                    type: 'string',
                    enum: [
                        "precip",
                        "tavg",
                        "tmin",
                        "tmax"
                    ]
                },
                {
                    name: 'startDate',
                    in: 'query',
                    required: true,
                    description: 'the date to start the timeseries for example 2017-02-15.',
                    type: 'string',
                    format: 'date'
                },
                {
                    name: 'endDate',
                    in: 'query',
                    required: true,
                    description: 'the date to stop the timeseries (inclusive) for example 2017-02-41.',
                    type: 'string',
                    format: 'date'
                },
                {
                    name: 'latitude',
                    in: 'query',
                    required: true,
                    description: 'the latitude used to compute the timeseries - for example 32.2',
                    type: 'number'
                },
                {
                    name: 'longitude',
                    in: 'query',
                    required: true,
                    description: 'the longitude used to compute the timeseries - for example -110',
                    type: 'number'
                }
            ],
            responses: getResponses('ClimateTimeSeriesResponse')
        };

    //si-x

    swaggerDefinition['paths']['/si-x/area/statistics'] = {};
    swaggerDefinition['paths']['/si-x/area/statistics']['x-swagger-router-controller'] = 'six';
    swaggerDefinition['paths']['/si-x/area/statistics']['get'] =
        {
            summary: `finds spring index statistics over the selected boundary`,
            description: `Finds spring index statistics for a specified boundary, plant, phenophase, and date. Also returns paths to download the boundary shapefile and the clipped raster used to generate the statistics.`,
            tags: ['spring index'],
            operationId: `areaStats`,
            consumes: ['application/x-www-form-urlencoded'],
            parameters: [
                {
                    name: 'layerName',
                    in: 'query',
                    description: 'the si-x layer to clip from',
                    type: 'string',
                    enum: sixLayers
                },
                getPhenophasesParam(),
                getPlantsParam(),
                getStateBoundariesParam(),
                getFwsBoundariesParam(),
                getBufferedBoundaryParam(),
                getConvexHullBoundaryParam(),
                {
                    name: 'climate',
                    in: 'query',
                    description: 'the backing climate data provider. NCEP available from 2016 on, PRISM available from 1981 through previous year, BEST available from 1880-2013.',
                    type: 'string',
                    enum: climateProviders
                },
                {
                    name: 'date',
                    in: 'query',
                    required: true,
                    description: 'the date to average over for example 2017-08-01. For historic yearly data specify January 1st. ie. 2013-01-01',
                    type: 'string',
                    format: 'date'
                }, getUseCacheParam()],
            responses: getResponses('SixStatsResponse')
        };

    swaggerDefinition['paths']['/si-x/anomaly/area/statistics'] = {};
    swaggerDefinition['paths']['/si-x/anomaly/area/statistics']['x-swagger-router-controller'] = 'six';
    swaggerDefinition['paths']['/si-x/anomaly/area/statistics']['get'] =
        {
            summary: `finds spring index anomaly statistics over the selected boundary`,
            description: `Finds spring index statistics for a specified boundary, plant, phenophase, and date. Also returns paths to download the boundary shapefile and the clipped raster used to generate the statistics.`,
            tags: ['spring index'],
            operationId: `anomalyAreaStats`,
            consumes: ['application/x-www-form-urlencoded'],
            parameters: [
                {
                    name: 'layerName',
                    in: 'query',
                    description: 'the si-x layer to clip from',
                    type: 'string',
                    enum: sixAnomalyLayers
                },
                getPhenophasesParam(),
                getStateBoundariesParam(),
                getFwsBoundariesParam(),
                getBufferedBoundaryParam(),
                getConvexHullBoundaryParam(),
                {
                    name: 'date',
                    in: 'query',
                    required: true,
                    description: 'the date to average over for example 2017-08-01. For historic yearly data specify January 1st. ie. 2013-01-01',
                    type: 'string',
                    format: 'date'
                }, getUseCacheParam()
            ],
            responses: getResponses('SixStatsResponse')
        };

    swaggerDefinition['paths']['/si-x/area/clippedImage'] = {};
    swaggerDefinition['paths']['/si-x/area/clippedImage']['x-swagger-router-controller'] = 'six';
    swaggerDefinition['paths']['/si-x/area/clippedImage']['get'] =
        {
            summary: `gets spring index geotiff over the selected boundary`,
            description: `Gets spring index geotiff for a specified boundary, plant, phenophase, and date.`,
            tags: ['spring index'],
            operationId: `clippedImage`,
            consumes: ['application/x-www-form-urlencoded'],
            parameters: [
                {
                    name: 'layerName',
                    in: 'query',
                    description: 'the si-x layer to clip from',
                    type: 'string',
                    enum: sixLayers
                },
                getPhenophasesParam(),
                getPlantsParam(),
                getStateBoundariesParam(),
                getFwsBoundariesParam(),
                getBufferedBoundaryParam(),
                getConvexHullBoundaryParam(),
                {
                    name: 'climate',
                    in: 'query',
                    description: 'the backing climate data provider. NCEP available from 2016 on, PRISM available from 1981 through previous year, BEST available from 1880-2013.',
                    type: 'string',
                    enum: climateProviders
                },
                {
                    name: 'date',
                    in: 'query',
                    required: true,
                    description: `YYYY-MM-DD with allowed ranges as follows - PRISM: ${validation.prismStart.format('YYYY-MM-DD')} through ${validation.prismEnd.format('YYYY-MM-DD')}, NCEP historic: ${validation.ncepHistStart.format('YYYY-MM-DD')} through ${validation.ncepHistEnd.format('YYYY-MM-DD')}, NCEP: ${validation.ncepStart.format('YYYY-MM-DD')} through ${validation.ncepEnd.format('YYYY-MM-DD')}, BEST: ${validation.bestStart.format('YYYY-MM-DD')} through ${validation.bestEnd.format('YYYY-MM-DD')}.`,
                    type: 'string',
                    format: 'date'
                },
                getStyleParam(),
                getImageFormatParam()
            ],
            responses: getResponses('ImageResponse')
        };

    swaggerDefinition['paths']['/si-x/anomaly/area/clippedImage'] = {};
    swaggerDefinition['paths']['/si-x/anomaly/area/clippedImage']['x-swagger-router-controller'] = 'six';
    swaggerDefinition['paths']['/si-x/anomaly/area/clippedImage']['get'] =
        {
            summary: `gets spring index anomaly geotiff over the selected boundary`,
            description: `Gets spring index anomaly geotiff for a specified boundary, plant, phenophase, and date.`,
            tags: ['spring index'],
            operationId: `anomalyClippedImage`,
            consumes: ['application/x-www-form-urlencoded'],
            parameters: [
                {
                    name: 'layerName',
                    in: 'query',
                    description: 'the si-x layer to clip from',
                    type: 'string',
                    enum: sixAnomalyLayers
                },
                getPhenophasesParam(),
                getStateBoundariesParam(),
                getFwsBoundariesParam(),
                getBufferedBoundaryParam(),
                getConvexHullBoundaryParam(),
                {
                    name: 'date',
                    in: 'query',
                    required: true,
                    description: 'the date to average over for example 2017-08-01. For historic yearly data specify January 1st. ie. 2013-01-01',
                    type: 'string',
                    format: 'date'
                },
                getStyleParam(),
                getImageFormatParam()
            ],
            responses: getResponses('ImageResponse')
        };

    swaggerDefinition['paths']['/si-x/area/statistics/timeseries'] = {};
    swaggerDefinition['paths']['/si-x/area/statistics/timeseries']['x-swagger-router-controller'] = 'six';
    swaggerDefinition['paths']['/si-x/area/statistics/timeseries']['get'] =
        {
            summary: `finds yearly spring index statistics over the selected boundary and year range`,
            description: `Finds yearly spring index statistics for a specified boundary, plant, phenophase, and year range. Also returns paths to download the boundary shapefile and the clipped raster used to generate the statistics.`,
            tags: ['spring index'],
            operationId: `areaStatsTimeSeries`,
            consumes: ['application/x-www-form-urlencoded'],
            parameters: [
                {
                    name: 'layerName',
                    in: 'query',
                    description: 'the si-x layer to clip from',
                    type: 'string',
                    enum: sixLayers
                },
                getPhenophasesParam(),
                getPlantsParam(),
                getStateBoundariesParam(),
                getFwsBoundariesParam(),
                {
                    name: 'climate',
                    in: 'query',
                    description: 'the backing climate data provider. NCEP available from 2016 on, PRISM available from 1981 through previous year, BEST available from 1880-2013.',
                    type: 'string',
                    enum: climateProviders
                },
                {
                    name: 'yearStart',
                    in: 'query',
                    required: true,
                    description: 'the initial year for the timeseries (inclusive)',
                    type: 'integer'
                },
                {
                    name: 'yearEnd',
                    in: 'query',
                    required: true,
                    description: 'the final year for the timeseries (inclusive)',
                    type: 'integer'
                },
                getBufferedBoundaryParam(),
                getConvexHullBoundaryParam(),
                getUseCacheParam()
            ],
            responses: getResponses('SixStatsResponse')
        };


    // boundary
    swaggerDefinition['paths']['/si-x/area/boundary'] = {};
    swaggerDefinition['paths']['/si-x/area/boundary']['x-swagger-router-controller'] = 'boundaries';
    swaggerDefinition['paths']['/si-x/area/boundary']['get'] =
        {
            summary: `gets boundary shapefile or geojson`,
            description: `Gets boundary shapefile or geojson (can paste geojson into http://geojson.io for preview)`,
            tags: ['boundaries'],
            operationId: `boundary`,
            consumes: ['application/x-www-form-urlencoded'],
            parameters: [
                {
                    name: 'format',
                    in: 'query',
                    description: 'the format of the boundary',
                    type: 'string',
                    enum: ['shapefile', 'geojson']
                },
                getStateBoundariesParam(),
                getFwsBoundariesParam(),
                getBufferedBoundaryParam(),
                getConvexHullBoundaryParam()
            ],
            responses: getResponses('BoundaryResponse')
        };

    swaggerDefinition['paths']['/si-x/area/boundaryNames'] = {};
    swaggerDefinition['paths']['/si-x/area/boundaryNames']['x-swagger-router-controller'] = 'boundaries';
    swaggerDefinition['paths']['/si-x/area/boundaryNames']['get'] =
        {
            summary: `get list of available boundary names for FWS or States`,
            description: `Gets list of available boundary names for FWS or States`,
            tags: ['boundaries'],
            operationId: `boundaryNames`,
            consumes: ['application/x-www-form-urlencoded'],
            parameters: [
                {
                    name: 'boundaryType',
                    in: 'query',
                    description: 'list the FWS boundaries or the State Boundaries',
                    type: 'string',
                    enum: ['FWS', 'States']
                }
            ],
            responses: getResponses('BoundaryNamesResponse')
        };

    // legends
    swaggerDefinition['paths']['/legends'] = {};
    swaggerDefinition['paths']['/legends']['x-swagger-router-controller'] = 'legends';
    swaggerDefinition['paths']['/legends']['get'] =
        {
            summary: `get pretty legend for sld`,
            description: `Gets a pretty legend for an sld`,
            tags: ['legends'],
            operationId: `drawSldLegend`,
            consumes: ['application/x-www-form-urlencoded'],
            parameters: [
                {
                    name: 'sldName',
                    in: 'query',
                    description: 'the name of the sld',
                    type: 'string',
                    enum: [
                        'agdd',
                        'agdd_web',
                        'agdd_anomaly', 
                        'agdd_anomaly_50f',
                        'leafout_anomaly_black',
                        'bloom_best_web',
                        'leafout_best_web',
                        'bloom_bimonthly_web',
                        'leafout_bimonthly_web'
                    ]
                }
            ],
            responses: getResponses('LegendResponse')
        };

    //write the swagger yaml defs to disk
    return new Promise((resolve, reject) => {

        swaggerDefinition['paths'] = sortObject(swaggerDefinition['paths']);
        swaggerDefinition['definitions'] = sortObject(swaggerDefinition['definitions']);

        // all went well so we can convert the swagger object to yaml and write it to swagger.yaml
        fs.writeFile('./api/swagger/swagger.yaml', yaml.dump(swaggerDefinition, {'noRefs': true}) , 'utf-8', (err) => {
            if(err)
                reject(err);
            else {
                overwriteHostInSwaggerFiles("./api/swagger/swagger_v0.yaml")
                    .then( () => resolve());

            }
        });
    });

}

module.exports.generate = generate;