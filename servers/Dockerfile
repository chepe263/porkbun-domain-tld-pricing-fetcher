FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY ecosystem.config.cjs ./ecosystem.config.cjs

# Default path expects core JSON mounted into /data.
ENV PORKBUN_DATA_PATH=/data/porkbun-domains-filtered.json
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["./node_modules/.bin/pm2-runtime", "start", "ecosystem.config.cjs", "--only", "porkbun-rest-api"]
