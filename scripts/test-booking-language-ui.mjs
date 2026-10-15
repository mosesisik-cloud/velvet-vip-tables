import {chromium} from '../node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const reg=JSON.parse(await fs.readFile(new URL('../data/booking-providers.json',import.meta.url)));const oro=Object.keys(reg).find(k=>reg[k].url==='https://oro.meitre.com/');assert.ok(oro);
const base=process.env.VELVET_UI_TEST_URL||'http://127.0.0.1:4179/';const browser=await chromium.launch();
try{for(const [language,label,policy] of [['sv','Hitta ett bord','Avbokningsvillkor'],['en','Find a table','Cancellation policy'],['es','Buscar mesa','Política de cancelación'],['fr','Trouver une table',"Conditions d’annulation"]]){
 const context=await browser.newContext({locale:'de-DE'});await context.addInitScript(lang=>localStorage.setItem('velvet_lang',lang),language);await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.fulfill({contentType:'text/html',body:'<p>Provider fixture — no booking</p>'}));
 const page=await context.newPage();await page.goto(base+'#/restaurant/'+oro);const button=page.locator('#restaurant-provider-booking button');await button.waitFor();assert.equal(await button.textContent(),label);assert.equal(await page.locator('.booking-cancellation-notice strong').textContent(),policy);await button.click();const url=new URL(await page.locator('.booking-provider-frame').getAttribute('src'));assert.equal(url.searchParams.get('mt_lang'),language==='sv'?'en':language);await context.close();}
 console.log('PASS four-language provider shell, cancellation notice, manual preference and Meitre locale URL; provider mocked');}finally{await browser.close();}
