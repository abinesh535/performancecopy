import { Page, Locator, expect } from '@playwright/test';

export class Timesheetmenu {

    public readonly page: Page;
    public newPage?: Page;
    public readonly TimesheetMenu: Locator;
    public readonly ManualTimesheet: Locator;


    constructor(page: Page) {
        this.page = page;
        this.TimesheetMenu = page.locator(':text-is("Timesheet")');
        this.ManualTimesheet = page.locator(':text("Add New Manual Timesheet")');

    }

    // ---------------- menuclicking ----------------

    async ManualTimesheetPageRedirect() {

        await expect(this.TimesheetMenu).toBeVisible({ timeout: 10000 });
        await this.TimesheetMenu.click();
        // ✅ Proper popup handling
        const [popup] = await Promise.all([
            this.page.context().waitForEvent('page'),
            this.ManualTimesheet.click({ force: true })
        ]);
        this.newPage = popup;

        await popup.waitForLoadState('domcontentloaded');

    }


    // ---------------- Filterapplication ----------------

    async TimesheetCreationBYFilter() {

        const targetPage = this.newPage ?? this.page;

        // Expand configuration section
        const ConfigSection =
            targetPage.getByText('Timesheet Configure Format', { exact: true });

        await ConfigSection.click({ force: true });

        // ✅ Wait until List View option appears instead of timeout
        const TimesheetBy =
            targetPage.locator('label').filter({ hasText: 'List View' });

        await TimesheetBy.waitFor({ state: 'visible' });

        await TimesheetBy.click({ force: true });
        await targetPage.waitForLoadState('networkidle');


        // Apply filter
        const filterApply =
            targetPage.locator('button').filter({ hasText: 'Apply' });

        await filterApply.waitFor({ state: 'visible' });

        await filterApply.scrollIntoViewIfNeeded();
        await filterApply.click();

        // ✅ Wait for result instead of sleep
        await targetPage.waitForLoadState('networkidle');

    }
}