const express = require("express")
const sharp = require("sharp")
const cors = require("cors")
const fetch = require("node-fetch").default

const app = express()
const port = 5000
const base = "https://img.gamedistribution.com/"

app.use(cors())

app.get('/:img(*)', async (req, res) => {
    try {
        const path = req.params.img
        const url = `${base}${path}`
        const r = await fetch(url)

        if (!r.ok) {
            const body = await r.text().catch(() => "")
            return res.status(r.status).send(`fetch err: ${r.status} ${r.statusText}`)
        }

        const ab = await r.arrayBuffer()
        const buf = Buffer.from(ab)

        if (!buf.length) return res.status(404).send("empty image")

        res.set("Content-Type", r.headers.get("content-type") || "application/octet-stream")

        const q = req.query.size

        if (q) {
            const [w, h] = q.split("x").map(n => parseInt(n, 10))
            if (!w || !h || w <= 0 || h <= 0)
                return res.status(400).send("bad size param")

            try {
                const out = await sharp(buf).resize(w, h).toBuffer()
                return res.send(out)
            } catch (e) {
                return res.status(500).send("resize fail")
            }
        }

        res.send(buf)

    } catch (e) {
        res.status(500).send("server error")
    }
})

const srv = app.listen(port, () => {
    console.log(`listening ${port}`)
})

// graceful shutdown
process.on("SIGINT", () => {
    srv.close(() => {
        process.exit(0)
    })
})

process.on("SIGTERM", () => {
    srv.close(() => {
        process.exit(0)
    })
})
