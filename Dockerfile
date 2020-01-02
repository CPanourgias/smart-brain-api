FROM node:10.18.0

WORKDIR /var/www/smart-brain-api

COPY ./ ./

RUN npm install

CMD ["/bin/bash"]
