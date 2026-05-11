import { test, Locator, Page, expect } from '@playwright/test'
import { getCurrentTime } from '../utils/timer';
import { Assert } from '../utils/assertions';

export class createauth {

    readonly page: Page;
    
    readonly errormessage: Locator;
    readonly authnumber: Locator;
    readonly clickpvendorcheckbox: Locator;
    readonly clickvendorlist: Locator;
    readonly selectvendor: Locator;
    readonly clickutilization: Locator;
    readonly clickpayer: Locator;
    readonly selectpayer: Locator
    readonly clickservice: Locator;
    readonly selectservice: Locator;
    readonly selectstartdate: Locator;
    readonly selectenddate: Locator;
    readonly clickfrequency: Locator;
    readonly selectfrequency: Locator;
    readonly selectunitsbyfre: Locator;
    readonly clickunittype: Locator;
    readonly selectunittype: Locator;
    readonly unitrate: Locator;
    readonly totoalunits: Locator;
    readonly authrule: Locator;
    readonly clicksave: Locator;
    readonly savemessage: Locator;
    readonly authpagess: Locator;
    readonly summary: Locator;
    readonly sameauthnumber: Locator;
    readonly getvalidation: Locator
    readonly closevalidation: Locator;
    readonly cancelauth: Locator;
    readonly getauthnum: Locator;
    readonly clickclientvendorcheckbox: Locator;
    readonly clickclientvendorlist: Locator;
    readonly selectclientvendor: Locator;


    constructor(page: Page) {

        this.page = page;
        this.page.setDefaultTimeout(100000);
        this.errormessage = page.locator(`//*[@class='text-red-500 text-xs']`);
        this.authnumber = page.locator(`//*[@id='authorization_number']`);
        this.clickpvendorcheckbox = page.locator(`//span[normalize-space()='Vendor']/ancestor::label//button[@role='checkbox']`);
        this.clickvendorlist = page.getByPlaceholder('Search Vendor');
        this.selectvendor = page.locator(`//*[@class='h-full w-full rounded-[inherit] max-h-[19rem]']//div//div[contains(@class,'relative flex cursor-default select-none items-center')]`);
        this.clickutilization = page.locator(`//span[normalize-space()='Miles']/ancestor::label//button[@role='checkbox']`);
        this.clickpayer = page.getByText('Select Payer');
        this.selectpayer = page.getByText('WI IRIS-IRISW(IRIS-WI)')
        this.clickservice = page.getByText('Select Service');
        this.selectservice = page.locator(`//*[@class='h-full w-full rounded-[inherit] max-h-40']//div//div`);
        this.selectstartdate = page.locator(`//*[@for='start_date']/following-sibling::div[@class='flex relative align-center text-sm h-9 w-[150px]']//input`);
        this.selectenddate = page.locator("//*[@for='end_date']/following-sibling::div[@class='flex relative align-center text-sm h-9 w-[150px]']//input");
        this.clickfrequency = page.getByText('Select', { exact: true }).first();
        this.selectfrequency =  page.getByText('Monthly', { exact: true });
        this.selectunitsbyfre = page.locator('//input[@id="units_by_frequency"]');
        this.clickunittype = page.getByText('Select', { exact: true }).last();
        this.selectunittype = page.getByText('Day');
        this.unitrate =page.locator("//div[@class='bg-white flex items-center relative border border-kgray-600 rounded-md focus-within:border-[#333] mb-[2px] w-[110px] h-9 text-sm']//input[@type='number']");
        this.totoalunits = page.locator('#total_units');
        this.authrule = page.locator(`//span[normalize-space()='Hard Stop']/ancestor::label//button[@role='checkbox']`);
        this.clicksave = page.getByText('Save');
        this.savemessage = page.locator(`//*[@class='Toastify__toast-body']`);
        this.authpagess = page.locator(`(//*[@class='bg-body font-lato text-[#333]'])[1]`);
        this.summary = page.locator(`//div[@class='pt-2']`);
        this.sameauthnumber = page.locator(`//*[@role='dialog']`);
        this.getvalidation = page.locator(`//td[@class='text-sm py-1 px-4 w-full false']`);
        this.closevalidation = page.locator(`//button[contains(@class,'h-6 w-6 bg-white absolute right-4 top-4 rounded')]`);
        this.cancelauth = page.getByText('Cancel');
        this.getauthnum = page.locator(`//table[@class='w-full caption-bottom text-sm relative']//tbody/tr//td//div//div//span[@class='cursor-pointer w-fit font-semibold text-[#0747a6]']`);
        this.clickclientvendorcheckbox = page.locator(`//span[normalize-space()='Client Vendor']/ancestor::label//button[@role='checkbox']`);
        this.clickclientvendorlist = page.getByPlaceholder('Search client vendor');
        this.selectclientvendor = page.locator(`//*[@class='h-full w-full rounded-[inherit] max-h-[19rem]']//div//div[contains(@class,'relative flex cursor-default select-none items-center')]`);


    }

    async saveemptyauth(blankauth: string) {
        await this.authnumber.click();
        await this.authnumber.fill(blankauth);
        await this.clicksave.click();
        await this.authpagess.screenshot({ path: 'screenshots/' + 'blankauth' + '_' + getCurrentTime() + '.png' })
        let error: string[] = await this.errormessage.allInnerTexts();
        console.log("Error message for blank auth number:\n" + error.join('\n'));
    }
    async publicvendor(enterauth: string): Promise<boolean> {
        await this.authnumber.click();
        await this.authnumber.fill(enterauth);
        console.log('Added authorization is: ' + enterauth);
        await this.clickpvendorcheckbox.check();
        await this.clickvendorlist.click();
        if (await this.page.getByText('No results found').count() > 0) {
            console.log('❌ No Public vendor found');
            return false;
        }
        await this.page.waitForTimeout(4000);
        let publicvendorcount = await this.selectvendor.count();
        console.log('Total public vendors found: ' + publicvendorcount);
        const randomIndex = Math.floor(Math.random() * publicvendorcount);
        console.log('Public vendor index selected:', randomIndex);
        await this.selectvendor.nth(randomIndex).click();
        await this.clickutilization.check();
        await this.clickpayer.click();
        await this.selectpayer.click();
        await this.clickservice.click();
        await this.page.waitForTimeout(4000);
        let servicecount = await this.selectservice.count();
        console.log('Total service found: ' + servicecount);
        const randomservice = Math.floor(Math.random() * servicecount);
        console.log('Service index selected:', randomservice);
        await this.selectservice.nth(randomservice).click();
        await this.selectstartdate.fill('12/01/2025');
        await this.selectenddate.fill('01/01/2026')
        await this.clickfrequency.click();
        await this.selectfrequency.click();
        await this.selectunitsbyfre.fill('10');
        await this.clickunittype.click();
        await this.selectunittype.click();
        await this.unitrate.fill(`10`)
        await this.totoalunits.fill(`10`)
        await this.authrule.check();    //enables only if unchecked
    }
    async authsave(enterauth: string) {
        await this.clicksave.click();

        try {
            await expect(this.savemessage).toBeVisible();
            console.log('✅ Auth saved successfully');
        } catch {
            console.log('❌ Auth not saved');
        }
        await this.authpagess.screenshot({ path: `screenshots/${enterauth}_${getCurrentTime()}.png` })
        // await this.page.waitForTimeout(3000);
        if (await this.sameauthnumber.isVisible()) {
            await this.sameauthnumber.screenshot({ path: `screenshots/duplicateauth_${getCurrentTime()}.png` });
            let validation: string = await this.getvalidation.innerText();
            console.log("Validation:\n" + validation);
            await this.closevalidation.click();
            await this.cancelauth.click();
        }
    }
    
    
    async opencreatedauth(enterauth: string): Promise<Assert> {
        await this.page.getByText(enterauth, { exact: true }).click();
        const addedauth = await this.page.waitForEvent('popup')
        return new Assert(addedauth);

    }

    async clientvendor(enterauth: string): Promise<boolean> {
        await this.authnumber.click();
        await this.authnumber.fill(enterauth);
        console.log('Added authorization is: ' + enterauth);
        await this.clickclientvendorcheckbox.check();
        await this.clickclientvendorlist.click();
        await this.page.waitForTimeout(4000);
        if (await this.page.getByText('No results found').count() > 0) {
            console.log('❌ No client vendor found');
            return false;
        }
        let clientvendorcount = await this.selectclientvendor.count();
        console.log('Total client vendors found: ' + clientvendorcount);
        const randomIndex = Math.floor(Math.random() * clientvendorcount);
        console.log('client vendor index selected:', randomIndex);
        await this.selectclientvendor.nth(randomIndex).click();
        await this.clickutilization.check();
        await this.clickpayer.click();
        await this.selectpayer.click();
        await this.clickservice.click();
        await this.page.waitForTimeout(4000);
        let servicecount = await this.selectservice.count();
        console.log('Total service found: ' + servicecount);
        const randomservice = Math.floor(Math.random() * servicecount);
        console.log('service Index selected:', randomservice);
        await this.selectservice.nth(randomservice).click()
        await this.selectstartdate.fill('12/01/2025');
        await this.selectenddate.fill('01/01/2026')
        await this.clickfrequency.click();
        await this.selectfrequency.click();
        await this.selectunitsbyfre.fill('10');
        await this.clickunittype.click();
        await this.selectunittype.click();
        await this.unitrate.fill(`10`)
        await this.totoalunits.fill(`10`)
        await this.authrule.check();    //enables only if unchecked
    }
}