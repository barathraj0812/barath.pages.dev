<div align="center">

# 🌌 Barath M — Portfolio

**A single-file, cosmos-themed developer portfolio with a WebGL 3D Sun, scroll-driven journey, and a privacy-first contact form.**

[![Live Site](https://img.shields.io/badge/Live_Site-barath.pages.dev-1e3a8a?style=for-the-badge&logo=cloudflarepages&logoColor=white)](https://barath.pages.dev)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![WebGL](https://img.shields.io/badge/WebGL-990000?style=for-the-badge&logo=webgl&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare_Pages-F38020?style=for-the-badge&logo=cloudflarepages&logoColor=white)

</div>

---

## 📖 Overview

The personal portfolio of Barath M, a Class XI student developer from Chennai. It showcases AI applications, interactive maths tools, a Unity simulation, Olympiad achievements and certifications, all in one HTML file with no framework.

## ✨ Highlights

- 🌞 **WebGL 3D Sun** in the hero, with multi-octave granulation, sunspots, limb darkening, adaptive quality tiers, and context-loss recovery
- 🚀 **Continuous scroll journey** across all sections with camera and colour keyframes, particle morphs and constellation / orbital formations (no scroll-jacking)
- 🌗 **Dark / light themes** built on a design-token system, with a pre-paint flash fix
- 🖼️ **Reusable image lightbox** wired with `data-gallery-group` attributes and a `MutationObserver`
- 📤 **Native Web Share API** with a custom share sheet fallback (WhatsApp, LinkedIn, X, Email)
- 🖨️ **Print / Save as PDF** stylesheet
- ⌨️ **Keyboard shortcuts**: `?` for help, `T` to toggle theme, `G` then `H/P/A/S/C` to jump between sections
- 📬 **Privacy-first contact form** using a Cloudflare Worker + Google Sheets pipeline with Turnstile verification; no personal contact details are shown publicly
- 🍪 **Cookie consent** with essential and optional analytics choices
- ♿ **Accessibility**: skip link, visible focus states, larger touch targets, reduced-motion support

## 🗂️ Sections

`Hero` · `About` · `Certifications` · `Skills` · `Projects` · `Achievements` · `Goals` · `Contact`

## 🛠️ Tech Stack

| Area | Tools |
|---|---|
| Front end | HTML5, CSS3, vanilla JavaScript |
| Graphics | WebGL, Canvas, GSAP |
| Backend | Cloudflare Worker, Google Sheets, Cloudflare Turnstile |
| Hosting | Cloudflare Pages |

## 🚀 Run Locally

```bash
git clone https://github.com/barathraj0812/barath.pages.dev.git
cd barath.pages.dev
npx serve .
```

The contact form needs its own Worker endpoint and keys, so it will not submit when run locally unless you configure them. Keep keys out of the repository.

## 📄 License

© 2026 Barath M. All rights reserved. The code is shared for viewing; please ask before reusing it.

## 📬 Contact

Use the form on the [live site](https://barath.pages.dev) or find me on [GitHub](https://github.com/barathraj0812).
