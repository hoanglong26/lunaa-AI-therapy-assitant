require("dotenv").config({ path: ".env.local" });
const { generateText } = require("ai");
const { createGoogleGenerativeAI } = require("@ai-sdk/google");

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
});

async function main() {
  try {
    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: "Hello",
    });
    console.log("Success:", text);
  } catch (err) {
    console.error("API Error:", err);
  }
}
main();
