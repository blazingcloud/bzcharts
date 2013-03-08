module Bzcharts
  class Engine < ::Rails::Engine
    isolate_namespace Bzcharts

    initializer "bzcharts.assets.precompile" do |app|
      app.config.assets.precompile += %w(bzcharts.css bzcharts.js)
    end
  end
end
