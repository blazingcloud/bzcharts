module Bzcharts
  class UsersChart < Chart

    def data(params={})
      color = COLORS.shuffle.first
      {
        x: {
          label:'Date',
          scale:'date',
          grid: false,
          style: { stroke: COLORS.shuffle.first, fill:COLORS.shuffle.first },
          format: '%m/%d',
        },
        y: {
          label:'Users',
          scale:'linear',
          grid: true,
          style: { stroke: COLORS.shuffle.first, fill:COLORS.shuffle.first },
          format: ',.0f'
        },
        data: [{
                 name: 'New Users',
                 type: 'line',
                 style: { fill:color,  stroke:color },
                 values: User.count(:all,
                                    order: 'created_at::date',
                                    group: 'created_at::date').map { |date, count|
                   {
                     x: date,
                     y: count,
                     style: { fill: COLORS.shuffle.first }
                   }
                 }
               }]
      }
    end
  end
end