FROM nginx:1.27-alpine AS base

FROM node:22.14-alpine AS build

RUN apk add --no-cache curl unzip ca-certificates

ARG VITE_TURN_SERVER_HOST
ARG VITE_TURN_SERVER_PORT
ARG VITE_TURN_SERVER_USERNAME
ARG VITE_TURN_SERVER_CREDENTIAL
ARG VITE_PEERJS_SERVER_HOST
ARG VITE_PEERJS_SERVER_PORT

WORKDIR /src
COPY /package.json /package-lock.json ./
RUN npm ci

COPY . .
RUN echo "VITE_TURN_SERVER_HOST=${VITE_TURN_SERVER_HOST}" >> .env
RUN echo "VITE_TURN_SERVER_PORT=${VITE_TURN_SERVER_PORT}" >> .env
RUN echo "VITE_TURN_SERVER_USERNAME=${VITE_TURN_SERVER_USERNAME}" >> .env
RUN echo "VITE_TURN_SERVER_CREDENTIAL=${VITE_TURN_SERVER_CREDENTIAL}" >> .env
RUN echo "VITE_PEERJS_SERVER_HOST=${VITE_PEERJS_SERVER_HOST}" >> .env
RUN echo "VITE_PEERJS_SERVER_PORT=${VITE_PEERJS_SERVER_PORT}" >> .env

RUN mkdir -p src/rpc-types && \
    curl -L -k --fail "${VITE_API_URL}/types" -o project.zip && \
    unzip -o project.zip -d src/rpc-types && \
    rm project.zip

RUN npx supabase gen types --lang typescript --project-id ${SUPABASE_PROJECT_ID} > src/supabase-db.types.ts

RUN npm run build

FROM base AS final

ENV SITE_ROOT=/usr/share/nginx/html
RUN chown -R nginx:nginx ${SITE_ROOT} && chmod -R 755 ${SITE_ROOT}

RUN chown -R nginx:nginx /var/cache/nginx && chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && chown -R nginx:nginx /var/run/nginx.pid && \
    mkdir -p -m 755 /build && chown -R nginx:nginx /build

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=build /src/dist ${SITE_ROOT}

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
