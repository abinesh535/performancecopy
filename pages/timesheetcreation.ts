import { Page, Locator, expect } from '@playwright/test';

export class TMCreation {
  public readonly page: Page;
  public ClientSearch: Locator;
  public CaregiverSearch: Locator;
  public readonly headerCheckbox: Locator;
  public readonly firstRowCheckbox: Locator;
  public readonly Date: Locator;
  public readonly CheckIn: Locator;
  public readonly CheckOut: Locator;
  public readonly EditedHours: Locator;
  public readonly Miles: Locator;
  public readonly Cl_Sign: Locator;
  public readonly ClientDate: Locator;
  public readonly SaveAsVisit: Locator;
  public readonly Save_Approve: Locator;
  public readonly Marking_visit: Locator;

  constructor(page: Page) {
    this.page = page;
    this.ClientSearch = page.getByPlaceholder('Search Client')
    this.CaregiverSearch = page.getByPlaceholder('Search Caregiver')
    // FIX: Use input[type="checkbox"] inside the header cell
    this.headerCheckbox = page.locator("(//*[@class='[&_tr]:border-b bg-secondary sticky top-0 z-10'])[1]//th[2]//button[@role='checkbox']");
    this.firstRowCheckbox = page.locator("(//*[@class='[&_tr:last-child]:border-0'])[2]//tr[1]//td[2]//button[@role='checkbox']");
    this.Date = page.locator("(//*[@class='[&_tr:last-child]:border-0'])[2]//tr[1]//td[3]//input[@placeholder='mm/dd/yyyy']");
    this.CheckIn = page.locator("(//tbody[@class='[&_tr:last-child]:border-0'])[2]//tr[1]//input[@name='check-in']");
    this.CheckOut = page.locator("(//tbody[@class='[&_tr:last-child]:border-0'])[2]//tr[1]//input[@name='check-out']");
    this.EditedHours = page.locator("(//*[@class='[&_tr:last-child]:border-0'])[2]//tr[1]//td[8]//input[@placeholder='HH:MM']");
    this.Miles = page.locator("(//*[@class='[&_tr:last-child]:border-0'])[2]//tr[1]//td[9]//input[@type='number']");
    // this.Cl_Sign = page.locator("(//*[@class='[&_tr:last-child]:border-0'])[2]//tr[1]//td[11]//button[@role='checkbox']");
    this.Cl_Sign = page.locator("((//tbody[@class='[&_tr:last-child]:border-0'])[2]//tr[1]//button[@role='checkbox'])[3]");
    // this.ClientDate = page.locator("(//*[@class='[&_tr:last-child]:border-0'])[2]//tr[1]//td[12]//input[@placeholder='mm/dd/yyyy']");
    this.ClientDate = page.locator("((//tbody[@class='[&_tr:last-child]:border-0'])[2]//tr[1]//input[@placeholder='mm/dd/yyyy'])[2]");
    this.SaveAsVisit = page.locator(':text-is("Save as Visit")')
    this.Save_Approve = page.locator(':text-is("Save & Approve")')
    this.Marking_visit = page.locator(':text-is("Marking_visit")')

  }

  // ---------------Clientselection, Caregiverselection-------------------------

  // async selectclient(Client: string) {

  //   await this.ClientSearch.click();
  //   await this.ClientSearch.fill(Client);
  //   const clientOption = this.page.getByText(Client, { exact: true });
  //   await expect(clientOption).toBeVisible({ timeout: 10000 });
  //   await clientOption.click();
  //   console.log('client is selected');
  // } 

  // async selectcaregiver(Caregiver: string) {
  //   await this.CaregiverSearch.click();
  //   await this.CaregiverSearch.fill(Caregiver);
  //   console.log('caregiver is selected');
  // }

  // client dropdown with API wait
  async selectclient(Client: string) {
    await this.ClientSearch.click();
    await this.ClientSearch.fill(Client);

    const clientOption = this.page.getByText(Client, { exact: true });
    await expect(clientOption).toBeVisible({ timeout: 10000 });

    // ✅ WAIT FOR API RESPONSE + CLICK TOGETHER
    await Promise.all([
      this.page.waitForResponse(async (response) => {
        const url = response.url();

        // 👉 CHANGE THIS to your real API endpoint keyword
        return (
          url.includes('Employee') &&   // example keyword
          response.status() === 200
        );
      }),

      clientOption.click()
    ]);
  }
  // caregiver dropdown with API wait

  async selectcaregiver(Caregiver: string) {
    await this.CaregiverSearch.click();
    await this.CaregiverSearch.fill(Caregiver);
    await Promise.all([
      this.page.waitForResponse(async (response) => {
        const url = response.url();

        // 👉 CHANGE THIS to your real API endpoint keyword
        return (
          url.includes('services') &&   // example keyword
          response.status() === 200
        );
      }),

      this.CaregiverSearch.click()
    ]);
  }


  // --------------Fillingtimesheetdetails------------------------------------------schedules
  async fillFirstRow() {
    // uncheck header checkbox if checked
    await this.headerCheckbox.waitFor({ state: 'visible' });
    await expect(this.headerCheckbox).toBeEnabled();
    await this.headerCheckbox.click({ force: true });
    await expect(this.headerCheckbox).toBeVisible({ timeout: 15000 });
    // select first row checkbox
    await expect(this.firstRowCheckbox).toBeEnabled();
    await this.firstRowCheckbox.check({ force: true });
    await expect(this.firstRowCheckbox).toBeVisible({ timeout: 15000 });

    // enter date
    const currentDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    await this.Date.click();
    await this.Date.fill(currentDate);
    await expect(this.Date).toBeVisible({ timeout: 15000 });

    // check-in time
    await expect(this.CheckOut).toBeVisible({ timeout: 1000 });
    await this.CheckIn.click();
    await this.CheckIn.fill('08:00 AM');

    await expect(this.CheckOut).toBeVisible({ timeout: 1000 });
    await this.CheckOut.click();
    await this.CheckOut.fill('05:00 PM');

  }

  async Approving_visit(){
    
    await this.Save_Approve.click({ timeout: 20000, force: true });
     console.log('Timesheet approved successfully');

  }
  // marking as draft
  async Marking_Draft(){
    await this.SaveAsVisit.click({ timeout: 20000, force: true });
    console.log('Save as Visit button clicked');
  }
  
  // -----------------------create timesheet method------------------------------
  // main method to create timesheet with client and caregiver details

  async createTimesheet(client: string, caregiver: string) {
    await this.selectclient(client);
    await this.selectcaregiver(caregiver);
    await this.fillFirstRow();
    await this.Approving_visit();


  }
}
