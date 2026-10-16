// Operator-only local preparation. Never expose guest fields or booking controls.
export function mountProviderPreparation(container, api, {provider,restaurantId}={}) {
  let state=null,busy=false,disposed=false;
  const endpoint='/restaurant-bookings/playwright';
  container.innerHTML=`<section aria-label="Förberedelse för operatör"><h3>Operatör · förberedelse</h3>
    <p>Kontroll av meny och tider. Lokalt val skapar ingen serverkorg eller bokning.</p>
    <p data-prep-status role="status"></p><button type="button" data-prep-start>Öppna förberedelse</button>
    <form data-prep-search hidden><label>Datum <input type="date" name="date" required></label>
    <p>Två vuxna</p><button>Sök tider</button></form><div data-prep-policy></div><div data-prep-slots></div>
    <div data-prep-selection></div><button type="button" data-prep-review hidden>Granska lokalt val</button>
    <button type="button" data-prep-refresh hidden>Uppdatera vy</button><button type="button" data-prep-end hidden>Avsluta förberedelse</button></section>`;
  const el=name=>container.querySelector(`[data-prep-${name}]`);
  const paragraph=(target,text)=>{const p=document.createElement('p');p.textContent=text;target.append(p);};
  // Render provider translations as text, including literal markup; never HTML.
  const describe=value=>typeof value==='string'?value:JSON.stringify(value ?? null,null,2);
  function controls(){container.querySelectorAll('button,input').forEach(node=>node.disabled=busy);}
  function accept(next){
    if(!next || next.provider!==provider || next.restaurantId!==restaurantId || next.mode!=='prepare'
      || next.preparation!==true || next.operatorOnly!==true || next.liveBooking!==false
      || next.canHold!==false || next.canSubmit!==false || next.result!==null || next.image!==null
      || typeof next.id!=='string' || !Number.isInteger(next.revision)
      || state && (next.id!==state.id || next.revision<state.revision))throw new Error('snapshot');
    state=next;
    el('start').hidden=true; el('search').hidden=false;el('refresh').hidden=false;el('end').hidden=false;
    el('policy').replaceChildren();el('slots').replaceChildren();el('selection').replaceChildren();
    const menu=next.terms?.menu;
    paragraph(el('policy'),`Meny: ${describe(menu?.name)} · antal ${describe(menu?.count)}`);
    paragraph(el('policy'),describe(menu?.description));
    paragraph(el('policy'),menu?.price===null?'Pris anges inte i bokningsformuläret.':`Prisuppgift: ${describe(menu?.price)}`);
    paragraph(el('policy'),`Villkor: ${describe(next.terms?.terms)}`);
    paragraph(el('policy'),`Kontaktkrav inför ett eventuellt senare steg: ${describe(next.terms?.guestRequirements)}`);
    for(const slot of next.availabilityEvidence?.slots || []){
      if(typeof slot.id!=='string' || !/^\d{2}:\d{2}$/.test(slot.time))continue;
      const button=document.createElement('button');button.type='button';button.dataset.prepSlot=slot.id;
      button.textContent=`${slot.time} · kategori ${slot.serviceCategoryId ?? 'ingen preferens'} · välj lokalt`;
      button.onclick=()=>run({type:'select',slotId:slot.id});el('slots').append(button);
    }
    if(next.details)paragraph(el('selection'),`Lokalt val: ${next.details.date} ${next.details.time}, ${next.details.party} vuxna. Meny ${next.details.menuId}, antal ${next.details.count}, kategori ${next.details.serviceCategoryId ?? 'ingen preferens'}. Ingen serverkorg skapad.`);
    el('review').hidden=next.state!=='selected';
    const status=next.availabilityEvidence?.status;
    el('status').textContent=next.state==='review'?'Lokalt val granskat. Bokning är inte tillgänglig i denna vy.'
      :status==='invalid_menu_items'?'Leverantören accepterade inte menyvalet i sökningen. Inga tider kan användas.'
      :status==='no_availability'?'Inga tillgängliga tider i svaret.'
      :status==='available'?'Sökresultat mottaget. Ett lokalt val bokar inget.':'Förberedelse öppnad. Ingen bokning har skapats.';
  }
  async function run(action=null){
    if(busy||disposed)return;busy=true;controls();
    try{
      const url=state?`${endpoint}/${encodeURIComponent(state.id)}/${action?'action':'current'}`:endpoint;
      const body=state?(action?{...action,revision:state.revision}:{}):{provider,restaurantId,resume:true};
      const next=await api(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      if(disposed)return;if(next?.error)throw new Error(next.error);accept(next);
    }catch{if(!disposed){el('status').textContent='Förberedelsen kunde inte verifieras. Ingen bokning skickades.';el('slots').replaceChildren();el('review').hidden=true;}}
    finally{busy=false;if(!disposed)controls();}
  }
  el('start').onclick=()=>run();el('refresh').onclick=()=>run();el('review').onclick=()=>run({type:'review'});
  el('search').onsubmit=event=>{event.preventDefault();run({type:'search',date:new FormData(el('search')).get('date'),party:2});};
  el('end').onclick=async()=>{
    if(busy||!state||disposed)return;busy=true;controls();
    try{const response=await api(`${endpoint}/${encodeURIComponent(state.id)}`,{method:'DELETE'});if(response?.error)throw new Error();
      if(!disposed){state=null;el('start').hidden=false;for(const name of ['search','review','refresh','end'])el(name).hidden=true;
        for(const name of ['slots','policy','selection'])el(name).replaceChildren();el('status').textContent='Förberedelsen avslutad.';}}
    catch{if(!disposed)el('status').textContent='Kunde inte avsluta förberedelsen.';}finally{busy=false;if(!disposed)controls();}
  };
  return {destroy(){disposed=true;},refresh:()=>run()};
}
