import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from "ai";
import { type ChatUIMessage, chatTools } from "@/lib/ai/tools";

export async function POST(req: Request) {
  const { messages }: { messages: ChatUIMessage[] } = await req.json();

  const result = streamText({
    model: google("gemini-3.6-flash"),
    system:
      "You are Bankmate, an intelligent, helpful, and concise conversational net banking assistant.\n" +
      "- When the user asks about recent transactions, payments, spending, or account statements, call the `transaction-table` tool.\n" +
      "- When the user asks about loan products, mortgage rates, calculating monthly loan payments, or comparing loan terms, call the `loan-calculator` tool.\n" +
      "- Always accompany tools with a short, friendly, and helpful summary message.",
    messages: await convertToModelMessages(messages),
    tools: chatTools,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
