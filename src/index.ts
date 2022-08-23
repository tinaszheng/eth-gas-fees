import bodyParser from "body-parser";
import express from "express";
import { SUPPORTED_CHAINS } from "./provider";
import { calculateGasFee } from "./gasFee";

const app = express();
const port = process.env.PORT || 3333;

app.use(bodyParser.json());
app.use(bodyParser.raw({ type: "application/vnd.custom-type" }));
app.use(bodyParser.text({ type: "text/html" }));

app.get("/", async (req, res) => {
  const chainId = Number(req.query.chainId ?? -1)
  if (!SUPPORTED_CHAINS.includes(chainId)) {
    res.json({ error: "unsupported_chain_id"})
    return
  }
  try {
    const { from, to, value, data } = req.query
    const transactionRequest = { chainId, from: String(from), to: String(to), value: String(value), data: String(data) }
    
    const response = await calculateGasFee(transactionRequest)
    res.json(response);
  } catch (e) {
    res.json({ error: "server_error" })
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
