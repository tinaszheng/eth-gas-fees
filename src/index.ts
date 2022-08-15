import bodyParser from "body-parser";
import express from "express";
import { CHAIN_INFO, SupportedChainId, SUPPORTED_CHAINS } from "src/provider";

const app = express();
const port = process.env.PORT || 3333;

app.use(bodyParser.json());
app.use(bodyParser.raw({ type: "application/vnd.custom-type" }));
app.use(bodyParser.text({ type: "text/html" }));

app.get("/", async (req, res) => {
  const queryChain = Number(req.query.chainId)
  if (!SUPPORTED_CHAINS.includes(queryChain)) {
    res.json({ error: "Chain not supported!"})
    return
  }


  res.json({ info: CHAIN_INFO[queryChain as SupportedChainId].nativeCurrency });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
