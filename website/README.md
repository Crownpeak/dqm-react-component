# Crownpeak DQM React Component - Demo Website

Eine interaktive Demo-Website für das [@crownpeak/dqm-react-component](https://www.npmjs.com/package/@crownpeak/dqm-react-component) Paket.

## 🚀 Features

- **Interaktive Demo** - Erleben Sie das DQM React Component mit Mock-Daten
- **Mehrsprachig** - Verfügbar in Deutsch, Englisch und Spanisch
- **Statischer Export** - Läuft ohne Server, nur HTML/CSS/JS
- **GitHub Pages Ready** - Automatisches Deployment via GitHub Actions

## 🛠️ Entwicklung

### Voraussetzungen

- Node.js 20+
- Yarn 1.22+

### Installation

```bash
yarn install
```

### Entwicklungsserver starten

```bash
yarn dev
```

Die Website ist dann unter [http://localhost:3000](http://localhost:3000) erreichbar.

### Produktions-Build

```bash
yarn build
```

Der statische Export wird im `out/`-Ordner erstellt.

## 📦 Deployment

### GitHub Pages (automatisch)

1. Repository auf GitHub erstellen
2. Code pushen
3. In den Repository-Einstellungen:
   - **Settings** → **Pages** → **Source**: "GitHub Actions"

Der Workflow in `.github/workflows/deploy.yml` übernimmt den Rest.

### Manuelles Deployment

Der `out/`-Ordner kann auf jedem statischen Hosting-Service deployed werden:

- Netlify
- Vercel
- AWS S3
- Cloudflare Pages
- etc.

## 🔧 Konfiguration

### Base Path (für Subdirectory-Deployment)

Falls die Website nicht im Root einer Domain gehostet wird, setze die Umgebungsvariable:

```bash
NEXT_PUBLIC_BASE_PATH=/mein-pfad yarn build
```

## 📁 Projektstruktur

```
├── src/
│   ├── app/           # Next.js App Router
│   ├── components/    # React Komponenten
│   ├── i18n/          # Internationalisierung
│   ├── lib/           # Utility-Funktionen
│   ├── locales/       # Übersetzungen (de, en, es)
│   ├── mocks/         # MSW Mock-Handler
│   └── store/         # Redux Store
├── public/            # Statische Assets
└── out/               # Build-Output (nach `yarn build`)
```

## 📄 Lizenz

© 2024 Crownpeak Technology GmbH. Alle Rechte vorbehalten.

## 🔗 Links

- [DQM React Component auf npm](https://www.npmjs.com/package/@crownpeak/dqm-react-component)
- [GitHub Repository](https://github.com/Crownpeak/dqm-react-component)
- [Crownpeak Website](https://www.crownpeak.com)
