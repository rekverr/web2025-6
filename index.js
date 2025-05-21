import express from 'express';
import { Command } from 'commander';

const program = new Command();

program
  .requiredOption('-h, --host <host>', 'Server host')
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-c, --cache <path>', 'Cache directory path')
  .parse(process.argv);

const {port, host, cache} = program.opts();

const app = express();

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(Number(port), host, () => {
  console.log(`Server started at http://${host}:${port}`);
  console.log(`Cache directory: ${cache}`);
});
