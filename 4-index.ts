import { execFileSync } from "node:child_process";
import * as readline from "node:readline/promises";

let model = "openai/gpt-5.6-luna";
let reasoning = {
    effort: "medium",
    exclude: false
}
let log = null;

const tools = [
    {
        type: "function",
        name: "bash",
        description: "Executa comandos no bash. Utilize para listar, editar e executar arquivos",
        parameters: {
            type: "object",
            properties: {
                "command": { type: "string" }
            },
            required: ["command"],
            additionalProperties: false
        }
    }
];

async function callLLM(): Promise<any> {
    while (true) {
        const response = await fetch("https://openrouter.ai/api/v1/responses", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model,
                reasoning,
                input: messages,
                tools
            })
        });
        const output = await response.json() as any;

        const call = output.output.find((o: any) => o.type === "function_call");

        if (call) {
            messages.push(call);
            if (call.name === "bash") {
                const { command } = JSON.parse(call.arguments);
                try {
                    const result = execFileSync("bash", ["-lc", command], {
                        cwd: process.cwd(),
                        encoding: "utf8"
                    });
                    messages.push({ type: "function_call_output", call_id: call.call_id, output: result });
                } catch (error) {
                    console.error(error);
                }
            }
        } else {
            log = output;
            return output;
        }
    }

}


const r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

type Msg = { type?: string, call_id?: string, output?: string, role?: "user" | "assistant" | "system", content?: string };
let messages: Msg[] = [];

function initContext() {
    messages = [];
    messages.push({
        role: "system", content: `
        Você é um agente de codificação, especializado em desenvolvimento de software.

        Siga as regras abaixo:

        * Sempre responda em português, **em hipótese nenhuma responda em outro idioma**
        * Nunca responda sobre outros assuntos que não sejam relacionados com programação
        * Seja objetivo nas respostas, evite responder com mais de 5 linhas
        * Aceite somente perguntas em português, e caso o usuário pergunte em outro idioma, peça para que a pergunta seja em português e sobre programação
    ` });
}

initContext();

function getContextSize(messages: Msg[]) {
    let total = 0;
    for (const message of messages) {
        if (!message.content) continue;
        total += message.content.split(" ").length;
    }
    return total;
}

while (true) {
    const input = (await r1.question(`(${model}) > `)).trim();
    if (input === "/log") {
        console.log(JSON.stringify(log, undefined, 2));
        continue;
    }
    if (input.startsWith("/reasoning")) {
        const newReasoning = input.replace("/reasoning ", "");
        console.log(`New reasoning is ${newReasoning}`);
        reasoning.effort = newReasoning;
        continue;
    }
    if (input.startsWith("/model")) {
        const newModel = input.replace("/model ", "");
        console.log(`New model is ${newModel}`);
        model = newModel;
        continue;
    }
    if (input === "/context") {
        console.log(`${getContextSize(messages)} tokens`);
        continue;
    }
    if (input === "/clear") {
        initContext();
        console.clear();
        continue;
    }
    if (input === "/bye") break;
    messages.push({ role: "user", content: input });
    const output = await callLLM();
    const assistantOutput = output.output.find((o: any) => o.type === "message" && o.role === "assistant");
    const answer = assistantOutput.content.find((c: any) => c.type === "output_text");
    messages.push({ role: "assistant", content: answer.text });
    console.log(answer.text);
}

r1.close();

// Agent = Harness (estrutura) + LLM (cerebro)