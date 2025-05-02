# Notess - A Modern Note-Taking Application

This is a modern note-taking application built with [Next.js](https://nextjs.org) that allows users to create, edit, and manage their notes with a clean and intuitive interface.

## Features

- 📝 Create and edit notes with a rich text editor
- 🔍 Search functionality to quickly find your notes
- 📅 Date-based note organization
- 🌓 Light/Dark theme support
- 💻 Progressive Web App (PWA) support
- 📱 Responsive design for all devices

## Project Structure

```
src/
  ├── app/                # Next.js app directory
  │   ├── api/           # API routes
  │   ├── components/    # React components
  │   ├── layout.js      # Root layout
  │   └── page.js        # Home page
  └── ...
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
