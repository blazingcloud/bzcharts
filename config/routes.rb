Bzcharts::Engine.routes.draw do

  get '/' => 'charts#index', defaults: { chart_name: 'random', chart_type: 'auto' }
  get '/:chart_name(.:chart_type)' => 'charts#index'
  get '/data/:chart_name.json' => 'charts#data'

end
