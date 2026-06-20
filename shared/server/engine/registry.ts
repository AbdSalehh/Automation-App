import type { NodeKind } from "@/entities/workflow/model/node.model";
import type { FlowNode } from "@/entities/workflow/model/workflow.model";
import type { NodeHandler, NodeRunArgs, RunContext } from "./types";

import { whatsappSendHandler, whatsappTriggerHandler } from "./nodes/whatsapp";
import { telegramSendHandler, telegramTriggerHandler } from "./nodes/telegram";
import { httpRequestHandler } from "./nodes/http";
import { gmailSendHandler } from "./nodes/gmail";
import { aiGeminiHandler } from "./nodes/gemini";
import {
  googleDriveUploadHandler,
  googleDriveListHandler,
} from "./nodes/google-drive";
import {
  googleSheetsCreateHandler,
  googleSheetsAppendHandler,
  googleSheetsReadHandler,
  googleSheetsUpdateHandler,
} from "./nodes/google-sheets";
import {
  googleCalendarListEventsHandler,
  googleCalendarCreateEventHandler,
} from "./nodes/google-calendar";
import { supabaseInsertHandler, supabaseQueryHandler } from "./nodes/database";
import {
  filterHandler,
  conditionHandler,
  functionHandler,
  transformHandler,
  dateCalculatorHandler,
  scheduleHandler,
  waitReplyHandler,
  passthroughTriggerHandler,
} from "./nodes/logic";
import {
  switchHandler,
  mergeHandler,
  loopHandler,
  noOpHandler,
} from "./nodes/flow";
import { slackSendHandler } from "./nodes/slack";
import { discordSendHandler } from "./nodes/discord";
import { rssReadHandler } from "./nodes/rss";
import { aiOpenAiHandler } from "./nodes/openai";

/**
 * Registry pemetaan jenis node ke handler-nya. Menambah konektor baru cukup
 * dengan menulis handler di `nodes/*` lalu mendaftarkannya di sini.
 */
const NODE_HANDLERS: Partial<Record<NodeKind, NodeHandler>> = {
  manual_trigger: passthroughTriggerHandler,
  schedule_trigger: passthroughTriggerHandler,
  google_sheets_trigger: passthroughTriggerHandler,
  google_calendar_trigger: passthroughTriggerHandler,
  webhook_trigger: passthroughTriggerHandler,

  whatsapp_trigger: whatsappTriggerHandler,
  whatsapp_send: whatsappSendHandler,

  telegram_send: telegramSendHandler,
  telegram_trigger: telegramTriggerHandler,

  http_request: httpRequestHandler as NodeHandler,

  ai_gemini: aiGeminiHandler,
  gmail_send: gmailSendHandler,

  google_drive_upload: googleDriveUploadHandler,
  google_drive_list: googleDriveListHandler,

  google_sheets_create: googleSheetsCreateHandler,
  google_sheets_append: googleSheetsAppendHandler,
  google_sheets_read: googleSheetsReadHandler,
  google_sheets_update: googleSheetsUpdateHandler,

  google_calendar_list_events: googleCalendarListEventsHandler,
  google_calendar_create_event: googleCalendarCreateEventHandler,

  supabase_insert: supabaseInsertHandler,
  supabase_query: supabaseQueryHandler,

  filter: filterHandler,
  condition: conditionHandler,
  function: functionHandler,
  transform: transformHandler,
  date_calculator: dateCalculatorHandler,
  schedule: scheduleHandler,
  wait_reply: waitReplyHandler,

  switch: switchHandler,
  merge: mergeHandler,
  loop: loopHandler,
  no_op: noOpHandler,

  slack_send: slackSendHandler,
  discord_send: discordSendHandler,
  rss_read: rssReadHandler,
  ai_openai: aiOpenAiHandler,
};

/** Executes a single node and returns its output. */
export async function runNode(
  node: FlowNode,
  input: unknown,
  context: RunContext,
): Promise<unknown> {
  const nodeKind = node.data.kind as NodeKind;
  const config = node.data.config ?? {};

  const handler = NODE_HANDLERS[nodeKind];

  /** Node tanpa handler khusus meneruskan input apa adanya. */
  if (!handler) {
    return input;
  }

  const args: NodeRunArgs = { node, input, context, config };

  return handler(args);
}
