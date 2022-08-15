import bodyParser from "body-parser";
import express from "express";
import { CHAIN_INFO, SupportedChainId, SUPPORTED_CHAINS } from "./provider";
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

  const { from, to, value, data } = req.query
  const transactionRequest = { chainId, from: String(from), to: String(to), value: String(value), data: String(data) }
  const response = await calculateGasFee(transactionRequest)
  res.json(response);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
