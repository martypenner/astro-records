# Astro View Transitions + Persistent Island Demo

### 👉🏽 [Live Demo](https://astro-records.pages.dev/)

![Screenshot](./screenshot.png)

## 🚀 Getting Started

1. Clone this repository and install dependencies with `npm install`.
2. Start the project locally with npm run dev, or deploy it to your favorite server.
3. Have fun! ✨

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `npm install`          | Installs dependencies                            |
| `npm run dev`          | Starts local dev server at `localhost:3000`      |
| `npm run build`        | Build your production site to `./dist/`          |
| `npm run preview`      | Preview your build locally, before deploying     |
| `npm run astro ...`    | Run CLI commands like `astro add`, `astro check` |
| `npm run astro --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Check out [Astro's documentation](https://docs.astro.build) or jump into their [Discord server](https://astro.build/chat).

## To Publish

```bash
# Publish the Reflect server
pnpx reflect publish --app=my-app

# Publish the UI somewhere, i.e. Vercel.
# You will need to set the environment variable VITE_REFLECT_URL to whatever
# `pnpx reflect publish` output above.
pnpx vercel
```
