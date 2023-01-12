# syntax=docker/dockerfile:1
FROM node:18-alpine
WORKDIR .
COPY .. .
ENV NODE_ENV=production
RUN npm install --production
CMD ["npm", "start"]
EXPOSE 3000