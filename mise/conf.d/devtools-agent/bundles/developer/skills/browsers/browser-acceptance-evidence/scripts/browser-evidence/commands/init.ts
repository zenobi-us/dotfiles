import { Crust } from "@crustjs/core@^0.0.19";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import type { DriverName } from "../drivers/driver.ts";
import { manualTestsDir } from "../load-plan.ts";
import { die, guard } from "../sh.ts";

const PLAN_MODULE = resolve(import.meta.dir, "..", "plan.ts");
const DRIVERS: DriverName[] = ["playwright", "surf"];

const scaffold = (workId: string, driver: DriverName) => `import type { Plan } from "${PLAN_MODULE}";

export const plan: Plan = {
  workId: "${workId}",
  driver: "${driver}",
  base: "http://localhost:8090",
  environment: { account: "", branch: "" },

  preconditions: [
    // { id: "flag-x", desc: "feature_x is on",
    //   check: { goto: "/admin/flags", locator: "[data-testid=feature_x]", text: "on" } },
  ],

  tests: [
    {
      id: "1",
      claim: "TODO a short claim the reader can check",
      pass: "TODO what success looks like",
      fail: "TODO what failure looks like",
      requires: [],
      steps: [
        // \`says\` is the manual test step: what a person does, named the way the
        // screen names it. The locator beside it is how the driver finds the
        // same thing, and no reader ever sees it. Write every \`says\` first,
        // then attach the locators.
        { do: "navigate", says: "TODO open the page under test", to: "/", shot: "landing" },
        // { do: "wait", locator: "[data-testid=account-list]" },
        // { do: "click", says: "Select Upgrade now",
        //   locator: "getByRole(\\"link\\", { name: \\"Upgrade now\\" })" },
        // { do: "expect", says: "Confirm the billing portal opens",
        //   url: "portal\\\\.", shot: "portal" },
      ],
    },
  ],
};
`;

export async function init(dir: string, driver: DriverName): Promise<void> {
  await mkdir(join(dir, "shots"), { recursive: true });
  await mkdir(join(dir, "workflows"), { recursive: true });
  const file = join(dir, "plan.ts");
  if (existsSync(file)) die(`${file} already exists; refusing to overwrite a plan`);
  await writeFile(file, scaffold(basename(resolve(dir, "..")), driver));
  console.log(`created ${file}`);
  console.log(`created ${join(dir, "shots")}/ and ${join(dir, "workflows")}/`);
}

export const initCmd = new Crust("init")
  .meta({ description: "Scaffold plan.ts, shots/ and workflows/ in a manual-tests directory" })
  .args([{ name: "dir", type: "string", required: true, description: "<shared-context-root>/<work-id>/manual-tests" }])
  .flags({ driver: { type: "string", description: "playwright (default) or surf" } })
  .run(({ args, flags }) =>
    guard(async () => {
      const driver = (flags.driver ?? "playwright") as DriverName;
      if (!DRIVERS.includes(driver)) die(`--driver must be one of: ${DRIVERS.join(", ")}`, 2);
      await init(manualTestsDir(args.dir), driver);
    }),
  );
