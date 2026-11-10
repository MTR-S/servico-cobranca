# ==============================================================================
# Dockerfile - Serviço Core (@servico-cobranca/core)
# ==============================================================================
# Execução headless de Chromium/Playwright, banco de dados SQLite e agendamento.
# Padrão multi-stage build para separação estrita de ferramentas de compilação
# e imagem final de execução.
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Estágio de Compilação (Builder)
# ------------------------------------------------------------------------------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Instalação de ferramentas de compilação nativa (se pacotes nativos exigirem)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Cópia dos manifestos para otimização de cache de camadas do Docker
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/tsconfig.json ./packages/contracts/
COPY services/core/package.json services/core/tsconfig.json ./services/core/

# Instalação de dependências do monorepo
RUN npm ci

# Cópia do código-fonte dos contratos e do serviço core
COPY packages/contracts ./packages/contracts
COPY services/core ./services/core

# Compilação dos pacotes TypeScript
RUN npm run build --workspace=@servico-cobranca/contracts
RUN npm run build --workspace=@servico-cobranca/core

# ------------------------------------------------------------------------------
# 2. Estágio de Execução (Production Runner)
# ------------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Instalação de dependências do sistema operacional para execução headless do
# Chromium (Playwright) e persistência do banco SQLite
RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
    libsqlite3-0 \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    libxkbcommon0 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Cópia dos manifestos e node_modules instalados do builder
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY services/core/package.json ./services/core/

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=builder /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=builder /app/services/core/dist ./services/core/dist
COPY --from=builder /app/services/core/package.json ./services/core/package.json

# Criação dos diretórios padrão de persistência e perfil de navegador
RUN mkdir -p /app/data/browser-profile \
             /app/data/imports \
             /app/data/screenshots \
             /ms-playwright

# Entrypoint direto em Node.js (exec form) para propagação imediata de sinais SIGTERM e SIGINT
CMD ["node", "services/core/dist/index.js"]
