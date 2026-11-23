# Isolated Jekyll build environment for this blog.
# Ruby 2.7 matches the github-pages ~> 214 / jekyll ~> 3.9 pins in the Gemfile.
# Nothing here touches the host system; all gems live inside the image.
# The full (non-slim) image already ships a C toolchain for native gems, so no apt step
# is needed; the old bullseye apt mirrors are unreliable anyway.
FROM ruby:2.7

ENV BUNDLE_PATH=/usr/local/bundle \
    JEKYLL_ENV=production \
    LANG=C.UTF-8

WORKDIR /site

# The bundler shipped with Ruby 2.7 (2.1) mis-resolves platform gems (picks musl ffi);
# 2.4.22 is the last bundler that supports Ruby 2.7 and resolves correctly.
RUN gem install bundler -v 2.4.22 && gem update --system 3.4.22 >/dev/null

# Install gems first so this layer is cached until the Gemfile changes.
COPY Gemfile ./
RUN bundle install --jobs 4

EXPOSE 4000
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--watch", "--force_polling"]
