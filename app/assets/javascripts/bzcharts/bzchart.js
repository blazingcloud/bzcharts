if (!window.bzcharts) { window.bzcharts = {}; }

//TODO: have default options for missing options
//TODO: refactor this huge hunk of code into smaller pieces
//TODO: allow streams to have their own scales (if required)

function BZChart(name, options) {
  var self = this;
  window.bzcharts[name] = self.init(name, options);
  return self;
}

BZChart.prototype = {

  init: function(name, options) {
    var self = this;

    self.name = name;
    self.streams = [];

    self.layout(options);

    return self;
  },

  update: function (ident, type, stream, callback) {
    var self = this;

    if (typeof(stream) == 'string') {
      d3.json(stream, function(data) {
        var updated = self.update(ident, type, data);
        if (callback) {
          updated = callback.call(updated, ident, type, stream)
        }
        return updated;
      });
    } else {
      if (ident && type && stream) {
        self.streams.remove(function(d) { return d.ident == ident });
        self.streams.add({
          ident: ident,
          type: type,
          values: stream
        });
      } else if (ident && type) {
        self.streams.each(function(s) {
          if (s.ident == ident) {
            s.type = type;
          }
        });
      } else if (ident && stream) {
        self.streams.each(function(s) {
          if (s.ident == ident) {
            s.values = stream;
          }
        });
      } else if (ident) {
        self.streams.remove(function(d) { return d.ident == ident });
      }
    }

    var values = Object.values(self.streams).map('values').flatten();

    self.colors = self.util.colors([values.map('x'), values.map('y')].flatten().unique());

    self.x.rescale(values);
    self.y.rescale(values);
    self.grid.x.rescale(values);
    self.grid.y.rescale(values);

    var frame = d3.select(self.selector).select('svg.chart-frame');
    frame.select('g.x.axis').call(self.x.axis);
    frame.select('g.y.axis').call(self.y.axis);
    frame.select('g.x.grid').call(self.grid.x.axis);
    frame.select('g.y.grid').call(self.grid.y.axis);

    return self.render();
  },

  layout: function (options) {
    var self = this;

    self.selector = options.selector || '#bzchart';

    self.transitions = options.transitions || {
      duration: 1500,
      delays: {
        areas: 100,
        bars: 300,
        lines: 400,
        pies: 300
      },
      ease: 'cubic-in-out'
    };

    d3.select(self.selector)
      .classed('bzchart', true);

    self.layers = {};
    self.components = {};

    self.frame = {
      height: options.layout.height,
      width: options.layout.width,
      margin: options.layout.margin
    };

    self.x = new BZAxis(options.x);
    self.y = new BZAxis(options.y);

    self.grid = {
      x: new BZAxis(options.x),
      y: new BZAxis(options.y)
    };

    self.grid.x.axis
      .tickFormat('')
      .tickSubdivide(options.y.subticks || 0);

    self.grid.y.axis
      .tickFormat('')
      .tickSubdivide(options.y.subticks || 0);

    self.layers.frame = d3.select(self.selector)
      .append('svg')
      .attr('class', 'chart-frame');

    self.layers.chart = self.layers.frame
      .append('g')
      .attr('class', 'chart-content');

    self.layers.grid = self.layers.chart
      .append('g')
      .attr('class', 'chart-grid');

    self.layers.grid
      .append('g')
      .attr('class', 'x grid');

    self.layers.grid
      .append('g')
      .attr('class', 'y grid');

    self.layers.data = self.layers.chart
      .append('g')
      .attr('class', 'chart-data');

    self.components.areas = self.layers.data
      .append('g')
      .attr('class', 'areas');

    self.components.bars = self.layers.data
      .append('g')
      .attr('class', 'bars');

    self.components.lines = self.layers.data
      .append('g')
      .attr('class', 'lines');

    self.components.pies = self.layers.data
      .append('g')
      .attr('class', 'pies');

    self.layers.axis = self.layers.chart
      .append('g')
      .attr('class', 'chart-axes');

    var xaxis = self.layers.axis
      .append('g')
      .attr('class', self.util.classes('x', 'axis'));

    if (options.x.label && options.x.label != 'none') {
      xaxis
        .append('text')
        .attr('class', 'axis-label')
        .attr('dy', '-0.5em')
        .text(options.x.label);
    }

    var yaxis = self.layers.axis
      .append('g')
      .attr('class', self.util.classes('y', 'axis'));

    if (options.y.label && options.y.label != 'none') {
      yaxis
        .append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('dy', '1em')
        .text(options.y.label);
    }

    return self.resize();
  },

  resize: function () {
    var self = this;

    self.x.range([0, self.frame.width]);
    self.y.range([self.frame.height, 0]);

    self.grid.x.range([0, self.frame.width]);
    self.grid.x.axis.tickSize(-self.frame.height);

    self.grid.y.range([self.frame.height, 0]);
    self.grid.y.axis.tickSize(-self.frame.width);

    var frame = d3.select(self.selector).select('svg.chart-frame');

    frame
      .attr('width', self.frame.width + self.frame.margin.left + self.frame.margin.right)
      .attr('height', self.frame.height + self.frame.margin.top + self.frame.margin.bottom)
    ;

    frame
      .select('g.chart-content')
      .attr('transform', 'translate(' + self.frame.margin.left + ',' + self.frame.margin.top + ')')
    ;

    frame
      .select('g.x.axis')
      .attr('transform', 'translate(0,' + self.frame.height + ')')
      .select('text.axis-label')
      .attr('transform', 'translate(' + self.frame.width + ',' + 0 + ')')
    ;

    frame
      .select('g.x.grid')
      .attr('transform', 'translate(0,' + self.frame.height + ')')
    ;

    return self.update();
  },

  renderlines: function(data) {
    var self = this;
    var line = d3.svg.line()
      .x(function (d) {
        return self.x.scale == 'date' ? self.x.d3scale(self.util.date(d.x)) : self.x.d3scale(d.x);
      })
      .y(function (d) {
        return self.y.scale == 'date' ? self.y.d3scale(self.util.date(d.y)) : self.y.d3scale(d.y);
      });

    var lines = self.components.lines
      .selectAll('.chart-component')
      .data(data, function (d) {
        return d.ident || d.values.map(function (k, v) { return k + ':' + v; }).join(',');
      });

    lines
      .enter()
      .append('path')
      .style('stroke', function(d) { return self.colors(d.ident); })
      .attr('d', function (d) { return line(d.values.map(function(f) { return {x:f.x, y:self.y.d3scale.domain()[0]}; })); })
    ;

    lines
      .exit()
      .transition()
      .duration(self.transitions.duration)
      .style('opacity', 0)
      .remove()
    ;

    lines
      .attr('class', function (d, i) {
        return self.util.classes('chart-component', 'data-line', 'line-' + i, 'ident-' + d.ident.toString().parameterize());
      })
      .transition()
      .duration(self.transitions.duration)
      .ease(self.transitions.ease)
      .delay(self.transitions.delays.lines)
      .attr('d', function (d) { return line(d.values); })
    ;

    return self;
  },

  renderareas: function(data) {
    var self = this;

    var area = d3.svg.area()
      .x(function(d)  {
        return self.x.scale == 'date' ? self.x.d3scale(self.util.date(d.x)) : self.x.d3scale(d.x);
      })
      .y0(self.frame.height)
      .y1(function(d) {
        return self.y.scale == 'date' ? self.y.d3scale(self.util.date(d.y)) : self.y.d3scale(d.y);
      });

    var areas = self.components.areas
      .selectAll('.chart-component')
      .data(data, function (d) {
        return d.ident || d.values.map(function (k, v) { return k + ':' + v; }).join(',');
      });

    areas
      .enter()
      .append('path')
      .style('fill', function(d) { return self.colors(d.ident); })
      .attr('d', function (d) { return area(d.values.map(function(f) { return {x:f.x, y:self.y.d3scale.domain()[0]}; })); })
    ;

    areas
      .exit()
      .transition()
      .duration(self.transitions.duration)
      .style('opacity', 0)
      .remove()
    ;

    areas
      .attr('class', function (d, i) {
        return self.util.classes('chart-component', 'data-area', 'area-' + i, 'ident-' + d.ident.toString().parameterize());
      })
      .transition()
      .duration(self.transitions.duration)
      .ease(self.transitions.ease)
      .attr('d', function (d) { return area(d.values); })
    ;

    return self;

  },

  renderpies: function(data) {
    var self = this;

    var radius = Math.min(self.frame.width, self.frame.height) / 2;
    var arc = d3.svg.arc().outerRadius(radius).innerRadius(0);
    var pie = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d.y; });

    var pies = self.components.pies
      .selectAll('.chart-component-group')
      .data(data, function (d) {
        return d.ident || d.values.map(function (k, v) { return k + ':' + v; }).join(',');
      });

    var group = pies
      .enter()
      .append('g')
      .style('opacity', 0)
    ;

    group
      .append('circle')
      .attr('class', 'shadow')
    ;

    pies
      .exit()
      .transition()
      .duration(self.transitions.duration)
      .style('opacity', 0)
      .remove()
    ;

    pies
      .attr('transform', 'translate(' + self.frame.width / 2 + ',' + self.frame.height / 2 + ')')
      .attr('class', function(d, i) {
        return self.util.classes('chart-component-group', 'datarcs', 'pie-' + i, 'ident-' + d.ident.toString().parameterize())
      })
    ;

    pies.select('.shadow')
      .transition()
      .duration(self.transitions.duration)
      .attr('cx', self.frame.width / 2)
      .attr('cy', self.frame.height / 2)
      .attr('r', radius)
      .attr('transform', 'translate(' + -self.frame.width / 2 + ',' + -self.frame.height / 2 + ')')
    ;

    group
      .append('g')
      .attr('class', 'sections');

    group
      .append('g')
      .attr('class', 'labels');

    var sections = pies
      .select('.sections')
      .selectAll('.data-arc')
      .data(function(d) { return pie(d.values) })
    ;

    sections
      .enter()
      .append('path')
      .style('fill', function(d) { return self.colors(d.data.x); })
      .attr('d', function(d) { return arc(d); })
    ;

    sections
      .exit()
      .transition()
      .duration(self.transitions.duration)
      .style('opacity', 0)
      .remove()
    ;

    sections
      .attr('class', function(d, i) { return self.util.classes('chart-component', 'data-arc', 'section-' + i); })
      .transition()
      .duration(self.transitions.duration)
      .attr('d', function(d) { return arc(d); })
    ;

    var labels = pies
      .select('.labels')
      .selectAll('.arc-label')
      .data(function(d) { return pie(d.values) })
    ;

    labels
      .enter()
      .append('text')
    ;

    labels
      .exit()
      .transition()
      .duration(self.transitions.duration)
      .style('opacity', 0)
      .remove()
    ;

    labels
      .attr('class', function(d, i) { return self.util.classes('chart-component', 'arc-label', 'section-' + i); })
      .transition()
      .duration(self.transitions.duration)
      .ease(self.transitions.ease)
      .attr('transform', function(d) { return 'translate(' + arc.centroid(d) + ')'; })
      .attr('dy', '1em')
      .text(function(d) { return d.data.x; })
    ;

    group
      .transition()
      .duration(self.transitions.duration)
      .ease(self.transitions.ease)
      .delay(self.transitions.delays.pies)
      .style('opacity', 0.85)
      .each('end', function() { d3.select(this).style('opacity', null); })
    ;

    return self;

  },

  renderbars: function(data) {
    var self = this;

    var groups = data.map(function(d) { return d.values.map('x'); }).flatten().unique();
    var streams = data.map(function(d, i) { return d.ident || ('stream-' + i) });

    var scale = d3.scale.ordinal()
      .domain(groups)
      .rangeRoundBands([0, self.frame.width], .2);

    var bands = d3.scale.ordinal()
      .domain(data.map(function(d, i) { return i; }))
      .rangeRoundBands([0, scale.rangeBand()], .15);

    var group = self.components.bars
      .selectAll('.chart-component-group')
      .data(groups, function (d) { return d; });

    group
      .enter()
      .append('g')
    ;

    group
      .exit()
      .transition()
      .duration(self.transitions.duration)
      .style('opacity', 0)
      .remove()
    ;

    group
      .attr('transform', function(d) { return 'translate(' + scale(d) + ', 0)'; })
      .attr('class', function(d, i) {
        return self.util.classes('chart-component-group', 'bargroup', 'group-' + i, 'group-ident-' + d.toString().parameterize());
      })
    ;

    var bar = group
      .selectAll('.data-bar')
      .data(function(d) {
        return data.map(function(b){
            var value = b.values.filter(function(a){ return a.x == d }).first();
            return {
              ident: b.ident,
              group: d,
              stream: b.ident.toString().parameterize() || ('stream-' + i),
              x: value.x,
              y: value.y
            };
          }
        );
      }, function(d) { return d.ident; });

    bar
      .enter()
      .append('rect')
      .style('fill', function(d) { return self.colors(d.ident); })
      .attr('x', function(d, i) { return bands(i); })
      .attr('y', self.frame.height)
      .attr('height', 0)
      .attr('width', bands.rangeBand())
    ;

    bar
      .exit()
      .transition()
      .duration(self.transitions.duration)
      .style('opacity', 0)
      .remove()
    ;

    bar
      .attr('class', function(d) {
        return self.util.classes('chart-component', 'data-bar',
          'group-' + groups.indexOf(d.group),
          'bar-' + streams.indexOf(d.stream),
          'ident-' + d.ident.toString().parameterize()
        ); })

      .transition()
      .duration(self.transitions.delays.bars)
      .ease(self.transitions.ease)
      .attr('x', function(d, i) { return bands(i); })
      .attr('width', bands.rangeBand())

      .transition()
      .duration(self.transitions.duration)
      .ease(self.transitions.ease)
      .delay(self.transitions.delays.bars)
      .attr('x', function(d, i) { return bands(i); })
      .attr('y', function(d) { return self.y.d3scale(d.y); })
      .attr('width', bands.rangeBand())
      .attr('height', function(d) { return self.frame.height - self.y.d3scale(d.y); })
    ;

    return self;
  },

  render: function() {
    var self = this;

    var data = self.streams.groupBy('type');

    return self
      .renderareas((data.area || []))
      .renderbars((data.bar || []))
      .renderlines((data.line || []))
      .renderpies((data.pie || []))
    ;
  },

  width: function (width) {
    var self = this;
    if (typeof width == 'undefined') { return self.frame.width; }
    self.frame.width = width;
    return self.resize();
  },

  height: function (height) {
    var self = this;
    if (typeof height == 'undefined') { return self.frame.height; }
    self.frame.height = height;
    return self.resize();
  },

  util: {
    classes: function() { return Object.values(arguments).compact().join(' '); },
    colors: function(domain) {
      var random = Object.values(colorbrewer).map(function(o){ return Object.values(o); }).flatten().sample(domain.length)
      return d3.scale.ordinal().domain(domain).range(random);
    },
    date: d3.time.format('%Y-%m-%d').parse,

    end: null
  },

  end: null
};

//--- BZAxis ----------------------------------------

function BZAxis(options) { return this.init(options); }

BZAxis.prototype = {

  init: function (options) {
    var self = this;

    self.key = options.key;
    self.scale = options.scale;
    self.ticks = options.ticks;
    self.timescale = options.timescale;

    if (self.scale == 'date') {
      self.d3scale = d3.time.scale();
    } else if (self.scale == 'linear') {
      self.d3scale = d3.scale.linear();
    } else {
      self.d3scale = d3.scale.ordinal();
    }

    self.axis = d3.svg.axis()
      .orient(options.orient)
      .scale(self.d3scale)
      .tickFormat(self.formatter(options.format))
      .tickSize(0, 0)
    ;

    return self;
  },

  formatter: function (format) {
    var self = this;

    if (format == 'none') {
      return function () { return ''; }
    } else if (self.scale == 'date') {
      var formatter = d3.time.format(format ? format : '%Y-%m-%d');
      return function (d) { return (typeof(d) == 'string') ? formatter(new Date(Date.parse(d))) : formatter(d); };
    } else if (self.scale == 'linear') {
      return d3.format(format);
    } else {
      return function (d) { return d; }
    }
  },

  range: function (range) {
    var self = this;

    if (self.scale == 'ordinal') {
      self.d3scale.rangePoints(range);
    } else {
      self.d3scale.range(range);
    }

    return self;
  },

  rescale: function (data) {
    var self = this;

    function sorter(a, b) { return a - b; }
    var date = d3.time.format('%Y-%m-%d').parse

    if (self.scale == 'date') {
      self.d3scale.domain(d3.extent(data.map(self.key), function (d) { return date(d); }).sort(sorter));
    } else if (self.scale == 'linear') {
      var extent = d3.extent(data.map(function(d) { return +d[self.key] }));
      self.d3scale.domain(d3.extent([extent[0] * 0.75, extent[1] * 1.25]));
    } else {
      self.d3scale.domain(data.map(self.key).unique().sort(sorter))
    }

    if (self.ticks == 'none') {
      self.axis.ticks(0);
    } else if (self.timescale && self.scale == 'date') {
      self.axis.ticks(d3.time[self.timescale || 'days'], 1);
    } else {
      var ticks = data.length;
      if (self.ticks < 1) {
        ticks *= self.ticks
      } else if (self.ticks) {
        ticks = self.ticks;
      }
      self.axis.ticks(ticks);
    }

    return self;
  },

  end: null

};

