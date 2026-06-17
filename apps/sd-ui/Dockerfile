FROM node:22
WORKDIR /app

COPY . .

RUN npm install --ignore-scripts
RUN npm run build

ENV HOST=0.0.0.0
ENV PORT=4322
EXPOSE 4322
RUN groupadd -g 1001 simplgroup && useradd -u 1001 -g simplgroup -m simpluser
USER simpluser
CMD ["node", "./dist/server/entry.mjs"]