import {chromium} from '../node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:4179/';
const browser=await chromium.launch();
try {for(const [lang,heading] of [['sv','Permanent stängd'],['en','Permanently closed'],['es','Cerrado permanentemente'],['fr','Fermé définitivement']]) {
 const context=await browser.newContext();await context.addInitScript(l=>localStorage.setItem('velvet_lang',l),lang);
 await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
 const page=await context.newPage();await page.goto(base+'#/restaurant/osm-MIA-lokal-burgers-and-beer');
 const panel=page.locator('.restaurant-book-panel');await panel.getByRole('heading',{name:heading,exact:true}).waitFor();
 assert.equal(await panel.locator('form,button,iframe').count(),0);assert.equal(await panel.locator('.booking-cancellation-notice').isVisible(),false);
 assert.equal(await panel.locator('.restaurant-closed-notice a').getAttribute('href'),'https://kushhospitality.com/lokal/');await context.close();
}console.log('PASS closed restaurant: localized status/source, no booking form/button/iframe in four languages');}finally{await browser.close();}
