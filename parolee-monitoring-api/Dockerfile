FROM php:8.2-fpm-bullseye AS base

ARG DEBIAN_FRONTEND=noninteractive

# Make apt more resilient (retries + force IPv4) and install system deps
RUN apt-get update -o Acquire::Retries=3 -o Acquire::ForceIPv4=true \
 && apt-get install -y --no-install-recommends \
    ca-certificates curl git build-essential \
    libpng-dev libonig-dev libxml2-dev libzip-dev zlib1g-dev libicu-dev \
    zip unzip \
 && rm -rf /var/lib/apt/lists/*

# Install PHP extensions needed by Laravel
RUN docker-php-ext-configure gd --with-jpeg \
 && docker-php-ext-install -j$(nproc) pdo_mysql mbstring exif pcntl bcmath gd zip intl opcache

# Copy composer executable from official composer image
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Install PHP deps first for better layer caching
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

# Copy app and run any necessary post-install steps
COPY . /var/www
RUN composer run-script post-autoload-dump || true

# Set permissions
RUN chown -R www-data:www-data /var/www \
 && chmod -R 755 /var/www/storage /var/www/bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]