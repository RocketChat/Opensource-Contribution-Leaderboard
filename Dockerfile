FROM node:12

# Bundle app source
COPY . .

RUN npm run add
RUN npm install pm2 -g

# RUN npm build
RUN npm run build

#Create app directory
WORKDIR "/dist/server"

EXPOSE 8080

# Actual script to start can be overridden from `docker run`
CMD ["pm2-runtime", "app.js"]