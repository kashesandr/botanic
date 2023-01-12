# syntax=docker/dockerfile:1
FROM node:18-alpine
WORKDIR .
COPY .. .
RUN npm install --production
CMD ["npm", "run", "start-prod"]
EXPOSE 3000