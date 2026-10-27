import type { Plan } from "../plan.ts";

export const plan: Plan = {
  workId: "WORK-1",
  driver: "surf",
  base: "https://app.example.invalid",
  tests: [
    {
      id: "1",
      claim: "Delete removes the ticked row",
      pass: "The row is gone",
      fail: "The row is still listed",
      steps: [
        { do: "navigate", says: "Open the list.", to: "/list", shot: "list" },
        { do: "wait", locator: "[data-testid=grid] .row" },
        { do: "click", says: "Tick the first row.", locator: "[data-testid=grid] .row label", dom: true },
        { do: "expect", says: "Check the row reads \"1 selected\".", locator: "[data-testid=selected]", text: "1 selected", shot: "selected" },
        { do: "click", says: "Select Delete.", locator: "button[id$='-confirm']" },
        { do: "wait", locator: "[data-testid=grid] .row[row-id=\"1\"]", gone: true },
        { do: "expect", says: "Check the row is gone.", locator: "[data-testid=grid] .row[row-id=\"1\"]", visible: false, shot: "gone" },
        { do: "capture", says: "Note the page title.", locator: "h1", as: "title" },
        { do: "scroll", locator: "footer" },
        { do: "human", needs: "Confirm the email arrived." },
      ],
    },
  ],
};

export const test = plan.tests[0]!;
