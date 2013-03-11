var BZLineChart = function (width, height) {
  this.init(width, height);
};
BZLineChart.prototype = new BZChart();

BZLineChart.prototype.build = function(selector) {
  var self = this;

  var renderers = {
    line: d3.svg.line()
      .x(function(d)  { return self.x.scale()(self.x.value(d)); })
      .y(function(d)  { return self.y.scale()(self.y.value(d)); }),
    area: d3.svg.area()
      .x(function(d)  { return self.x.scale()(self.x.value(d)); })
      .y0(self.height)
      .y1(function(d) { return self.y.scale()(self.y.value(d)); })
  };

  var svg = self.svg(selector, self.model.y.grid, self.model.x.grid);

  svg.append("g").attr("class", "datalines")
    .selectAll("datalines")
    .data(self.model.data)
    .enter()
    .append("path")
    .attr("class", function(d) { return ['chart-component', 'data-' + (d.type || 'line'), d['class']].compact().join(' ') })
    .attr("d", function(d) { return renderers[d.type](d.values); })
    .attr("style", function(d) { return self.style(d.style, d.type == 'line' ? ['fill'] : null); })
  ;

  self.axittach(svg);

  return svg;
};