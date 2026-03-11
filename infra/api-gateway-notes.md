## API Gateway (HTTP API) – Notes

- **Pricing**
  - Billed **per request** plus data transfer.
  - No fixed capacity tier; more traffic = more requests × price.

- **Scaling & throughput**
  - Fully managed, horizontally scaled by AWS; you **do not size instances**.
  - Each account/region has **default quotas** (req/s and burst). For most apps these are high enough.
  - For very high‑traffic production, you **monitor quotas and 429/5XX**, then open an AWS support ticket to **raise API Gateway limits** in that region.

- **Relationship to Lambda**
  - API Gateway accepts requests and forwards them to your Lambda.
  - In this project, all routes go through a single `$default` Lambda defined in `infra/api.ts`.
  - **Reserved concurrency** on the Lambda (set to 20) caps:
    - Peak Lambda **compute usage**.
    - **Database pressure**, since each Lambda instance uses a single DB connection.
  - If traffic exceeds Lambda’s concurrency cap, API Gateway starts returning throttling errors (429/5XX), but **you still pay per request** hitting API Gateway.

- **Dev vs prod**
  - `sst dev` still deploys a **real public HTTP API** in your AWS account; the URL is internet‑reachable.
  - Local development usually hits a local proxy, but anyone with the API URL can call dev directly.

- **Abuse / cost protection**
  - Lambda reserved concurrency = **blast‑radius cap** for backend work and DB.
  - To limit **request‑volume cost** and abuse:
    - Use **rate limiting** in the app (Hono rate limiter is already configured per IP).
    - Consider **AWS WAF** with rate‑based rules in front of API Gateway.
    - Avoid exposing non‑user features (like `/doc`, `/swagger`) publicly; in this repo they are protected with Cognito auth.

