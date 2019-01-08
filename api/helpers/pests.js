// the following will get the bounding box for a shapefile
// ogrinfo --config SHAPE_RESTORE_SHX TRUE -al -so states.shp
const pests = [
    {
        species: 'Emerald Ash Borer',
        base: 50,
        layerName: 'gdd:agdd_50f',
        bounds: [
            -109.0712618165,
            24.5049877850162,
            -66.9509145889486,
            49.4107288273616
        ],
        stateNames: ["'Maine'", "'Vermont'", "'Colorado'", "'Nebraska'", "'Kansas'", "'Oklahoma'", "'Texas'", "'Minnesota'",
        "'Iowa'", "'Missouri'", "'Arkansas'", "'Louisiana'", "'Wisconsin'", "'Illinois'",
        "'Kentucky'", "'Tennessee'", "'Mississippi'", "'Michigan'", "'Indiana'", "'Alabama'",
        "'Ohio'", "'Alabama'", "'Georgia'", "'South Carolina'", "'North Carolina'", "'Virginia'",
        "'West Virginia'", "'District of Columbia'", "'Maryland'", "'Delaware'", "'New Jersey'", "'Pennsylvania'",
        "'New York'", "'Connecticut'", "'Rhode Island'", "'Massachusetts'", "'New Hampshire'", "'Florida'"],
        sldName: 'emerald_ash_borer.sld'
    }, 
    {
        species: 'Apple Maggot',
        base: 50,
        layerName: 'gdd:agdd_50f',
        bounds: [
            -125.0208333,
            24.0625,
            -66.4791667000001,
            49.9375
        ],
        stateNames: [],
        sldName: 'apple_maggot.sld'
    },
    {
        species: 'Hemlock Woolly Adelgid',
        base: 32,
        layerName: 'gdd:agdd',
        bounds: [
            -124.773727262932,
            30.2151872964169,
            -66.9509145889486,
            49.4107288273616
        ],
        stateNames: ["'Maine'", "'Vermont'", "'New Hampshire'", "'New York'", "'Connecticut'", "'Massachusetts'",
        "'Rhode Island'", "'New Jersey'", "'Pennsylvania'", "'Delaware'", "'Maryland'", "'Virginia'",
        "'West Virginia'", "'Ohio'", "'Kentucky'", "'Michigan'", "'Tennessee'", "'North Carolina'",
        "'South Carolina'", "'Alabama'", "'Georgia'", "'Wisconsin'", "'Minnesota'", "'Indiana'",
        "'Washington'", "'Oregon'", "'California'", "'Idaho'", "'Montana'"],
        sldName: 'hemlock_woolly_adelgid.sld'
    },
    {
        species: 'Winter Moth',
        base: 50,
        layerName: 'gdd:agdd_50f',
        bounds: [
            -79.7779643313124,
            40.4766897394137,
            -66.9509145889486,
            47.4722109120521
        ],
        stateNames: ["'New York'", "'Connecticut'", "'New Hampshire'", "'Vermont'", "'Maine'", "'Massachusetts'"],
        sldName: 'winter_moth.sld'
    },
    {
        species: 'Lilac Borer',
        base: 50,
        layerName: 'gdd:agdd_50f',
        bounds: [
            -125.0208333,
            24.0625,
            -66.4791667000001,
            49.9375
        ],
        stateNames: [],
        sldName: 'lilac_borer.sld'
    },
    {
        species: 'Eastern Tent Caterpillar',
        lowerThreshold: 50,
        layerName: 'custom',
        startMonthDay: '03-01',
        agddMethod: 'simple',
        bounds: [
            -109.0712618165,
            24.5049877850162,
            -66.9509145889486,
            49.4107288273616
        ],
        stateNames: [],
        rangeShpFilePath: '/var/www/data-site/files/npn-geo-services/shape_files/eastern_tent_caterpillar_range/states.shp',
        sldName: 'eastern_tent_caterpillar.sld'
    },
    {
        species: 'Asian Longhorned Beetle',
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
        stateNames: ["'Ohio'", "'Pennsylvania'", "'New York'", "'Connecticut'", "'Rhode Island'", "'Massachusetts'"],
        rangeShpFilePath: '/var/www/data-site/files/npn-geo-services/shape_files/asian_longhorned_beetle_range/states.shp',
        sldName: 'asian_longhorned_beetle.sld'
    }
];

module.exports.pests = pests;