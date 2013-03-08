$:.push File.expand_path("../lib", __FILE__)

# Maintain your gem's version:
require "bzcharts/version"

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "bzcharts"
  s.version     = Bzcharts::VERSION
  s.authors     = ['Mason', 'Sarah Allen']
  s.email       = ['mason@blazingcloud.net']
  s.homepage    = 'http://blazingcloud.net'
  s.summary     = 'Charts is charts'
  s.description = 'Would you like to chart some data?'

  s.files = Dir["{app,config,db,lib}/**/*"] + ["MIT-LICENSE", "Rakefile", "README.rdoc"]

  s.add_dependency "rails", "~> 3.2.11"

end
