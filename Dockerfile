FROM node:22-slim

# XeLaTeX وخط Amiri يعيشان داخل خدمة نبراس؛ لا يحتاج الأستاذ إلى تثبيت أي برنامج.
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-xetex \
    texlive-lang-arabic \
    fonts-hosny-amiri \
    && fc-cache -f \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .
RUN npm install -g corepack@latest && corepack pnpm install && corepack pnpm run build

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
