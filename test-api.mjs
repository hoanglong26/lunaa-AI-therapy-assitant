import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  .then(res => res.json())
  .then(data => {
    if (data.models) {
      const embedModels = data.models.filter(m => 
        m.supportedGenerationMethods && m.supportedGenerationMethods.includes("embedContent")
      );
      console.log(embedModels.map(m => m.name));
    } else {
      console.log(data);
    }
  })
  .catch(console.error);
