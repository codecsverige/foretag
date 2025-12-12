# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify
### SEO cron (optional)

```
npm run cron:seo
# Generates static ride HTML pages (up to 500, configurable via RIDE_PAGES_LIMIT)
# and updates public/build sitemaps.
```

## Deployment (GitHub + Vercel)

- Source of truth: GitHub repo `codecsverige/vagvanner` (branch `main`).
- Vercel: Connected to the repo; it builds with Node 18 and outputs `build/`.
- `vercel.json` ensures CRA SPA rewrites (all routes → `/index.html`), while static `legal/`, `ride/`, `static/` and assets serve directly.
- To publish: push to `main`. Vercel will auto-deploy.
- Firebase Hosting is disabled to avoid conflicts.

### Release via Pull Request

- Create a PR into `main` to trigger a review/approval flow for production deploy on Vercel.
- After merging the PR, Vercel deploys production automatically.

ملاحظات (AR):
- النشر تلقائي عبر Vercel عند الدفع إلى GitHub (main).
- ملف `vercel.json` يضمن عمل SPA والصفحات الثابتة.
- Firebase معطّل؛ إبقِ النشر على Vercel.
# Final test - Tue Oct 28 09:10:00 AM UTC 2025

# All workflows fixed - Tue Oct 28 09:11:02 AM UTC 2025
