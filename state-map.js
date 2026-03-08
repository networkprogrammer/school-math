(async function () {
  // container must exist: <div id="us-map"></div>
  const container = document.getElementById('us-map');
  if (!container) return;

  // fetch scores and topojson in parallel
  const [scoresResp, usTopo] = await Promise.all([
    fetch('/api/state-scores').then(r => r.ok ? r.json() : {}).catch(() => ({})),
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json').then(r => r.json())
  ]);

  const scores = scoresResp || {};

  // determine dynamic domain based on data
  const numericScores = Object.values(scores).map(s => Number(s)).filter(s => !isNaN(s));
  const maxFound = numericScores.length ? Math.max(...numericScores) : 10;
  const domainMax = Math.max(10, maxFound);

  // mapping FIPS -> postal code
  const fipsToState = {
    "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC","12":"FL",
    "13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME",
    "24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH",
    "34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI",
    "45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY"
  };

  const width = container.clientWidth || 960;
  const height = 480;

  const svg = d3.select(container).append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('width', '100%')
    .style('height', 'auto');

  const projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
  const path = d3.geoPath().projection(projection);
  const states = topojson.feature(usTopo, usTopo.objects.states).features;

  const color = d3.scaleSequential().domain([0, domainMax]).interpolator(d3.interpolateYlOrRd);

  const tooltip = d3.select(container).append('div').attr('class', 'us-map-tooltip')
    .style('position','absolute').style('pointer-events','none').style('display','none')
    .style('background','rgba(0,0,0,0.75)').style('color','#fff').style('padding','6px 8px').style('border-radius','4px').style('font-size','13px');

  svg.append('g')
    .selectAll('path')
    .data(states)
    .join('path')
    .attr('d', path)
    .attr('fill', d => {
      const fips = String(d.id).padStart(2,'0');
      const code = fipsToState[fips];
      const sc = code ? scores[code] : undefined;
      return (sc !== undefined && !isNaN(sc)) ? color(sc) : '#efefef';
    })
    .attr('stroke', '#fff').attr('stroke-width', 0.6)
    .on('mousemove', (event, d) => {
      const fips = String(d.id).padStart(2,'0');
      const code = fipsToState[fips];
      const sc = (code && scores[code] !== undefined) ? scores[code] : 'No score';
      tooltip.style('display','block')
        .style('left',(event.pageX + 8)+'px').style('top',(event.pageY+8)+'px')
        .text(`${code || 'N/A'}: ${sc}`);
    })
    .on('mouseout', () => tooltip.style('display','none'));

  // small legend
  const legendWidth = 220;
  const defs = svg.append('defs');
  const linearGradient = defs.append('linearGradient').attr('id','legend-gradient');
  linearGradient.append('stop').attr('offset','0%').attr('stop-color', d3.interpolateYlOrRd(0));
  linearGradient.append('stop').attr('offset','100%').attr('stop-color', d3.interpolateYlOrRd(1));

  const legend = svg.append('g').attr('transform', `translate(${width - legendWidth - 20}, ${height - 60})`);
  legend.append('rect').attr('width', legendWidth).attr('height', 12).style('fill','url(#legend-gradient)').style('stroke','#ccc');
  const legendScale = d3.scaleLinear().domain([0,domainMax]).range([0, legendWidth]);
  const legendAxis = d3.axisBottom(legendScale).ticks(5).tickSize(6).tickFormat(d => String(d));
  legend.append('g').attr('transform', 'translate(0,12)').call(legendAxis).select('.domain').remove();
})();
