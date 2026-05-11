import { test, expect, chromium } from '@playwright/test';
import { kantimepage } from '../pages/menupage';
import { intakepage } from '../pages/addintake';
import { Assert } from '../utils/assertions';
import { intakepageedit } from '../pages/intakeprofile';
import { createauth } from '../pages/auth';
import { clientreport } from '../pages/clientlist';
import { faker } from '@faker-js/faker';
import { importauthactivities } from '../pages/importauth';
import { map } from '../pages/mapping';

const fakerauth = faker.word.words(1);
const enterauth = `auth${faker.number.int({ min: 100, max: 999 })}`;

let clientiris: clientreport;
test('@publicvendorauth Add public vendor auth from client', async ({ page }) => {
  test.slow();
  test.setTimeout(1 * 60 * 1000);
  await page.goto('https://staging.kantimehealth.net/HH/Z1/UI/Common/NewCustomUser.aspx')
  //await page.goto(`https://working.kantimehealth.net/HH/Z1/UI/Common/DashboardMaster.aspx`);
  const clientmenuAssert = new Assert(page);
  await clientmenuAssert.assertclientmenu();
  clientiris = new clientreport(page);
  await clientiris.clientlistpage();
  await page.waitForTimeout(7000);

   intakepatient = new intakepageedit(page);
   const popupPage = await intakepatient.authfill();
   const newAuth = new createauth(popupPage);
  // await newAuth.saveemptyauth("test");
   let pvendoravailaable = await newAuth.publicvendor(enterauth);
  // if (pvendoravailaable === false) {
  //   console.log('⛔vendor not found, Auth not saved');

  //   await popupPage.close();
  //   await page.close();
  //   return;                    //  stop further execution
  // }
  await newAuth.authsave(enterauth);
  await page.waitForTimeout(6000);
  await popupPage.close();

  publicvendorauth = new createauth(page);
  const authPopup = await publicvendorauth.opencreatedauth(enterauth);
  await page.waitForTimeout(6000);

  await authPopup.authurl();
  await authPopup.validateauthdata();
  await authPopup.compareeauthnumber(enterauth); // pass the dynamic value to assertion as expected

})