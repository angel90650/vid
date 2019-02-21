class HomeController < ApplicationController
  def index
  end

  def details
  end

  def about
  end

  def video
    path = Rails.root.join('public/s10.mp4')
    size = File.size(path)
    status_code = 206
    if !request.headers["Range"]
      status_code = 200 # 200 OK
      offset = 0
      length = File.size(path)
    else
      status_code = 206 # 206 Partial Content
      bytes = Rack::Utils.byte_ranges(request.headers, size)[0]
      offset = bytes.begin
      length = bytes.end - bytes.begin
    end
      response.header["Accept-Ranges"] = "bytes"
      response.header["Content-Range"] = "bytes #{bytes.begin}-#{bytes.end}/#{size}" if bytes

      send_data IO.binread(path, length, offset)
    else
      raise ActionController::MissingFile, "Cannot read file #{path}."
    end
end
