module Bzcharts
  class Chart

    include ActiveModel::Validations
    include ActiveModel::Conversion
    extend ActiveModel::Naming

    COLORS = %w{#0099CC #CCFFCC #66CCFF #003399 #996699 #CCCCCC #006699 #CC0000 #99FF00 #FFCC00 #3333FF #D9CCB9 #DF7782 #E95D22 #017890 #613D2D #62587C #E198B2 #C15D63 #B39F73}

    def initialize(attributes = {})
      attributes.each do |name, value|
        send("#{name}=", value)
      end
    end

    def persisted?
      false
    end

    def data(params={})
      raise 'not implemented in abstact class'
    end
  end
end


