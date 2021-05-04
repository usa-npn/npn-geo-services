// the following will get the bounding box for a shapefile
// ogrinfo --config SHAPE_RESTORE_SHX TRUE -al -so states.shp

// the following will get the shapefile from geoserver
// https://geoserver-dev.usanpn.org:443/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME%20IN%20(%27Ohio%27,%27Pennsylvania%27,%27New%20York%27,%27Connecticut%27,%27Rhode%20Island%27,%27Massachusetts%27)&outputFormat=SHAPE-ZIP
// https://geoserver.usanpn.org:443/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME IN ('Maine','Vermont','Colorado','North Dakota','South Dakota','Nebraska','Kansas','Oklahoma','Texas','Minnesota','Iowa','Missouri','Arkansas','Louisiana','Wisconsin','Illinois','Kentucky','Tennessee','Mississippi','Michigan','Indiana','Alabama','Ohio','Alabama','Georgia','South Carolina','North Carolina','Virginia','West Virginia','District of Columbia','Maryland','Delaware','New Jersey','Pennsylvania','New York','Connecticut','Rhode Island','Massachusetts','New Hampshire','Florida')&outputFormat=SHAPE-ZIP
// https://geoserver.usanpn.org:443/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME IN ('Maine','Vermont','New Hampshire','New York','Rhode Island','Massachusetts','Connecticut','New Jersey','Pennsylvania','Delaware','Maryland','Virginia','West Virginia','North Carolina','Tennessee','Kentucky','Ohio','Indiana','Illinois','Iowa','Minnesota','Wisconsin','Michigan')&outputFormat=SHAPE-ZIP

const pests = [
    {
        species: 'Apple Maggot',
        summary: 'Apple maggot larvae cause damage to ripening fruit. If left untreated, these pest insects can spread across the entire tree. These insects primarily affect apple trees, but can also impact plum, apricot, pear, cherry and hawthorn trees.',
        base: 50,
        layerName: 'gdd:agdd_50f',
        bounds: [
            -124.763068,
            24.523096,
            -66.949895,
            49.384358
        ],
        stateNames: ['Alabama', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District Of Columbia', 'Florida', 'Georgia', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
        rangeShpFilePath: '/var/www/data-site/files/npn-geo-services/shape_files/conus_range/states.shp',
        rangeShapeFile: "https://geoserver.usanpn.org:443/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME%20NOT%20IN%20(%27American%20Samoa%27,%27Alaska%27,%27Hawaii%27,%27Puerto%20Rico%27,%27United%20States%20Virgin%20Islands%27,%20%27Commonwealth%20of%20the%20Northern%20Mariana%20Islands%27,%20%27Guam%27)&outputFormat=SHAPE-ZIP",
        sldName: 'apple_maggot.sld'
    },
    {
        species: 'Asian Longhorned Beetle',
        summary: 'As a generalist pest, Asian longhorned beetle poses a great potential threat to eastern forests. It is currently contained in three small quarantined areas (a fourth was recently eradicated). Burning firewood where you buy it is critical to stopping the spread of this pest.',
        lowerThreshold: 50,
        upperThreshold: 86,
        layerName: 'custom',
        startMonthDay: '01-01',
        agddMethod: 'double-sine',
        bounds: [
            -84.820159,
            38.403202,
            -69.928393,
            45.015850
        ],
        stateNames: ['Connecticut','Massachusetts','New York','Ohio','Pennsylvania','Rhode Island'],
        rangeShpFilePath: '/var/www/data-site/files/npn-geo-services/shape_files/asian_longhorned_beetle_range/states.shp',
        rangeShapeFile: "https://geoserver.usanpn.org:443/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME%20IN%20(%27Ohio%27,%27Pennsylvania%27,%27New%20York%27,%27Connecticut%27,%27Rhode%20Island%27,%27Massachusetts%27)&outputFormat=SHAPE-ZIP",
        sldName: 'asian_longhorned_beetle.sld'
    },
    {
        species: 'Bagworm',
        summary: 'Bagworm caterpillars defoliate over 50 families of evergreen and deciduous trees and shrubs, primarily arborvitae, juniper, pine, and spruce. Stripping of leaves and needles is most noticeable in uppermost parts of plants. If left untreated, these pests are capable of extensive defoliation which can cause branch dieback or death.',
        lowerThreshold: 50,
        layerName: 'custom',
        startMonthDay: '03-01',
        agddMethod: 'simple',
        bounds: [
            -109.050173,
            30.173943,
            -69.928393,
            47.080621
        ],
        stateNames: ['Alabama', 'Arkansas', 'Connecticut', 'Delaware', 'Georgia', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Maryland', 'Massachusetts', 'Missouri', 'Nebraska', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'Ohio', 'Oklahoma', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'Tennessee', 'Virginia', 'Wisconsin', 'Mississippi', 'West Virginia'],
        rangeShpFilePath: '/var/www/data-site/files/npn-geo-services/shape_files/bagworm_range/states.shp',
        rangeShapeFile: "https://geoserver.usanpn.org:443/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME%20IN%20(%27Alabama%27,%20%27Arkansas%27,%20%27Connecticut%27,%20%27Delaware%27,%20%27Georgia%27,%20%27Illinois%27,%20%27Indiana%27,%20%27Iowa%27,%20%27Kansas%27,%20%27Kentucky%27,%20%27Maryland%27,%20%27Massachusetts%27,%20%27Missouri%27,%20%27Nebraska%27,%20%27New%20Jersey%27,%20%27New%20Mexico%27,%20%27New%20York%27,%20%27North%20Carolina%27,%20%27Ohio%27,%20%27Oklahoma%27,%20%27Pennsylvania%27,%20%27Rhode%20Island%27,%20%27South%20Carolina%27,%20%27Tennessee%27,%20%27Virginia%27,%20%27Wisconsin%27,%20%27Mississippi%27,%20%27West%20Virginia%27)&outputFormat=SHAPE-ZIP",
        sldName: 'bagworm.sld'
    },
    {
        species: 'Bronze Birch Borer',
        summary: 'Bronze birch borer frequently kills birch trees by boring into the wood.',
        lowerThreshold: 50,
        upperThreshold: 150,
        layerName: 'custom',
        startMonthDay: '01-01',
        agddMethod: 'double-sine',
        bounds: [
            -125.0208333,
            24.0625,
            -66.4791667000001,
            49.9375
        ],
        stateNames: ['Alabama', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District Of Columbia', 'Florida', 'Georgia', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
        rangeShpFilePath: '/var/www/data-site/files/npn-geo-services/shape_files/conus_range/states.shp',
        rangeShapeFile: "https://geoserver.usanpn.org:443/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME%20NOT%20IN%20(%27American%20Samoa%27,%27Alaska%27,%27Hawaii%27,%27Puerto%20Rico%27,%27United%20States%20Virgin%20Islands%27,%20%27Commonwealth%20of%20the%20Northern%20Mariana%20Islands%27,%20%27Guam%27)&outputFormat=SHAPE-ZIP",
        sldName: 'bronze_birch_borer.sld'
    },
    {
        species: 'Eastern Tent Caterpillar',
        summary: 'Eastern Tent Caterpillars are a native moth and while they can defoliate trees, the trees rarely die as a consequence.',
        lowerThreshold: 50,
        layerName: 'custom',
        startMonthDay: '03-01',
        agddMethod: 'simple',
        bounds: [
            -109.060253,
            30.173943,
            -66.949895,
            49.384358
        ],
        stateNames: ['Maine','Vermont','Colorado','North Dakota','South Dakota','Nebraska','Kansas','Oklahoma','Minnesota','Iowa','Missouri','Arkansas','Wisconsin','Illinois','Kentucky','Tennessee','Mississippi','Michigan','Indiana','Alabama','Ohio','Alabama','Georgia','South Carolina','North Carolina','Virginia','West Virginia','District of Columbia','Maryland','Delaware','New Jersey','Pennsylvania','New York','Connecticut','Rhode Island','Massachusetts','New Hampshire'],
        rangeShpFilePath: '/var/www/data-site/files/npn-geo-services/shape_files/eastern_tent_caterpillar_range/states.shp',
        rangeShapeFile: "https://geoserver.usanpn.org:443/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME%20IN%20(%27Maine%27,%27Vermont%27,%27Colorado%27,%27North%20Dakota%27,%27South%20Dakota%27,%27Nebraska%27,%27Kansas%27,%27Oklahoma%27,%27Minnesota%27,%27Iowa%27,%27Missouri%27,%27Arkansas%27,%27Wisconsin%27,%27Illinois%27,%27Kentucky%27,%27Tennessee%27,%27Mississippi%27,%27Michigan%27,%27Indiana%27,%27Alabama%27,%27Ohio%27,%27Alabama%27,%27Georgia%27,%27South%20Carolina%27,%27North%20Carolina%27,%27Virginia%27,%27West%20Virginia%27,%27District%20of%20Columbia%27,%27Maryland%27,%27Delaware%27,%27New%20Jersey%27,%27Pennsylvania%27,%27New%20York%27,%27Connecticut%27,%27Rhode%20Island%27,%27Massachusetts%27,%27New%20Hampshire%27)&outputFormat=SHAPE-ZIP",
        sldName: 'eastern_tent_caterpillar.sld'
    },
    {
        species: 'Emerald Ash Borer',
        summary: 'Emerald ash borer is a beetle that causes significant harm to ash trees throughout the eastern United States.',
        lowerThreshold: 50,
        upperThreshold: 150,
        layerName: 'custom',
        startMonthDay: '01-01',
        agddMethod: 'double-sine',
        bounds: [
            -109.060253,
            24.523096,
            -66.949895,
            49.384358
        ],
        stateNames: ['Maine','Vermont','Colorado','Nebraska','Kansas','Oklahoma','Texas','Minnesota','Iowa','Missouri','Arkansas','Louisiana','Wisconsin','Illinois','Kentucky','Tennessee','Mississippi','Michigan','Indiana','Alabama','Ohio','Alabama','Georgia','South Carolina','North Carolina','Virginia','West Virginia','District of Columbia','Maryland','Delaware','New Jersey','Pennsylvania','New York','Connecticut','Rhode Island','Massachusetts','New Hampshire','Florida'],
        rangeShpFilePath: '/var/www/data-site/files/npn-geo-services/shape_files/emerald_ash_borer_range/states.shp',
        rangeShapeFile: "https://geoserver.usanpn.org:443/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME%20IN%20(%27Maine%27,%27Vermont%27,%27Colorado%27,%27Nebraska%27,%27Kansas%27,%27Oklahoma%27,%27Texas%27,%27Minnesota%27,%27Iowa%27,%27Missouri%27,%27Arkansas%27,%27Louisiana%27,%27Wisconsin%27,%27Illinois%27,%27Kentucky%27,%27Tennessee%27,%27Mississippi%27,%27Michigan%27,%27Indiana%27,%27Alabama%27,%27Ohio%27,%27Alabama%27,%27Georgia%27,%27South%20Carolina%27,%27North%20Carolina%27,%27Virginia%27,%27West%20Virginia%27,%27District%20of%20Columbia%27,%27Maryland%27,%27Delaware%27,%27New%20Jersey%27,%27Pennsylvania%27,%27New%20York%27,%27Connecticut%27,%27Rhode%20Island%27,%27Massachusetts%27,%27New%20Hampshire%27,%27Florida%27)&outputFormat=SHAPE-ZIP",
        sldName: 'emerald_ash_borer.sld'
    },
    {
        species: 'Gypsy Moth',
        summary: 'European gypsy moth caterpillars feed on deciduous trees, causing major defoliation and tree mortality. They are considered one of the worst forest pests in the United States.',
        lowerThreshold: 37.4,
        upperThreshold: 104,
        layerName: 'custom',
        startMonthDay: '01-01',
        agddMethod: 'double-sine',
        bounds: [
            -97.239209,
            33.842316,
            -66.949895,
            49.384358
        ],
        stateNames: ['Maine','Vermont','New Hampshire','New York','Rhode Island','Massachusetts',
        'Connecticut','New Jersey','Pennsylvania','Delaware','Maryland','Virginia','West Virginia',
        'North Carolina','Tennessee','Kentucky','Ohio','Indiana','Illinois','Iowa','Minnesota','Wisconsin','Michigan'],
        rangeShpFilePath: '/var/www/data-site/files/npn-geo-services/shape_files/gypsy_moth_range/states.shp',
        rangeShapeFile: "https://geoserver.usanpn.org:443/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME%20IN%20(%27Maine%27,%27Vermont%27,%27New%20Hampshire%27,%27New%20York%27,%27Rhode%20Island%27,%27Massachusetts%27,%27Connecticut%27,%27New%20Jersey%27,%27Pennsylvania%27,%27Delaware%27,%27Maryland%27,%27Virginia%27,%27West%20Virginia%27,%27North%20Carolina%27,%27Tennessee%27,%27Kentucky%27,%27Ohio%27,%27Indiana%27,%27Illinois%27,%27Iowa%27,%27Minnesota%27,%27Wisconsin%27,%27Michigan%27)&outputFormat=SHAPE-ZIP",
        sldName: 'gypsy_moth.sld'
    },
    {
        species: 'Hemlock Woolly Adelgid',
        summary: 'Hemlock woolly adelgid can be deadly to hemlock trees and, in the eastern United States, lacks enemies that keep their populations in check. Researchers wish to identify the optimal window to release insect predators; you can support this effort by observing hemlock woolly adelgid life cycle stages using Nature’s Notebook.',
        base: 32,
        layerName: 'gdd:agdd',
        bounds: [
            -124.763068,
            30.223334,
            -66.949895,
            49.384358
        ],
        stateNames: ['Alabama','Connecticut','Delaware','Kentucky','Maine','Maryland','Massachusetts','Michigan','New Hampshire','New Jersey','New York','Ohio','North Carolina','Pennsylvania','Rhode Island','Tennessee','Virginia','West Virginia','South Carolina','Georgia','Wisconsin','Minnesota','Indiana','Washington','Oregon','California','Idaho','Montana', 'Vermont'],
        rangeShpFilePath: '/var/www/data-site/files/npn-geo-services/shape_files/hemlock_woolly_adelgid_range/states.shp',
        rangeShapeFile: "https://geoserver.usanpn.org:443/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME%20IN%20(%27Maine%27,%27Vermont%27,%27New%20Hampshire%27,%27New%20York%27,%27Connecticut%27,%27Massachusetts%27,%27Rhode%20Island%27,%27New%20Jersey%27,%27Pennsylvania%27,%27Delaware%27,%27Maryland%27,%27Virginia%27,%27West%20Virginia%27,%27Ohio%27,%27Kentucky%27,%27Michigan%27,%27Tennessee%27,%27North%20Carolina%27,%27South%20Carolina%27,%27Alabama%27,%27Georgia%27,%27Wisconsin%27,%27Minnesota%27,%27Indiana%27,%27Washington%27,%27Oregon%27,%27California%27,%27Idaho%27,%27Montana%27)&outputFormat=SHAPE-ZIP",
        sldName: 'hemlock_woolly_adelgid.sld'
    },
    {
        species: 'Magnolia Scale',
        summary: 'Magnolia scale is a pest native to the Eastern United States that affects magnolia trees and tulip trees. They cause stress to their host trees by removing sap which can lead to yellowing leaves, twig dieback, and even death.',
        lowerThreshold: 50,
        upperThreshold: 150,
        layerName: 'custom',
        startMonthDay: '01-01',
        agddMethod: 'double-sine',
        bounds: [
            -106.645646,
            24.523096,
            -66.949895,
            49.384358
        ],
        stateNames: ['Alabama', 'Arkansas', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Nebraska', 'New Hampshire', 'New Jersey', 'New York', 'North Carolina', 'Ohio', 'Oklahoma', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'Tennessee', 'Texas', 'Vermont', 'Virginia', 'West Virginia', 'Wisconsin'],
        rangeShpFilePath: '/var/www/data-site/files/npn-geo-services/shape_files/magnolia_scale_range/states.shp',
        rangeShapeFile: "https://geoserver.usanpn.org:443/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME%20IN%20(%27Alabama%27,%20%27Connecticut%27,%20%27Florida%27,%20%27Georgia%27,%20%27Illinois%27,%20%27Indiana%27,%20%27Kentucky%27,%20%27Louisiana%27,%20%27Maine%27,%20%27Maryland%27,%20%27Massachusetts%27,%20%27Michigan%27,%20%27Mississippi%27,%20%27New%20York%27,%20%27North%20Carolina%27,%20%27Ohio%27,%20%27Pennsylvania%27,%20%27South%20Carolina%27,%20%27Tennessee%27,%20%27Texas%27,%20%27Virginia%27,%20%27West%20Virginia%27,%20%27Wisconsin%27,%20%27Vermont%27,%20%27New%20Hampshire%27,%20%27Rhode%20Island%27,%20%27New%20Jersey%27,%20%27Delaware%27,%20%27Arkansas%27,%20%27Missouri%27,%20%27Iowa%27,%20%27Minnesota%27,%20%27Nebraska%27,%20%27Kansas%27,%20%27Oklahoma%27)&outputFormat=SHAPE-ZIP",
        sldName: 'magnolia_scale.sld'
    },
    {
        species: 'Lilac Borer',
        summary: 'Lilac borer is a clear-wing moth that can damage lilac, ash, and privet trees and shrubs by burrowing into the heartwood.',
        lowerThreshold: 50,
        upperThreshold: 150,
        layerName: 'custom',
        startMonthDay: '01-01',
        agddMethod: 'double-sine',
        bounds: [
            -124.763068,
            24.523096,
            -66.949895,
            49.384358
        ],
        stateNames: ['Alabama', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District Of Columbia', 'Florida', 'Georgia', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
        rangeShpFilePath: '/var/www/data-site/files/npn-geo-services/shape_files/conus_range/states.shp',
        rangeShapeFile: "https://geoserver.usanpn.org:443/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME%20NOT%20IN%20(%27American%20Samoa%27,%27Alaska%27,%27Hawaii%27,%27Puerto%20Rico%27,%27United%20States%20Virgin%20Islands%27,%20%27Commonwealth%20of%20the%20Northern%20Mariana%20Islands%27,%20%27Guam%27)&outputFormat=SHAPE-ZIP",
        sldName: 'lilac_borer.sld'
    },
    {
        species: 'Pine Needle Scale',
        summary: 'Pine needle scale is a native pest that affects ornamental pines and Christmas tree plantations.',
        lowerThreshold: 50,
        layerName: 'custom',
        startMonthDay: '03-01',
        agddMethod: 'simple',
        bounds: [
            -124.763068,
            28.928609,
            -66.949895,
            49.384358
        ],
        stateNames: ['Alabama', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District Of Columbia', 'Georgia', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
        rangeShpFilePath: '/var/www/data-site/files/npn-geo-services/shape_files/pine_needle_scale_range/states.shp',
        rangeShapeFile: "https://geoserver.usanpn.org:443/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME%20NOT%20IN%20(%27Florida%27,%27Lousiana%27,%27Texas%27,%20%27American%20Samoa%27,%27Alaska%27,%27Hawaii%27,%27Puerto%20Rico%27,%27United%20States%20Virgin%20Islands%27,%20%27Commonwealth%20of%20the%20Northern%20Mariana%20Islands%27,%20%27Guam%27)&outputFormat=SHAPE-ZIP",
        sldName: 'pine_needle_scale.sld'
    },
    {
        species: 'Winter Moth',
        summary: 'Winter moth is a non-native insect pest that causes damage to deciduous trees, particularly maples and oaks.',
        base: 50,
        layerName: 'gdd:agdd_50f',
        bounds: [
            -79.762152,
            40.496103,
            -66.949895,
            47.459686
        ],
        stateNames: ['Connecticut','Maine','Massachusetts','New Hampshire','New York','Vermont'],
        rangeShpFilePath: '/var/www/data-site/files/npn-geo-services/shape_files/winter_moth_range/states.shp',
        rangeShapeFile: "https://geoserver.usanpn.org:443/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME%20IN%20(%27New%20York%27,%27Connecticut%27,%27New%20Hampshire%27,%27Vermont%27,%27Maine%27,%27Massachusetts%27)&outputFormat=SHAPE-ZIP",
        sldName: 'winter_moth.sld'
    },
    {
        species: 'Buffelgrass',
        summary: 'todo.',
        base: 50,
        layerName: 'precipitation:buffelgrass_prism',
        bounds: [
            -114.81651,
            31.332177,
            -109.045223,
            37.00426
        ],
        stateNames: ['Arizona'],
        rangeShpFilePath: '/var/www/data-site/files/npn-geo-services/shape_files/conus_range/states.shp',
        rangeShapeFile: "https://geoserver.usanpn.org:443/geoserver/gdd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gdd:states&CQL_FILTER=NAME%20IN%20(%27Arizona%27)&outputFormat=SHAPE-ZIP",
        sldName: 'buffel_grass_inches.sld'
    }
];

module.exports.pests = pests;