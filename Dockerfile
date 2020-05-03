FROM strapi/base:alpine as builder
ARG ENVIRONMENT=production
ENV NODE_ENV $ENVIRONMENT
WORKDIR /api

COPY package.json yarn.lock ./
RUN yarn --prod
COPY . .

RUN yarn build

FROM mhart/alpine-node:base
ARG ENVIRONMENT=production
ENV NODE_ENV $ENVIRONMENT
WORKDIR /api

COPY --from=builder /api .

EXPOSE 1337
CMD ["yarn", "start"]
