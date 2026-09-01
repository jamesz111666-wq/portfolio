# Personal Site

Static personal portfolio site (plain HTML/CSS/JS, no build step).

## Preview locally

```bash
cd site
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy (GitHub Pages)

1. Repo settings → Pages → set source to this branch, folder `/site`.
2. Or copy the contents of `site/` into the repo root if you want the
   site served from the root instead of `/site`.

## Editing content

All copy lives directly in `index.html` (sections: hero, about, skills,
projects, experience, contact). Styling is in `css/style.css`, behavior
(typewriter, scroll reveal, theme toggle, background animation) is in
`js/main.js`.
