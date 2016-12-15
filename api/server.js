import express from 'express';

const app = express();
const port = 5000;

app.get('/', (req, res) => {
  res.send('EYO!');
});

app.listen(port);

console.log(`Server listening at port: ${port}`)
