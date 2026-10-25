# AgentCore Runtime runs arm64 containers; build with --platform linux/arm64.
FROM public.ecr.aws/docker/library/node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npx tsc

FROM public.ecr.aws/docker/library/node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 8000
CMD ["node", "dist/server.js"]
