# Ying Chung portfolio: deploy to Vercel

## Deploy (about 5 minutes)
1. Unzip this folder.
2. In Terminal, `cd` into the folder and run: `npx vercel --prod`
3. Log in when it asks. Project name: `ying-chung` (this gives you https://www.ychungworks.com).
4. Open the link it prints and click through: Projects, each case study, About.

Alternative with no terminal: push the folder to a GitHub repo, then on vercel.com choose "Add New → Project", import the repo and click Deploy (no build settings needed).

## If your project name is different
Find `www.ychungworks.com` in index.html (2 places, in the `<head>`) and change it to your real URL, so the LinkedIn link preview shows the right image.

## One missing file
`assets/steeped-cover-4x3.mp4` (the Steeped cover loop, 4.5 MB) was too large to export. Until you add it, the Steeped card shows its still poster image, which looks fine. If you have the video on your computer, drop it into `assets/` with that exact name and deploy again.

## Add the link to LinkedIn
- Profile → Edit intro → Website: paste the URL, link text "Portfolio".
- Profile → Add section → Featured → Add a link: paste the URL so the preview card shows.
