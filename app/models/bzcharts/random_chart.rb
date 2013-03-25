module Bzcharts
  class RandomChart < Chart

    def data(params={})
      (params['count'] || 10).to_i.times.map { |t| {x: t, y: rand((params['range'] || 10).to_i)} }
    end

  end
end
