import * as readline from "node:readline/promises";

/// bun 2-index.ts
async function callLLM(input: string) {
    const response = await fetch("https://openrouter.ai/api/v1/responses", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "openai/gpt-5.6-luna",
            input
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
    const output = await callLLM(input);
    console.log(JSON.stringify(output, undefined, 2));
    const finalAnswer = output.output.find((o: any) => o.type === "message" && o.role === "assistant");
    console.log('finalAnswer');
    console.log(JSON.stringify(finalAnswer, undefined, 2));
}

r1.close();