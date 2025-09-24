#!/bin/bash

# Saída no caso de qualquer comando falhar
set -e

docker container exec -i postgresql psql -U postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE datname = 'carrierwave_demo_development';"

# Roda dentro do ambiente de desenvolvimento
RAILS_ENV=development

# Mensagens informativas
echo "Dropping the database..."
bin/rails db:drop RAILS_ENV=$RAILS_ENV

echo "Creating the database..."
bin/rails db:create RAILS_ENV=$RAILS_ENV

echo "Loading the database..."
bin/rails db:schema:load RAILS_ENV=$RAILS_ENV

echo "Migrating the database..."
bin/rails db:migrate RAILS_ENV=$RAILS_ENV

echo "Seeding the database..."
bin/rails db:seed RAILS_ENV=$RAILS_ENV

echo "Database rebuild completed!"