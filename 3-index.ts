import * as readline from "node:readline/promises";

/// bun 3-index.ts
type Msg = { role: "user" | "assistant", content: string };
const messages: Msg[] = [];

async function callLLM() {
    const response = await fetch("https://openrouter.ai/api/v1/responses", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "openai/gpt-5.6-luna",
            input: messages
        })
    });

    const output = await response.json() as any;
    return output;
}

const r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

while (true) {
    const input = (await r1.question(" > ")).trim();
    if (input === "/sair") break;
    messages.push({ role: "user", content: input });
    const output = await callLLM();
    const assistantOutput = output.output.find((o: any) => o.type === "message" && o.role === "assistant");
    const answer = assistantOutput.content.find((c: any) => c.type === "output_text");
    messages.push({ role: "assistant", content: answer.text });
    console.log(answer.text);
}

r1.close();
