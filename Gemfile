source 'https://rubygems.org'

gem 'sinatra'
gem 'sinatra-activerecord'
gem 'sinatra-contrib'
gem 'rake'
gem 'erubi'
gem 'sinatra-docdsl'

group :test do
  gem 'rspec'
  gem 'rack-test'
end

group :development, :test do
  gem 'sqlite3'
end

group :production do
  gem 'pg'
end
