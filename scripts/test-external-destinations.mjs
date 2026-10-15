import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const read=async name=>JSON.parse(await fs.readFile(new URL('../'+name,import.meta.url),'utf8'));
const catalogue=await read('data/restaurants.json');
const bookings=await read('data/booking-urls.json');
const adapters=await read('api/sr-venues.json');
const noxe=new URL(bookings['BCN-005'].widgetUrl);
assert.equal(noxe.protocol,'https:');
assert.equal(noxe.hostname,'www.sevenrooms.com');
assert.equal(noxe.pathname,'/reservations/noxe/marriott-com-hotel-websites');
assert.equal(noxe.searchParams.get('venues').split(',')[0],'noxe');
assert.equal(adapters['BCN-005'],'noxe','Availability must target the same venue as the official Noxe booking link');
const rows=Object.values(catalogue.destinations).flatMap(row=>row.restaurants||[]);
const reem=rows.find(row=>row.name==='ريم البوادي');
assert.ok(reem,'Keep restaurant identity; do not delete the entity');
assert.ok(reem.mapsUrl.startsWith('https://www.google.com/maps/'));
for(const row of rows) {
  const actionable=[row.website,row.imageSource,...(row.images||[])].filter(Boolean);
  assert.ok(actionable.every(url=>!/(?:superelectricmn\.com|reemalbawadi\.com)/i.test(url)), 'Do not republish the verified gambling redirect or its media');
}
console.log('PASS: Noxe external booking and availability destination agree; compromised Reem links and imagery cannot return.');
