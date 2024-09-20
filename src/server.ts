import express from "express";
import cors from "cors";
import authRoute from './routes/authRoute'

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "http://localhost:5000" }));


app.use('/api', authRoute)


app.all('*',(req, res) => {
  res.json({
    error: "API Route doesn't Exists",
    url: req.url
  }).status(404)
})

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});
