# Docker image to build and deploy to Cloud Foundry.
#
# This does *not* run the proxy/cache app, but is used as the agent in its
# Jenkins Pipeline.

FROM debian:stable-slim

WORKDIR /app

# Install CF CLI
RUN apt-get -q update && apt-get -yq install gnupg apt-transport-https wget \
  && wget -q -O - https://packages.cloudfoundry.org/debian/cli.cloudfoundry.org.key | apt-key add - \
  && echo "deb https://packages.cloudfoundry.org/debian stable main" | tee /etc/apt/sources.list.d/cloudfoundry-cli.list \
  && apt-get -q update && apt-get -yq install cf-cli \
  && rm -rf /var/lib/apt/lists/* \
  && cf install-plugin blue-green-deploy -f -r CF-Community
