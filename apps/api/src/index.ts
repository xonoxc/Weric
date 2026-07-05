// @weric/api — HTTP interface (Hono + Effect)

import { Hono } from "hono"

const app = new Hono()

app.get("/health", c => c.json({ status: "ok", version: "0.1.0" }))

export default app
