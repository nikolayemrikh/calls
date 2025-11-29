FROM nginx:1.27-alpine AS base

FROM node:22.14-alpine AS build

RUN apk add --no-cache curl unzip ca-certificates

ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_URL
ARG VITE_API_URL
# special env variables for supabase
ARG SUPABASE_ACCESS_TOKEN
ARG SUPABASE_PROJECT_ID

WORKDIR /src
COPY /package.json /package-lock.json ./
RUN npm ci

COPY . .
RUN echo "VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}" >> .env
RUN echo "VITE_SUPABASE_URL=${VITE_SUPABASE_URL}" >> .env
RUN echo "VITE_API_URL=${VITE_API_URL}" >> .env

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
