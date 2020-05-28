FROM strapi/base:alpine as builder
ARG ENVIRONMENT=production
ENV NODE_ENV $ENVIRONMENT
WORKDIR /api

COPY package.json yarn.lock ./
RUN yarn --prod
COPY . .

RUN yarn build

FROM node:12-alpine
ARG ENVIRONMENT=production
ENV NODE_ENV $ENVIRONMENT
ENV ENV_PATH ./.$ENVIRONMENT.env
WORKDIR /api

COPY --from=builder /api .

EXPOSE 1337
CMD ["node_modules/.bin/strapi", "start"]
