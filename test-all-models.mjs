import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  .then(res => res.json())
  .then(data => {
    if (data.models) {
      console.log(JSON.stringify(data.models.map(m => m.name)));
    } else {
      console.log(data);
    }
  })
  .catch(console.error);
