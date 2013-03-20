var BZPieChart = function (width, height) {
  this.init(width, height);
};
BZPieChart.prototype = new oBZChart();

BZPieChart.prototype.update = function(data) {
  var self = this;

  data.each(function(dataset) {

    var svg = self.frame
      .append('g')
      .attr("transform", "translate(" + self.options.width / 2 + "," + self.options.height / 2 + ")");

    var radius = Math.min(self.options.width, self.options.height) / 2;

    var arc = d3.svg.arc().outerRadius(radius).innerRadius(0);

    var pie = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d.y; });

    var section = svg.append("g").attr("class", 'chart-component-group datarcs')
      .selectAll(".data-arc")
      .data(pie(dataset.values), function(d) { return d.data.x + '=' + d.data.y; });

    section.enter()
      .append("path")
      .attr("class", function(d, i) { return ['chart-component', 'section-' + i, 'data-arc', d.data['class']].compact().join(' '); })
      .attr("d", function(d) { return arc(d); })
      .attr("style", function(d, i) { return self.style(dataset.values[i].style); });

    var labels = svg.append("g").attr("class", "arclabels")
      .selectAll(".arc-label")
      .data(pie(dataset.values));

    labels.enter()
      .append("g");

    labels.append('text')
      .attr('class', function(d, i) { return 'chart-component section-' + i + ' arc-label x' })
      .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
      .attr("dy", "-.35em")
      .style("text-anchor", "middle")
      .text(function(d) { return self.x.formatter()(d.data.x); });

    labels.append('text')
      .attr('class', function(d, i) { return 'chart-component section-' + i + ' arc-label y' })
      .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
      .attr("dy", ".60em")
      .style("text-anchor", "middle")
      .text(function(d) { return self.y.formatter()(d.data.y); });


  });

};

BZPieChart.prototype.build = function() {
  var self = this;
  return self;
};