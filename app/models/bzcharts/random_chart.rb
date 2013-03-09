module Bzcharts
  class RandomChart < Chart

    def data(params={})
      {
        x: {
          label:'x axis',
          scale:'linear',
          format: ',.0f',
          style: (rand(100).odd? ? {} : { stroke: COLORS.shuffle.first, fill:COLORS.shuffle.first }),
          ticks: rand(100).odd?,
          grid: rand(100).odd?
        },
        y: {
          label:'y axis',
          scale:'linear',
          format: ',.0f',
          style: (rand(100).odd? ? {} : { stroke: COLORS.shuffle.first, fill:COLORS.shuffle.first }),
          ticks: rand(100).odd?,
          grid: rand(100).odd?
        },
        data: 5.times.map { |r|
          color = COLORS.shuffle.first
          line = rand(100).odd?
          {
            class: "random-#{r}",
            type: line ? 'line' : 'area',
            style: { stroke: color, fill:color },
            values: 5.times.map { |t|
              { x: t,
                y: rand(10),
                style: { fill: COLORS.shuffle.first },
                class: "random-#{r}-#{t}"
              }
            }
          }
        }
      }
    end

  end
end
