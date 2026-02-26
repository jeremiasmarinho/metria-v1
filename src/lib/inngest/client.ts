import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "metria",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
