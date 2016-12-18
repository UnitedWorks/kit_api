import express from 'express';
import { db } from './bookshelf';

const app = express();
const port = process.env.PORT;

app.get('/', (req, res) => {
  const payload = { message: 'EYO' };
  res.status(200).send(payload);
});

app.get('/health_check', (req, res) => {
  res.status(200).send("I'm not dead yet!");
});

app.listen(port);

console.log(`Server listening at port: ${port}`);
