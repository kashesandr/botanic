# syntax=docker/dockerfile:1
FROM node:18-alpine
WORKDIR .
ENV NODE_ENV=production
RUN npm install --omit=dev
CMD ["npm", "start"]
EXPOSE 3000