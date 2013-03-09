module Bzcharts
  class ChartsController < ApplicationController

    def index
      @chart_name = params[:chart_name]
      @chart_type = params[:chart_type]
    end

    def data
      @chart_name = params[:chart_name] || 'Random'

      mod, *chart = @chart_name.split(/:/)
      chart = "#{mod.capitalize if mod}::#{chart.flat_map{|c|c.split(/[^a-z0-9]/i)}.map{|c|c.capitalize}.join}Chart".constantize.new

      render content_type:'text/json', text:chart.data(params).to_json
    end

  end
end
