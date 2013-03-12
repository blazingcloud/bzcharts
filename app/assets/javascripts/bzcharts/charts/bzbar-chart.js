var BZBarChart = function (width, height) {
  this.init(width, height);
};
BZBarChart.prototype = new BZChart();

BZBarChart.prototype.update = function(data) {
  var self = this;

  var groups = data.map(function(d) { return d.values.map('x'); }).flatten().unique();
  var bars = {};
  data.map(function(d) {
    d.values.each(function(v) {
      if (!bars[v.x]) {
        bars[v.x] = [];
      }
      bars[v.x].push({
        x: v.x,
        y: v.y,
        data: d
      });
    });
  });

  self.x.d3scale = d3.scale.ordinal().domain(groups).rangeRoundBands([0, self.options.width], .2);

  self.y.d3scale = d3.scale.linear().range([self.options.height, 0]);
  self.y.scale().domain([0, d3.max(d3.values(bars).flatten().map('y'))]);

  var xBands = d3.scale.ordinal()
    .domain(data.map(function(d, i) { return i; }))
    .rangeRoundBands([0, self.x.scale().rangeBand()], .1);

  self.x.d3axis = undefined;
  self.y.d3axis = undefined;

  self.frame.select('.y.axis').call(self.y.axis());
  self.frame.select('.x.axis').call(self.x.axis());

  var group = self.chart
    .selectAll(".chart-component-group")
    .data(groups, function(d) { return Math.random(); });

  group.enter()
    .append("g");

  group.exit()
    .remove();

  group.attr("class", function(d) { return ['chart-component-group', 'bargroup', bars[d]['class']].compact().join(' '); } )
    .attr("transform", function(d) { return "translate(" + self.x.scale()(d) + ", 0)"; });

  var rect = group.selectAll(".chart-component")
    .data(function(d) { return bars[d]; }, function(d) { return Math.random(); });

  rect.enter()
    .append("rect");

  rect.exit()
    .remove();

  rect
    .attr("class", function(d) { return ['chart-component', 'data-bar', d['class']].compact().join(' '); })
    .attr("width", xBands.rangeBand())
    .attr("x", function(d, i) { return xBands(i); })
    .attr("y", function(d) { return self.y.scale()(d.y); })
    .attr("height", function(d) { return self.options.height - self.y.scale()(d.y); })
    .attr("style", function(d) { return self.style(d.data.style); });


};

BZBarChart.prototype.build = function() {
  var self = this;

  self.chart = self.frame.append("g").attr("class", "databars");

  self.axittach(self.frame);

  return self;
};
