function BZChart(options) {
  return this.init(options);
}

BZChart.prototype = {

  init: function(options) {
    var self = this;

    self.streams = [];

    //TODO: merge these hashes xxx
    //TODO: colors xxx
    self.layout(options || self.defaults);

    return self;
  },

  update: function (ident, type, stream) {
    var self = this;

    if (ident) {
      self.streams.remove(function(d) { return d.ident == ident });
      if (type && stream) {
        self.streams.add({
          ident: ident,
          type: type,
          values: stream
        });
      }
    }

    var values = Object.values(self.streams).map('values').flatten();

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

    d3.select(self.selector)
      .classed('bzchart', true)

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

    self.components.bars = self.layers.data
      .append('g')
      .attr('class', 'bars');

    self.components.areas = self.layers.data
      .append('g')
      .attr('class', 'areas');

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
        .attr('style', 'z-index:10;text-anchor:end;')
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
        .attr('style', 'z-index:10;text-anchor:end;')
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
      .x(function (d) { return self.x.d3scale(d.x); })
      .y(function (d) { return self.y.d3scale(d.y); });

    var lines = self.components.lines
      .selectAll('.chart-component')
      .data(data.line || [], function (d) {
        return d.ident || d.values.map(function (k, v) { return k + ':' + v; }).join(',');
      });

    lines
      .enter()
      .append('path');

    lines
      .exit()
      .remove();

    lines
      .attr('class', function (d) { return self.util.classes('chart-component', 'data-line', 'ident-' + d.ident); })
      .attr('d', function (d) { return line(d.values); })
    ;

    return self;
  },

  renderareas: function(data) {

    var self = this;

    var area = d3.svg.area()
      .x(function(d)  { return self.x.d3scale(d.x); })
      .y0(self.frame.height)
      .y1(function(d) { return self.y.d3scale(d.y); });

    var areas = self.components.areas
      .selectAll('.chart-component')
      .data(data.area || [], function (d) {
        return d.ident || d.values.map(function (k, v) { return k + ':' + v; }).join(',');
      });

    areas
      .enter()
      .append('path');

    areas
      .exit()
      .remove();

    areas
      .attr('class', function (d) { return self.util.classes('chart-component', 'data-area', 'ident-' + d.ident); })
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
      .data(data.pie || [], function (d) {
        return d.ident || d.values.map(function (k, v) { return k + ':' + v; }).join(',');
      });

    var group = pies
      .enter()
      .append('g');

    pies
      .exit()
      .remove();

    group
      .attr('class', function(d) { return self.util.classes('chart-component-group', 'datarcs', 'ident-' + d.ident) })
      .attr('transform', 'translate(' + self.frame.width / 2 + ',' + self.frame.height / 2 + ')');

    group
      .append('g')
      .attr('class', 'sections');

    group
      .append('g')
      .attr('class', 'labels');

    var sections = pies
      .select('.sections')
      .selectAll('.data-arc')
      .data(function(d) { return pie(d.values) });

    sections
      .enter()
      .append('path');

    sections
      .exit()
      .remove();

    sections
      .attr('class', function(d, i) { return self.util.classes('chart-component', 'data-arc', 'section-' + i); })
      .attr('d', function(d) { return arc(d); });

    var labels = pies
      .select('.labels')
      .selectAll('.arc-label')
      .data(function(d) { return pie(d.values) });

    labels
      .enter()
      .append('text');

    labels
      .exit()
      .remove();

    labels
      .attr('class', function(d, i) { return self.util.classes('chart-component', 'arc-label', 'section-' + i); })
      .attr('transform', function(d) { return 'translate(' + arc.centroid(d) + ')'; })
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text(function(d) { return d.data.x; });

    return self;

  },

  renderbars: function(data) {
    var self = this;

    if (!data.bar) {
      return self;
    }

    var groups = data.bar.map(function(d) { return d.values.map('x'); }).flatten().unique();
    var streams = data.bar.map(function(d,i) { return d.ident || ('stream-' + i) });

    var scale = d3.scale.ordinal()
      .domain(groups)
      .rangeRoundBands([0, self.frame.width], .2);

    var bands = d3.scale.ordinal()
      .domain(data.bar.map(function(d, i) { return i; }))
      .rangeRoundBands([0, scale.rangeBand()], .1);

    var group = self.components.bars
      .selectAll('.chart-component-group')
      .data(groups, function (d) { return d; });

    group
      .enter()
      .append('g')
    ;

    group
      .exit()
      .remove()
    ;

    group
      .attr('class', function(d, i) { return self.util.classes('chart-component-group', 'bargroup', 'group-' + i); } )
      .attr('transform', function(d) { return 'translate(' + scale(d) + ', 0)'; })
    ;

    var bar = group
      .selectAll('.data-bar')
      .data(function(d) {
        return data.bar.map(function(b){
            var value = b.values.filter(function(a){ return a.x == d }).first();
            return {
              ident: b.ident,
              group: d,
              stream: b.ident || ('stream-' + i),
              x: value.x,
              y: value.y
            };
          }
        );
      }, function(d) { return d.ident; });

    bar
      .enter()
      .append('rect')
    ;

    bar
      .exit()
      .remove()
    ;

    bar
      .attr('class', function(d) {
        return self.util.classes('chart-component', 'data-bar', 'group-' + groups.indexOf(d.group), 'bar-' + streams.indexOf(d.stream)); })
      .attr('width', bands.rangeBand())
      .attr('x', function(d, i) { return bands(i); })
      .attr('y', function(d) { return self.y.d3scale(d.y); })
      .attr('height', function(d) { return self.frame.height - self.y.d3scale(d.y); })
    ;


    return self;
  },

  render: function() {
    var self = this;

    var data = self.streams.groupBy('type');

    return self
      .renderlines(data)
      .renderareas(data)
      .renderpies(data)
      .renderbars(data)
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

    end: null
  },

  defaults: {

    selector: '#bzchart',

    layout: {
      height: 300,
      width: 300,
      margin: { top: 10, bottom: 50, left: 40, right: 50 }
    },

    x: {
      key: 'x',
      orient: 'bottom',
      scale: 'ordinal',
//      format: 'none',
      label: 'x axis'
    },

    y: {
      key: 'y',
      orient: 'left',
      scale: 'linear',
//      format: 'none',
      label: 'y axis'
    }

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

    var values = data.map(self.key);

    if (self.scale == 'date') {
      self.d3scale.domain(d3.extent(values,function (d) { return date(d); }).sort(sorter));
    } else if (self.scale == 'linear') {
      var extent = d3.extent(values);
      self.d3scale.domain(d3.extent([+extent[0] * 0.75, +extent[1] * 1.25]));
    } else {
      self.d3scale.domain(values.unique().sort(sorter))
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

