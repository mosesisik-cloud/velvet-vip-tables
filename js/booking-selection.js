/** Booking context is untrusted URL input; only date, time and party are accepted. */
export function parseBookingSelection(input) {
  const params=input instanceof URLSearchParams?input:new URLSearchParams(input || '');
  const date=params.get('date')||'',time=params.get('time')||'',party=Number(params.get('party'));
  const d=new Date(date+'T12:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(+d)||d.toISOString().slice(0,10)!==date||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||!Number.isInteger(party)||party<1||party>20)return null;
  return {date,time,party};
}
export function withBookingSelection(booking,selection) {
  if(!selection||booking?.provider!=='SevenRooms')return booking;
  const valid=parseBookingSelection(new URLSearchParams(selection));if(!valid)return booking;
  const url=new URL(booking.url);
  if(url.protocol!=='https:'||!['sevenrooms.com','www.sevenrooms.com','eu.sevenrooms.com'].includes(url.hostname)||url.username||url.password||url.port)return booking;
  const modern=url.pathname.startsWith('/explore/');
  url.searchParams.set(modern?'date':'default_date',valid.date);
  url.searchParams.set(modern?'party_size':'default_party_size',String(valid.party));
  url.searchParams.set(modern?'start_time':'default_time',valid.time);
  return {...booking,url:url.href,selection:valid};
}
