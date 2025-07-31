# How I Built My Personal Website with Hugo & LoveIt


Building a **personal website** can be simple, elegant, and fully under your control using **Hugo** "v0.148.2" and the **LoveIt** theme "LoveIt v0.3.0".  
In this post, I share my **step-by-step journey**, lessons learned, and **key decisions**.

---

## 1️⃣ Choosing Hugo and LoveIt

I wanted:

- Markdown-first content
- Lightweight, static hosting on **GitHub Pages**
- A **modern but clean design**

After comparing themes, I chose:

- **Hugo Extended Binary** → No heavy dependencies  
- **LoveIt theme** → Responsive, feature-rich, and works well for blogs

---

## 2️⃣ Local Setup

1. **Prepare Hugo Binary in /opt/software/hugo**

   ```bash
   # Go to tools folder
   mkdir -p /opt/software/hugo
   cd /opt/software/hugo
   
   # Download Hugo Extended latest release (Linux 64-bit)
   wget https://github.com/gohugoio/hugo/releases/download/v0.148.2/hugo_extended_0.148.2_Linux-64bit.tar.gz
   
   # Extract and clean
   tar -xvzf hugo_extended_0.148.2_Linux-64bit.tar.gz
   rm hugo_extended_0.148.2_Linux-64bit.tar.gz
   
   # Verify binary
   ./hugo version
   ```

   Expected output:

   ```structured text
   hugo v0.148.2-extended+linux/amd64 BuildDate=xxxx
   ```

   (Optional) Add Hugo to your PATH:

   ```bash
   echo 'export PATH=/opt/software/hugo:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```

---

1. **Initialize project**

   ```bash
   hugo new site OwnWebsite
   cd OwnWebsite
   git init
   ```

2. **Add LoveIt theme as submodule and ensure exact version is taken**

   ```bash
   git submodule add https://github.com/dillonzq/LoveIt.git themes/LoveIt
   git add .gitmodules themes/LoveIt
   cd ./themes/LoveIt
   git fetch --all --tags
   git checkout v0.3.0
   git pull
   ```

   **.gitignore Setup for Submodule**

   ```structured text
   Edit# Ignore all other themes except LoveIt submodule
   themes/*/
   !themes/LoveIt/
   ```

3. **Use `hugo.toml` instead of old `config.toml`**

   ```structured text
   baseURL = "https://<username>.github.io/"
   title = "My Personal Website"
   theme = ["LoveIt"]
   ```

------

## 3️⃣ First Post & Images

To create the first post:

```bash
hugo new posts/first-post/index.md
```

- Images go **inside the same folder**:

  ```structured text
  content/posts/first-post/
      index.md
      SampleImage.jpg
  ```

- Access in Markdown:

  ```markdown
  ---
  title: "My First Blog Post"
  subtitle: "Learning Hugo + LoveIt"
  date: 2025-07-31T10:00:00+02:00
  draft: false
  tags: ["hugo", "loveit", "learning"]
  categories: ["blog"]
  author: "Your Name"
  
  summary: "This is my first post on my personal site using Hugo LoveIt theme. Exploring markdown, code blocks, images, and shortcodes."
  ---
  
  Welcome to my **first blog post** with the [LoveIt](https://hugoloveit.com) theme!
  
  ## 📌 Key Highlights
  
  1. Markdown is **clean and fast**
  2. LoveIt theme provides:
     - TOC support
     - Code highlighting
     - Image lightbox
  3. Deployment via **GitHub Pages** is simple
  
  ---
  ![Legend Walks](SampleImage.jpg)
  ```

------

## 4️⃣ GitHub Pages & Deployment

1. **Created public Pages repo**:
    `<username>.github.io`

2. **Linked `public/` as submodule**:

   ```
   git submodule add -b gh-pages git@github.com:<username>/<username>.github.io.git public
   ```

3. **Build & Deploy**

   ```bash
   hugo --minify
   cd public
   git add .
   git commit -m "Deploy site"
   git push origin gh-pages
   ```

4. **Enable GitHub Pages** → Selected `gh-pages` branch → ✅ Live!

------

## 5️⃣ Adding a Custom Subdomain

I mapped `OwnWebsite.example.com` using **DNS CNAME RECORD**:

- `CNAME` → `<username>.github.io`

- Verified with:

  ```
  dig OwnWebsite.example.com
  ```

Within 30 minutes, the **custom domain with HTTPS** was active.

------

## 6️⃣ Key Lessons Learned

- ✅ **Use Hugo Extended Binary** → Clean, no OS pollution
- ✅ **Always use submodules** for `public/` and `themes/`
- ✅ **Use Page Bundles** for images → Avoid 404 issues
- ✅ **Check Hugo theme compatibility** with your Hugo version

------

