export function mountBookingReport(container, {restaurantId, apiBase}) {
  const details = document.createElement('details');
  details.className = 'booking-report';
  details.innerHTML = `<summary>Har du fått en bokningsbekräftelse? Spara den i Velvet</summary><p>Frivilligt. Ange uppgifterna från bekräftelsen. De sparas som uppgivna av dig tills bokningssystemet kan verifiera dem.</p><form><label>Bokningsreferens<input name="reference" required maxlength="100" autocomplete="off"></label><label>Datum<input type="date" name="date" required></label><label>Tid<input type="time" name="time" required></label><label>Antal gäster<input type="number" name="party" min="1" max="100" required value="2"></label><button class="btn btn-ghost" type="submit">Spara bekräftelsen</button></form><p role="status"></p>`;
  container.append(details);
  const form=details.querySelector('form'),status=details.querySelector('[role=status]'),button=details.querySelector('button');
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(!form.reportValidity()||button.disabled)return;
    button.disabled=true;status.textContent='Sparar…';
    try {
      const body={...Object.fromEntries(new FormData(form)),restaurantId};
      const response=await fetch(`${apiBase}/restaurant-bookings/report`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      if(!response.ok)throw new Error('save');
      status.replaceChildren(document.createTextNode('Sparad som uppgiven av dig. '));
      const link=document.createElement('a');link.href='#/bookings';link.textContent='Visa dina bokningar';status.append(link);
    }catch {status.textContent='Kunde inte spara. Kontrollera uppgifterna och försök igen.';}
    finally {button.disabled=false;}
  });
}
