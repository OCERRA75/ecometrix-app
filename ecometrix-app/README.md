# EcoMetriX

Plataforma SaaS de diagnóstico de huella de carbono para PYMEs.  
AI-native · GHG Protocol · ISO 14064 · CSRD

**Deploy:** https://ecometrix-co.netlify.app

---

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Netlify Functions (serverless)
- **Base de datos:** Supabase (PostgreSQL + Auth)
- **IA:** Claude API (`claude-sonnet-4-6`)
- **Email:** Resend
- **Font:** Plus Jakarta Sans

## Setup local

```bash
# 1. Clonar repo
git clone https://github.com/[usuario]/ecometrix-app.git
cd ecometrix-app

# 2. Instalar dependencias
npm install

# 3. Variables de entorno
cp .env.example .env
# Editar .env con los valores reales

# 4. Correr en desarrollo
npm run dev
```

## Estructura

```
src/
├── pages/          # Rutas: Landing, Questionnaire, Report, Dashboard
├── components/
│   ├── ui/         # Botones, inputs, cards, badges
│   ├── layout/     # Navbar, Footer, Sidebar
│   └── forms/      # Formularios del cuestionario
├── api/            # Helpers para llamar a Netlify Functions
├── hooks/          # Custom hooks (useAuth, useQuestionnaire...)
├── lib/            # Supabase client, utils
└── store/          # Zustand stores (auth, questionnaire)
netlify/
└── functions/      # Serverless: health, calculate, report, send-report
```

## Roadmap

Ver `EcoMetriX_Plan_Maestro.docx` para el plan completo de 17 módulos.

| Fase | Módulos | Estado |
|------|---------|--------|
| Fase 1 — MVP | M1–M6 | 🔄 En progreso |
| Fase 2 — Completo | M7–M12 | ⏳ Pendiente |
| Fase 3 — Internacional | M13–M17 | ⏳ Pendiente |
