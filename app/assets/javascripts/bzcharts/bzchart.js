function BZChart() {}

BZChart.prototype = {
  style: function(style, exclude) { var css = ""; for (var k in style) { if (!exclude || exclude.indexOf(k) < 0) { css += k + ':' + style[k] + ';' } } return css; },
  date: d3.time.format("%Y-%m-%d").parse,

  init: function(options) {
    var self = this;

    self.options = options;
    if (!self.options.margin) {
      self.options.margin = { top: 10, bottom: 50, left: 40, right: 50 };
    }

    self.axisFunctions = {};

    function bfunc(xis) {
      if (!self.axisFunctions[xis]) {

        var defaults = {
          x: {
            range: [0, self.options.width],
            orientation: 'bottom'
          },
          y: {
            range: [self.options.height, 0],
            orientation: 'left'
          }
        };

        function zelf()        { return self[xis]; }
        function model()       { return self.options[xis]; }
        function values()      { return self.data.map('values').flatten(); }

        function dateScale()   { return model().scale == 'date'; }
        function linearScale() { return model().scale == 'linear'; }

        function sorter(a, b) { return a - b; }

        self.axisFunctions[xis] = {
          values: function() { return values().map(xis); },
          value:  function value(v) { return dateScale() ? self.date(v[xis]) : v[xis]; },
          extent: function() { return d3.extent(values(), function(d) { return zelf().value(d); }).sort(sorter); },
          scale:  function scale(rescale) {
            if (!zelf().d3scale || rescale) {
              if (dateScale()) {
                zelf().d3scale = d3.time.scale().domain(zelf().extent()).range(defaults[xis].range);
              } else if (linearScale()) {
                var extent = zelf().extent();
                zelf().d3scale = d3.scale.linear().domain([extent[0] * 0.75, extent[1] * 1.25]).range(defaults[xis].range);
              } else {
                zelf().d3scale = d3.scale.ordinal()
                  .domain(zelf().values().unique().sort(sorter))
                  .rangePoints(defaults[xis].range)
                ;
              }
            }
            return zelf().d3scale;
          },
          formatter: function() {
            var format = model().format;
            if (format == 'none') { return function() { return ''; } }
            if (dateScale()) {
              var formatter = d3.time.format(format ? format : "%Y-%m-%d");
              return function(d) {
                return (typeof(d) == "string") ? formatter(new Date(Date.parse(d))) : formatter(d);
              };
            } else if (linearScale()) {
              return d3.format(format);
            } else {
              return function(d) { return d; }
            }
          },
          newAxis: function(rescale) {
            var orient = model().orientation || defaults[xis].orientation;
            var axis = d3.svg.axis().scale(zelf().scale(rescale)).orient(orient).tickSize(model().ticks ? 5 : 0, 0);
            if (dateScale()) {
              axis.ticks(d3.time[model().tickscale || 'days'], 1).tickFormat(zelf().formatter());
            } else {
              axis.ticks(zelf().values().unique().length).tickFormat(zelf().formatter());
            }
            return axis;
          },
          axis: function(rescale) {
            if (!zelf().d3axis || rescale) {
              zelf().d3axis = zelf().newAxis(rescale);
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

  svg: function() {
    var self = this;

    var svg = d3.select(self.options.selector)
      .append("svg")
      .attr("width", self.options.width + self.options.margin.left + self.options.margin.right)
      .attr("height", self.options.height + self.options.margin.top + self.options.margin.bottom)
      .append("g")
      .attr("transform", "translate(" + self.options.margin.left + "," + self.options.margin.top + ")");

    var grid = svg.append("g").attr("class", "gridlines");

    if (self.options.y.grid) {
      grid.append("g").attr("class", "y gridline")
        .call(self.y.newAxis().tickFormat("").tickSubdivide(self.options.y.minor || 0).tickSize(-self.options.width));
    }

    if (self.options.x.grid) {
      grid.append("g").attr("class", "x gridline")
        .attr("transform", "translate(0," + self.options.height + ")")
        .call(self.x.newAxis().tickFormat("").tickSubdivide(self.options.x.minor || 0).tickSize(-self.options.height));
    }

    return svg;
  },

  axittach: function(svg) {
    var self = this;

    var lines = svg.append("g").attr('class', 'axislines');

    lines.append("g")
      .attr('class', 'x axis')
      .attr("transform", "translate(0," + self.options.height + ")")
      .attr('style', "z-index:10;" + self.style(self.options.x.style))
      .call(self.x.axis());

    if (self.options.x.label) {
      lines.append("text")
        .attr('class', 'axis-label')
        .attr("dy", "-0.5em")
        .attr("transform", "translate(" + self.options.width + "," + self.options.height + ")")
        .attr('style', "z-index:10;text-anchor:end;" + self.style(self.options.x.style))
        .text(self.options.x.label);
    }

    lines.append("g")
      .attr("class", "y axis")
      .attr('style', "z-index:10;" + self.style(self.options.y.style))
      .call(self.y.axis());

    if (self.options.y.label) {
      lines.append("text")
        .attr('class', 'axis-label')
        .attr("transform", "rotate(-90)")
        .attr("dy", "1em")
        .attr('style', "z-index:10;text-anchor:end;" + self.style(self.options.y.style))
        .text(self.options.y.label);
    }
  },

  render: function(data) {
    var self = this;

    self.data = self.data ? self.data.concat(data) : data;

    if (!self.frame) {
      self.frame = self.svg();
      self.build();
    }

    self.update(self.data);

    return self;
  },

  end:null

};

window.bzcharts = {
  charts: {},
  render: function(chartName, options) {
    var chart;
    if (options.type == 'pie') {
      chart = new BZPieChart(options);
    } else if (options.type == 'bar') {
      chart = new BZBarChart(options);
    } else {
      chart = new BZLineChart(options);
    }

    d3.json('/charts/data/' + chartName + '.json' + window.location.search, function(data) {
      chart.render(data);
    });

    window.bzcharts.charts[chartName] = chart;

    return chart;
  }
};


