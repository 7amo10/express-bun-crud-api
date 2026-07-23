import express from 'express';

const app = express();
const PORT = process.env.PORT || 3020;

app.use(express.json());

// Stage 0: Hello Server
app.get('/', (req, res) => {
  res.status(200).send('Hello, world! Welcome to the Task API.');
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
