# Production-Ready JSON Auth App

This project is optimized for deployment using local `users.json` storage.

## 🚀 Deployment Guide (Crucial)

Since this app uses a static JSON file for its database, you **cannot** use platforms with ephemeral file systems like **Vercel** or **Netlify** if you want your data to persist between deployments.

### Recommended Hosting:
1.  **Render.com**: Use "Web Service" with a **Disk** attached.
2.  **Railway.app**: Use a service with a **Volume** attached.
3.  **DigitalOcean / AWS / VPS**: Use a traditional virtual server where files are persistent.

### Deployment Steps:
1.  **Environment Variables**: Set `ADMIN_PASSWORD` and `PORT` in your hosting provider's dashboard.
2.  **Persistent Path**: Ensure the `data/` folder is mapped to a persistent volume or disk.
3.  **CORS**: Set `ALLOWED_ORIGINS` to your production URL.

## Local Setup
1. `npm install`
2. Create `.env` from `.env.example`
3. `node server.js`

## Security Notes
- Data is stored in `data/users.json`.

