import fs from "fs";
import path from "path";

export async function handler(event, context) {
  const filePath = path.join(process.cwd(), "faqs.json");

  if (event.httpMethod === "GET") {
    const data = fs.readFileSync(filePath, "utf8");
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: data
    };
  }

  if (event.httpMethod === "POST") {
    const newFaqs = JSON.parse(event.body);

    fs.writeFileSync(filePath, JSON.stringify(newFaqs, null, 2), "utf8");

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "OK" })
    };
  }

  return { statusCode: 405, body: "Method Not Allowed" };
}
