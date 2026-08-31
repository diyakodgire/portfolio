# Diya Kodgire — Portfolio

A static, multi-page portfolio site (plain HTML/CSS/JS, no build step) recreating the
content and vintage maroon/cream aesthetic of the original Canva portfolio at
[diyakodgireportfolio.my.canva.site](https://diyakodgireportfolio.my.canva.site/).

## Structure

```
index.html                    Landing page — hero + nav grid to every other page
about.html                    About Me!
skills.html                   Expertise & Skills
content-creation.html         Content Creation gallery
projects.html                 Projects (placeholder)
marketing-campaigns.html      Marketing Campaigns (placeholder)
contact.html                  Contact Me! (placeholder)
assets/css/style.css          Styles (color tokens at the top)
assets/js/main.js             Mobile nav toggle, active-link highlighting, footer year
assets/images/                Photos (see assets/images/README.md)
```

The header nav and footer are duplicated at the top/bottom of each page (no build step,
no server-side includes) — if you change the nav links, update them in every `*.html`
file.

## Pages

- **Home** (`index.html`) — hero with name/tagline, plus a card grid linking to every page
- **About Me!** — bio + profile photo
- **Expertise & Skills** — skills list styled as a receipt
- **Content Creation** — photo gallery
- **Projects** — placeholder, needs real project content
- **Marketing Campaigns** — placeholder, needs real campaign content
- **Contact Me!** — placeholder, needs real email/social links

## Running locally

No build step — open `index.html` directly in a browser, or serve the folder:

```
python3 -m http.server 8000
```

## TODO

- Add real photos to `assets/images/` (see `assets/images/README.md`)
- Fill in the **Projects** page with real project details
- Fill in the **Marketing Campaigns** page with real campaign details
- Fill in the **Contact Me!** page with real email/social links
