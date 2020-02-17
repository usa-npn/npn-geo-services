const D3Node = require('d3-node')
const d3 = require('d3')
var parseString = require('xml2js').parseString;
const fs = require('fs');
const svg2png = require('svg2png');

function getSld(sldName) {
    return new Promise((resolve, reject) => {
        //https://geoserver.usanpn.org/geoserver/rest/workspaces/gdd/styles/agdd.sld    
        let store = 'gdd';
        if(sldName.includes('leaf') || sldName.includes('bloom')) {
            store = 'si-x';
        }
        const https = require('https')
        const options = {
        hostname: 'geoserver.usanpn.org',
        port: 443,
        path: `/geoserver/rest/workspaces/${store}/styles/${sldName}.sld`,
        method: 'GET'
        }

        const req = https.request(options, res => {
            console.log(`statusCode: ${res.statusCode}`)
            var xml = '';
            res.on('data', d => {
                xml += d;
            })

            res.on('end', function() {
                resolve(xml);
            });
        })

        req.on('error', error => {
            console.error(error);
            reject(error);
        })

        req.end()
    })
}

function outputFiles(outputName, d3n) {
    return new Promise((resolve, reject) => {
        let outputPath = '/var/www/data-site/files/npn-geo-services/legends/'
        if (d3n.options.canvas) {
            const canvas = d3n.options.canvas;
            console.log('canvas output...', canvas);
            canvas.pngStream().pipe(fs.createWriteStream(outputPath+outputName+'.png'));
            return;
          }
        
          fs.writeFile(outputPath+outputName+'.html', d3n.html(), function () {
            // console.log('>> Done. Open "./'+outputName+'.html" in a web browser');
          });
        
          var svgBuffer = new Buffer(d3n.svgString(), 'utf-8');
          svg2png(svgBuffer)
            .then(buffer => fs.writeFile(outputPath+outputName+'.png', buffer, ()=>{}))
            .catch(e => {
                console.error('ERR:', e);
                reject(e);
            })
            .then(err => {
                // console.log('>> Exported: "./'+outputName+'.png"');
                resolve(outputName+'.png');
            });
    });
};


async function drawLegend(sldName, title, data) {

    const styles = `
    .bar rect {
    fill: steelblue;
    }
    .bar text {
    fill: #fff;
    font: 10px sans-serif;
    }`

    var options = {
        svgStyles: styles,
        d3Module: d3
    }
    
    let d3n = new D3Node(options);
    
    let svgWidth = 1080;
    let svgHeight = 170;
    let margin = {top: 0, right: 4, bottom: 0, left: 4}
    let svg = d3n.createSVG(svgWidth, svgHeight)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    
    let width = 1000//parseFloat(svg.style('width').replace('px', ''))
    let height = 500//parseFloat(svg.style('height').replace('px', ''))
    let mid_idx = Math.floor(data.length / 2)
    let cell_width = width / data.length
    let cell_height = 30
    let top_pad = 20;
    let left_pad = 30;

    //create semitransparent rounded rectangle to hold legend
    svg.append('g')
            .append('rect')
            // .attr("x", 0)
		    // .attr("y", 0)
            .attr("rx", 20)
            .attr("ry", 20)
            .style("opacity", 0.7)
            .attr('width', '99%')
            .attr('height', '100%')
            .style("stroke", '#000')
            .attr('fill', '#fff');

    // draw the colored squares
    let g = svg.append('g'), cell = g.selectAll('g.cell')
        .data(data)
        .enter()
        .append('g')
        .attr('class', (d, i) => {
            return 'cell' +
                ((i === 0) ? ' first' :
                    ((i === mid_idx) ? ' middle' :
                        ((i === data.length - 1) ? ' last' : '')));
        })
        .attr('transform', function (d, i) { return 'translate(' + (i * cell_width + left_pad) + ',' + top_pad + ')'; })
        .append('rect')
        .attr('height', cell_height)
        .attr('width', cell_width)
        .style('stroke', 'black')
        .style('stroke-width', '1px')
        .style('fill', function (d, i) { 
            return d['$'].color; 
        });

        // make the tick marks for agdd
        if (true) {
            let every = 50;//legend.ldef.legend_delimiter_every;
            let running_total = 0;
            let separators = data.map(function (d, i) {
                if ((i + 1) === data.length) {
                    return true;
                }
                running_total += (data[i + 1].quantity - data[i].quantity);
                if (running_total >= every) {
                    running_total = 0;
                    return true;
                }
                return false;
            });
            let top_bottom = [(cell_width + 1), cell_height, (cell_width + 1), cell_height].join(','); //{ stroke-dasharray: $w,$h,$w,$h }
            let top_right_bottom = [((cell_width * 2) + cell_height), cell_height].join(','); //{ stroke-dasharray: (($w*2)+$h),$h }
            let top_left_bottom = [(cell_width + 1), cell_height, (cell_width + cell_height + 1), 0].join(','); ////{ stroke-dasharray: $w,$h,($w+$h),0 }
            console.debug('WmsMapLegend.legend_delimiter_every', every);
            cell.style('stroke-dasharray', function (d, i) {
                if (i === 0) {
                    return separators[i] ? undefined : top_left_bottom;
                }
                return separators[i] ? top_right_bottom : top_bottom;
            })
                // top_bottom removes the left/right borders which leaves a little whitespace
                // which looks odd so in cases where there is no right border increase a cell's width
                // by 1px to cover that gap
                .attr('width', function (d, i) {
                    var w = parseFloat(d3.select(this).attr('width'));
                    if (i === 0) {
                        return separators[i] ? w : w + 1;
                    }
                    return separators[i] ? w : w + 1;
                });
            g.selectAll('g.cell').append('line')
                .attr('stroke', function (d, i) { return separators[i] ? 'black' : 'none'; })
                .attr('stroke-width', 2)
                .attr('x1', cell_width - 1)
                .attr('x2', cell_width - 1)
                .attr('y1', 0)
                .attr('y2', cell_height);
        }

        //what is this
        let tick_length = 5, tick_padding = 3;
        function label_cell(cell, label, anchor) {
            let tick_start = (top_pad-22 + cell_height + tick_padding);
            cell.append('line')
                .attr('x1', (cell_width / 2))
                .attr('y1', tick_start)
                .attr('x2', (cell_width / 2))
                .attr('y2', tick_start + tick_length)
                .attr('stroke', 'black')
                .attr('stroke-width', '2');
            cell.append('text')
                .attr("font-family", "sans-serif")
                .attr('dx', (cell_width / 2))
                .attr('dy', '4em' /*cell_height+tick_length+(2*tick_padding)*/) // need to know line height of text
                .style('text-anchor', anchor)
                .text(label);
        }
        label_cell(svg.select('g.cell.first'), data[0]['$'].label, 'start');
        label_cell(svg.select('g.cell.middle'), data[mid_idx]['$'].label, 'middle');
        label_cell(svg.select('g.cell.last'), data[data.length - 1]['$'].label, 'end');

        //draw the title
        let legend_title = title; //todo get from sld or mapping

        if(!!legend_title) {
            svg.append('g').append('text').attr('dx', 5)
                .attr('dy', 100 + top_pad)
                .attr("font-family", "sans-serif")
                .attr('font-size', '18px')
                .attr('text-anchor', 'right').text(legend_title)
                .attr('transform', 'translate(' + left_pad + ',' + 0 + ')');
        }

        //draw usanpn text
        svg.append('g').append('text').attr('dx', 5)
            .attr('dy', (!!legend_title ? 118 : 85) + top_pad)
            .attr("font-family", "sans-serif")
            .attr('font-size', '11px')
            .attr('text-anchor', 'right').text('USA National Phenology Network, www.usanpn.org')
            .attr('transform', 'translate(' + left_pad + ',' + 0 + ')');

        //output the html and png
        let outputPath = await outputFiles(sldName, d3n);
        return outputPath;
}

//get sld
function getLegend(sldName) {
    return new Promise(async (resolve, reject) => {
        let sld = await getSld(sldName);
        parseString(sld, (err, xml) => {
            let title = xml['StyledLayerDescriptor']['NamedLayer'][0]['UserStyle'][0]['Title'][0];
            let colorMap = xml['StyledLayerDescriptor']['NamedLayer'][0]['UserStyle'][0]['FeatureTypeStyle'][0]['Rule'][0]['RasterSymbolizer'][0]['ColorMap'][0]['ColorMapEntry']
            //remove -9999 opacity cell
            colorMap.shift();
            let outputPath = drawLegend(sldName, title,colorMap);
            resolve(outputPath);
        });
    });
}

async function drawSldLegend(req, res) {
    try {
        let sldName = req.swagger.params['sldName'].value;

        let outputPath = await getLegend(sldName);

        res.status(200).send({
            'legendPath' : `${process.env.PROTOCOL}://${process.env.SERVICES_HOST}:${process.env.PORT}/` + outputPath
        });
    } catch(error) {
        res.status(500).json({"message": error.message});
    }
}

module.exports.drawSldLegend = drawSldLegend;
