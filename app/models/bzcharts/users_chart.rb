module Bzcharts
  class UsersChart < Chart

    def data(params={})
      User.count(:all, order: 'created_at::date', group: 'created_at::date').map { |date, count|
        {x: date, y: count }
      }
    end
  end
end