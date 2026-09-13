# Hostinger Deployment Guide (Using GitHub)

This website is built with **Vite + React + Tailwind CSS**. Follow the steps below to deploy it to Hostinger seamlessly using GitHub.

---

## Method 1: Automatic Deployment via GitHub Actions (Recommended)

A GitHub Actions workflow (`.github/workflows/deploy.yml`) is already configured for this repository. Every time you push to the `main` or `master` branch, GitHub will automatically:
1. Build the Vite production bundle (`dist` folder).
2. Upload the production files directly into your Hostinger `public_html` directory via FTP.

### Step 1: Find your Hostinger FTP Credentials
1. Log in to your **Hostinger hPanel** (https://hpanel.hostinger.com).
2. Go to **Websites** and click **Manage** next to your domain.
3. In the sidebar search bar, type **FTP Accounts** (or look under **Files** > **FTP Accounts**).
4. Note down:
   - **FTP Host / IP** (e.g. `ftp.yourdomain.com` or your Hostinger server IP)
   - **FTP Username** (e.g. `u123456789`)
   - **FTP Password** (click *Change Password* if you do not know it)
   - **Port**: `21` (default)

---

### Step 2: Add Secrets to Your GitHub Repository
1. Open your repository on **GitHub**.
2. Go to **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret** and add the following 3 secrets:

| Secret Name | Value from Hostinger |
|---|---|
| `FTP_SERVER` | Your Hostinger FTP Host (e.g., `ftp.yourdomain.com` or the Hostinger server IP) |
| `FTP_USERNAME` | Your Hostinger FTP Username |
| `FTP_PASSWORD` | Your Hostinger FTP Password |

*(Optional)* If you are using Supabase or other environment variables, you can also add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

### Step 3: Trigger the Deployment
1. Commit and push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Deploy to Hostinger"
   git push origin main
   ```
2. Go to the **Actions** tab in your GitHub repository.
3. You will see the **Deploy to Hostinger via GitHub** workflow running.
4. Once it displays a green checkmark, your website is live on your domain!

---

## Method 2: Hostinger Git Deployment (Manual / Webhook)

If you prefer using Hostinger’s built-in **Git** tool in hPanel:

1. In **Hostinger hPanel**, navigate to **Advanced** > **Git**.
2. Under **Repository**, enter your GitHub repository URL (e.g., `https://github.com/your-username/your-repo.git`).
3. Set the **Branch** to `main` (or `master`).
4. Set the **Install Directory** to `public_html`.
5. Click **Create**.
6. *Note*: Since Hostinger Git pulls the repository source files, you will need either:
   - To deploy the pre-built files (`dist/`), OR
   - To use GitHub Actions (Method 1 above) which automatically builds the files before uploading.

---

## Method 3: Manual Upload (Quick Test)

If you ever need to deploy or test manually without Git:
1. Run the build command locally:
   ```bash
   npm run build
   ```
2. This creates a `dist/` folder containing `index.html`, `assets/`, and `.htaccess`.
3. Open **Hostinger File Manager** in hPanel.
4. Go to `public_html/`.
5. Upload all the files and folders from inside `dist/` directly into `public_html/`.

---

## Important Hostinger Configuration Notes

### 1. SPA Routing & 404 Prevention
A custom `.htaccess` file has been placed in `/public/.htaccess`. During `npm run build`, it is automatically copied into `dist/.htaccess`.
This ensures that:
- Refreshing any page (like `/courses`, `/portal`, `/admin`) routes to `index.html` without showing a "404 Not Found" error.
- All traffic is automatically redirected to secure **HTTPS**.
- Gzip/Brotli compression and asset caching are enabled for fast load times.

### 2. Node.js Version
Hostinger or GitHub Actions requires **Node.js 18+** (Node 20 is recommended). The GitHub Actions workflow is pre-configured to use Node 20.
