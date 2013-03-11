function BZChart() {}

BZChart.prototype = {
  init: function(width, height) {
    var self = this;

    self.width    = width;
    self.height   = height;
    self.margin   = { top: 10, bottom: 50, left: 40, right: 50 };
    self.date     = d3.time.format("%Y-%m-%d").parse;

    self.axisFunctions = {};

    function bfunc(xis) {
      if (!self.axisFunctions[xis]) {

        function model()       { return self.model[xis]; }
        function values()      { return self.model.data.map('values').flatten(); }
        function zelf()         { return self[xis]; }
        function dateScale()   { return model().scale == 'date'; }
        function linearScale() { return model().scale == 'linear'; }

        self.axisFunctions[xis] = {
          value: function value(v) { return dateScale() ? self.date(v[xis]) : v[xis]; },
          extent: function() { return d3.extent(values(), function(d) { return zelf().value(d); }); },
          scale: function scale() {
            if (!zelf().d3scale) {
              if (dateScale()) {
                zelf().d3scale = d3.time.scale().domain(zelf().extent());
              } else if (linearScale()) {
                zelf().d3scale = d3.scale.linear().domain(d3.extent(zelf().extent()));
              } else {
                zelf().d3scale = d3.scale.ordinal();
              }
            }
            return zelf().d3scale;
          },
          newAxis: function() {
            var orient = model().orientation || (xis == 'x' ? 'bottom' : 'left'); //xxx come back to this
            var axis = d3.svg.axis().scale(zelf().scale()).orient(orient).tickSize(model().ticks ? 5 : 0, 0);
            var format = model().format;
            if (dateScale()) {
              var formatter = d3.time.format(format && format != 'none' ? format : "%Y-%m-%d");
              axis.ticks(d3.time.days, 1).tickFormat((format == 'none') ? '' : function(d) { return (typeof(d) == "string") ? formatter(new Date(Date.parse(d))) : formatter(d); });
            } else if (format) {
              axis.ticks(values().map(xis).unique().length).tickFormat((format == 'none') ? '' : d3.format(format));
            }
            return axis;
          },
          axis: function() {
            if (!zelf().d3axis) {
              zelf().d3axis = zelf().newAxis();
            }
            return zelf().d3axis;
          }
        }
      }

      return self.axisFunctions[xis];
    }

    self.x = bfunc('x');
    self.y = bfunc('y');
  },

  style: function(style, exclude) { var css = ""; for (var k in style) { if (!exclude || exclude.indexOf(k) < 0) { css += k + ':' + style[k] + ';' } } return css; },

  render: function(selector, model) {
    var self = this;

    self.model = model;
    self.build(selector);
  },

  svg: function(selector, horizontal, vertical) {
    var self = this;

    var svg = d3.select(selector)
      .append("svg")
      .attr("width", self.width + self.margin.left + self.margin.right)
      .attr("height", self.height + self.margin.top + self.margin.bottom)
      .append("g")
      .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

    var grid = svg.append("g").attr("class", "gridlines");

    if (horizontal) {
      grid.append("g").attr("class", "y gridline")
        .call(self.y.newAxis().tickFormat("").tickSize(-self.width, 1));
    }

    if (vertical) {
      grid.append("g").attr("class", "x gridline")
        .attr("transform", "translate(0," + self.height + ")")
        .call(self.x.newAxis().tickFormat("").tickSize(-self.height, 1));
    }

    return svg;
  },

  axittach: function(svg) {
    var self = this;

    var lines = svg.append("g").attr('class', 'axislines');

    lines.append("g")
      .attr('class', 'x axis')
      .attr("transform", "translate(0," + self.height + ")")
      .attr('style', self.style(self.model.x.style))
      .call(self.x.axis());

    if (self.model.x.label) {
      lines.append("text")
        .attr('class', 'axis-label')
        .attr("dy", "-0.5em")
        .attr("transform", "translate(" + self.width + "," + self.height + ")")
        .attr('style', "text-anchor:end;" + self.style(self.model.x.style))
        .text(self.model.x.label);
    }

    lines.append("g")
      .attr("class", "y axis")
      .attr('style', self.style(self.model.y.style))
      .call(self.y.axis());

    if (self.model.y.label) {
      lines.append("text")
        .attr('class', 'axis-label')
        .attr("transform", "rotate(-90)")
        .attr("dy", "1em")
        .attr('style', "text-anchor:end;" + self.style(self.model.y.style))
        .text(self.model.y.label);
    }
  },

  end:null

};

window.bzcharts = {
  render: function(selector, width, height, chart_name, chart_type) {
    d3.json('/charts/data/' + chart_name + '.json', function(chart_data) {
      if (chart_type == 'pie') {
        return new BZPieChart(width, height).render(selector, chart_data);
      } else if (chart_type == 'bar') {
        return new BZBarChart(width, height).render(selector, chart_data);
      } else {
        return new BZLineChart(width, height).render(selector, chart_data);
      }
    });
  }
};


