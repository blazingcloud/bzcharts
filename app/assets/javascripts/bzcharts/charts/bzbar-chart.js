var BZBarChart = function (width, height) {
  this.init(width, height);
};
BZBarChart.prototype = new BZChart();

BZBarChart.prototype.build = function(selector) {
  var self = this;

  var groups = self.model.data.map(function(d) { return d.values.map('x'); }).flatten().unique();
  var bars = {};
  self.model.data.map("values").flatten().map(function(d) {
    if (!bars[d.x]) {
      bars[d.x] = [];
    }
    bars[d.x].push(d);
  });

  self.x.d3scale = d3.scale.ordinal().domain(groups).rangeRoundBands([0, self.width], .2);

  self.y.d3scale = d3.scale.linear().range([self.height, 0]);
  self.y.scale().domain([0, d3.max(d3.values(bars).flatten().map('y'))]);

  var xBands = d3.scale.ordinal()
    .domain(self.model.data.map(function(d, i) { return i; }))
    .rangeRoundBands([0, self.x.scale().rangeBand()], .1);

  var svg = self.svg(selector, self.model.y.grid);

  var group = svg.append("g").attr("class", "databars")
    .selectAll(".databars")
    .data(groups)
    .enter().append("g")
    .attr("class", function(d) { return ['chart-component-group', 'bargroup', self.model.data[d]['class']].compact().join(' '); } )
    .attr("transform", function(d) { return "translate(" + self.x.scale()(d) + ", 0)"; });

  group.selectAll("rect")
    .data(function(d) { return bars[d]; })
    .enter().append("rect")
    .attr("class", function(d) { return ['chart-component', 'data-bar', d['class']].compact().join(' '); })
    .attr("width", xBands.rangeBand())
    .attr("x", function(d, i) { return xBands(i); })
    .attr("y", function(d) { return self.y.scale()(d.y); })
    .attr("height", function(d) { return self.height - self.y.scale()(d.y); })
    .attr("style", function(d) { return self.style(d.style); })
  ;

  self.axittach(svg);

  return svg;

};
