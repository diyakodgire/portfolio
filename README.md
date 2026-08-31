# Diya Kodgire — Portfolio

A static, single-page portfolio site (plain HTML/CSS/JS, no build step) recreating the
content and vintage maroon/cream aesthetic of the original Canva portfolio at
[diyakodgireportfolio.my.canva.site](https://diyakodgireportfolio.my.canva.site/).

## Structure

```
index.html              Page markup, all sections
assets/css/style.css     Styles (color tokens at the top)
assets/js/main.js        Mobile nav toggle + footer year
assets/images/           Photos (see assets/images/README.md)
```

## Sections

- **Home** — hero with name and tagline
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
- Fill in the **Projects** section with real project details
- Fill in the **Marketing Campaigns** section with real campaign details
- Fill in the **Contact Me!** section with real email/social links
