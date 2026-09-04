/// bun 1-index.ts
const response = await fetch("https://openrouter.ai/api/v1/responses", {
    method: "POST",
    headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        model: "openai/gpt-5.6-luna",
        input: "Qual a melhor ferramenta para testes em Javascript? Seja objetivo!... Vitest. Como instalar?"
    })
});

const output = await response.json() as any;
console.log(JSON.stringify(output, undefined, 2));