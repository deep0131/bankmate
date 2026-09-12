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
      "- All monetary amounts and balances are in Indian Rupees (₹ / INR).\n" +
      "- Always use the Rupee symbol (₹) or INR when mentioning currency figures (e.g. ₹25,000, ₹1.5 Lakhs).\n" +
      "- When the user asks about recent transactions, payments, spending, or account statements, call the `transaction-table` tool.\n" +
      "- When the user asks about loan products, interest rates, calculating monthly loan payments (EMI), or comparing loan terms, call the `loan-calculator` tool.\n" +
      "- Always accompany tools with a short, friendly, and helpful summary message.",
    messages: await convertToModelMessages(messages),
    tools: chatTools,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
