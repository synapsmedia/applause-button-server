# Applause Button Server

A self-hosted server for the [applause button](https://github.com/ColinEberhardt/applause-button) — adds claps/kudos to any web page.

A free public instance is available at **[applause.synaps.media](https://applause.synaps.media)**.

## API

All endpoints support CORS.

### `GET /`

Landing page with a live demo and usage instructions.

### `GET /get-claps`

Returns the clap count for a URL. The URL is determined from the `?url=` query parameter or the `Referer` header.

**Response:** `number` (e.g. `42`)

### `POST /update-claps`

Increments the clap count for a URL. The URL is determined from the `Referer` header or `?url=` query parameter.

**Request body:** A number between 1–10 (clamped automatically).

**Response:** `number` — the new total clap count.

Consecutive claps from the same IP address on the same URL are blocked.

### `POST /get-multiple`

Returns clap counts for multiple URLs at once (max 100).

**Request body:** JSON array of URL strings.

**Response:** `[{ "url": "example.com/page", "claps": 10 }, ...]`

### `GET /health`

Health check endpoint.

**Response:** `{ "status": "ok" }`

## Self-Hosting

### Prerequisites

- Docker and Docker Compose

### Quick Start

```bash
git clone https://github.com/synapsmedia/applause-button-server.git
cd applause-button-server
cp .env.example .env
docker compose up -d
```

The server will be available at `http://localhost:3000`.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `CORS_ORIGIN` | `*` | Allowed CORS origins (comma-separated or `*`) |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX` | `100` | Max requests per window per IP |
| `TRUST_PROXY` | `1` | Express trust proxy setting (for correct client IP behind a reverse proxy) |

### Development

```bash
npm install
npm run dev
```

Requires a running Redis instance (or use `docker compose up redis`).

### Testing

```bash
npm test
```

## License

MIT
