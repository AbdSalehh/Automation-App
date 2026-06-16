import { requestExternal } from "@/shared/server/httpClient";
import { resolveTemplate } from "@/shared/server/templating";
import { getGoogleAccessToken } from "@/shared/server/google";
import type { Item, NodeHandler } from "../types";
import { loadCredential } from "../credentials";
import { toItems } from "../utils";

/** Google Calendar — daftar event mendatang. */
export const googleCalendarListEventsHandler: NodeHandler = async ({
  node,
  context,
  config,
}) => {
  const credential = await loadCredential(
    node.data.credentialId,
    context.ownerId,
  );

  if (!credential) {
    throw new Error("Google Calendar: kredensial tidak ada");
  }

  const accessToken = await getGoogleAccessToken(credential);
  const calendarId = credential.calendarId || "primary";
  const maxResults = Number(config.maxResults ?? 10);
  const timeMin = config.timeMin
    ? String(config.timeMin)
    : new Date().toISOString();

  const eventsResponse = await requestExternal(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?maxResults=${maxResults}&timeMin=${encodeURIComponent(timeMin)}&singleEvents=true&orderBy=startTime`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!eventsResponse.ok) {
    throw new Error("Google Calendar: gagal mengambil daftar event");
  }

  return eventsResponse.body;
};

/** Google Calendar — buat event baru. */
export const googleCalendarCreateEventHandler: NodeHandler = async ({
  node,
  input,
  context,
  config,
}) => {
  const credential = await loadCredential(
    node.data.credentialId,
    context.ownerId,
  );

  if (!credential) {
    throw new Error("Google Calendar: kredensial tidak ada");
  }

  const accessToken = await getGoogleAccessToken(credential);
  const calendarId = credential.calendarId || "primary";
  const item = (toItems(input)[0] ?? {}) as Item;

  const eventBody = {
    summary: resolveTemplate(String(config.summary ?? ""), item),
    description: config.description
      ? resolveTemplate(String(config.description), item)
      : undefined,
    location: config.location ? String(config.location) : undefined,
    start: {
      dateTime: String(config.startDateTime ?? new Date().toISOString()),
      timeZone: String(config.timeZone ?? "UTC"),
    },
    end: {
      dateTime: String(
        config.endDateTime ?? new Date(Date.now() + 3600000).toISOString(),
      ),
      timeZone: String(config.timeZone ?? "UTC"),
    },
    attendees: config.attendees
      ? (config.attendees as string[]).map((email) => ({ email }))
      : undefined,
  };

  const createResponse = await requestExternal(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      data: eventBody,
    },
  );

  if (!createResponse.ok) {
    throw new Error("Google Calendar: gagal membuat event");
  }

  return createResponse.body;
};
