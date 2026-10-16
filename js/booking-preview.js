import { mountVelvetPlaywrightBooking } from './velvet-playwright-booking.js';
import { createJourneyFixture, FIXTURE_RESTAURANT } from './booking-preview-fixture.js';

// Pure browser-memory transport: no fetch, API, supplier, personal-data storage
// or server fixture endpoint. Deliberately isolated from Velvet guest sessions.
let mounted;
function start() {
  mounted?.destroy();
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  const fixture = createJourneyFixture({ outcome: document.querySelector('#outcome').value });
  mounted = mountVelvetPlaywrightBooking(document.querySelector('#booking'), {
    restaurantId: FIXTURE_RESTAURANT, restaurantName: 'Testrestaurang — simulering',
    mode: 'fixture', storage, transport: fixture.forOwner(crypto.randomUUID()),
  });
}
document.querySelector('#restart').addEventListener('click', start);
document.querySelector('#outcome').addEventListener('change', start);
start();
