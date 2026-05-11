import { Page } from '@playwright/test';
import { TMCreation } from './timesheetcreation';
import { Timesheetmenu } from './timesheetmenu';

export async function runTimesheetFlow(page: Page) {

  // 👉 Menu navigation
  const timesheetMenu = new Timesheetmenu(page);
  await timesheetMenu.ManualTimesheetPageRedirect();

  if (!timesheetMenu.newPage) {
    throw new Error("Timesheet page not opened");
  }

  const tsPage = timesheetMenu.newPage;

  // 👉 Create timesheet
  const tmCreation = new TMCreation(tsPage);

  await tmCreation.createTimesheet(
    "ACKERMAN, KRYSTAL R (WIE056683)",
    "ABBOTT118, GIDEON118 (124330)"
  );

}