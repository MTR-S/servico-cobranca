# ==============================================================================
# Dockerfile - Serviço de Mensageria (@servico-cobranca/messaging)
# ==============================================================================
# Adaptador WebSocket do WhatsApp (Baileys) e comunicação via RabbitMQ.
# Imagem estritamente enxuta, sem dependências de navegador Chromium/Playwright
# e sem banco SQLite, garantindo o isolamento arquitetural conforme ADR 0002.
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Estágio de Compilação (Builder)
# ------------------------------------------------------------------------------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Cópia dos manifestos para otimização de cache de camadas do Docker
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/tsconfig.json ./packages/contracts/
COPY services/messaging/package.json services/messaging/tsconfig.json ./services/messaging/

# Instalação de dependências do monorepo
RUN npm ci

# Cópia do código-fonte dos contratos e do serviço de mensageria
COPY packages/contracts ./packages/contracts
COPY services/messaging ./services/messaging

# Compilação dos pacotes TypeScript
RUN npm run build --workspace=@servico-cobranca/contracts
RUN npm run build --workspace=@servico-cobranca/messaging

# ------------------------------------------------------------------------------
# 2. Estágio de Execução (Production Runner - Enxuto)
# ------------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Instalação apenas de certificados de autoridade (CA) para conexões TLS/WSS seguras.
# Isolamento estrito: NENHUMA dependência de Chromium, Playwright, X11 ou SQLite.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Cópia dos manifestos e node_modules instalados do builder
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY services/messaging/package.json ./services/messaging/

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=builder /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=builder /app/services/messaging/dist ./services/messaging/dist
COPY --from=builder /app/services/messaging/package.json ./services/messaging/package.json

# Criação do diretório padrão para persistência da sessão de autenticação do WhatsApp
RUN mkdir -p /app/data/whatsapp-session

# Entrypoint direto em Node.js (exec form) para propagação imediata de sinais SIGTERM e SIGINT
CMD ["node", "services/messaging/dist/index.js"]
