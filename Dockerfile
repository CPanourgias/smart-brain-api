FROM node:10.18.0

# Create app directory
RUN mkdir -p /var/www/smart-brain-api
WORKDIR /var/www/smart-brain-api

# Install app dependencies
COPY package.json /var/www/smart-brain-api
RUN npm install

# Bundle app source
COPY . /var/www/smart-brain-api

# Build arguments
ARG NODE_VERSION=10.18.0

# Environment
ENV NODE_VERSION $NODE_VERSION