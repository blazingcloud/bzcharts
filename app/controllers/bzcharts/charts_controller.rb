module Bzcharts
  class ChartsController < ApplicationController

    def index
      @chart_name = params[:chart_name]
      @chart_type = params[:chart_type]
    end

    def data
      @chart_name = params[:chart_name] || 'Random'

      chart = "Bzcharts::#{@chart_name.capitalize}Chart".constantize.new

      render content_type:'text/json', text:chart.data.to_json
    end

  end
end
