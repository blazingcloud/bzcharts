var BZLineChart = function (options) {
  var self = this;

  self.init(options);

  self.renderers = {
    line: d3.svg.line()
      .x(function(d)  { return self.x.scale()(self.x.value(d)); })
      .y(function(d)  { return self.y.scale()(self.y.value(d)); }),
    area: d3.svg.area()
      .x(function(d)  { return self.x.scale()(self.x.value(d)); })
      .y0(self.options.height)
      .y1(function(d) { return self.y.scale()(self.y.value(d)); })
  };
};

BZLineChart.prototype = new BZChart();

BZLineChart.prototype.update = function(data) {
  var self = this;

  self.frame.select('.y.axis').call(self.y.axis(true));
  self.frame.select('.x.axis').call(self.x.axis(true));

  var lines = self.chart
    .selectAll(".chart-component")
    .data(data, function(d) { return Math.random(); });

  lines.enter()
    .append("path")
    .attr("class", function(d) { return ['chart-component', 'data-' + (d.type || 'line'), d['class']].compact().join(' ') })
    .attr("d", function(d) { return self.renderers[d.type](d.values); })
    .attr("style", function(d) { return self.style(d.style, d.type == 'line' ? ['fill'] : null); });

  lines.exit()
    .remove();

};

BZLineChart.prototype.build = function() {
  var self = this;

  self.chart = self.frame.append("g").attr("class", "datalines");
  self.axittach(self.frame);

  return self;
};