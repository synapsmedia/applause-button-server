import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;

  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Applause Button Server</title>
  <link rel="stylesheet" href="https://unpkg.com/applause-button/dist/applause-button.css" />
  <script src="https://unpkg.com/applause-button/dist/applause-button.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a2e;
      background: #f8f9fa;
      padding: 2rem 1rem;
    }
    .container { max-width: 640px; margin: 0 auto; }
    h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .subtitle { color: #6c757d; margin-bottom: 2rem; }
    .demo {
      background: #fff;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      margin-bottom: 2rem;
    }
    .demo p { margin-bottom: 1rem; color: #495057; }
    h2 { font-size: 1.25rem; margin-bottom: 0.75rem; }
    pre {
      background: #1a1a2e;
      color: #e9ecef;
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 0.875rem;
      line-height: 1.5;
      margin-bottom: 2rem;
    }
    code { font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, monospace; }
    a { color: #4361ee; }
    .footer { color: #6c757d; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Applause Button Server</h1>
    <p class="subtitle">Add claps and kudos to any web page.</p>

    <div class="demo">
      <p>Try it out:</p>
      <applause-button style="width: 58px; height: 58px;" api="${baseUrl}" url="${baseUrl}/demo2" />
    </div>

    <h2>Usage</h2>
    <pre><code>&lt;head&gt;
  &lt;link rel="stylesheet"
    href="https://unpkg.com/applause-button/dist/applause-button.css" /&gt;
  &lt;script src="https://unpkg.com/applause-button/dist/applause-button.js"&gt;&lt;/script&gt;
&lt;/head&gt;

&lt;body&gt;
  &lt;applause-button
    style="width: 58px; height: 58px;"
    api="${baseUrl}"
  /&gt;
&lt;/body&gt;</code></pre>

    <p class="footer">
      For full documentation, visit
      <a href="https://applause-button.com" target="_blank" rel="noopener">applause-button.com</a>.
      <br>
      Source code on
      <a href="https://github.com/synapsmedia/applause-button-server" target="_blank" rel="noopener">GitHub</a>.
    </p>
  </div>

</body>
</html>`);
});

export default router;
