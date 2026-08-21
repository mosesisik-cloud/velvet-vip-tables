// VELVET i18n — sv / en / es / fr
export const LANGS = [
  { id: "sv", label: "Svenska", flag: "🇸🇪" },
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "es", label: "Español", flag: "🇪🇸" },
  { id: "fr", label: "Français", flag: "🇫🇷" },
];

const KEY = "velvet_lang";

function detect() {
  const n = (navigator.language || "sv").slice(0, 2).toLowerCase();
  return LANGS.some((l) => l.id === n) ? n : "en";
}

export function getLang() {
  try {
    const s = localStorage.getItem(KEY);
    if (s && LANGS.some((l) => l.id === s)) return s;
  } catch {}
  return detect();
}

export function setLang(id) {
  if (!LANGS.some((l) => l.id === id)) return getLang();
  try { localStorage.setItem(KEY, id); } catch {}
  document.documentElement.lang = id;
  return id;
}

let lang = getLang();

export function currentLang() { return lang; }

const D = {
  sv: {
    skip: "Hoppa till huvudinnehållet",
    ribbon: "Förhandsversion · VELVET-teamet tar förfrågan mot klubben — ingen reservation förrän återkoppling",
    navDestinations: "Destinationer",
    navVenues: "Ställen",
    navMap: "Karta",
    navFav: "Favoriter",
    navOpen: "Öppna stolar",
    navBookings: "Förfrågningar",
    navSearch: "Sök",
    allDest: "Alla destinationer",
    tagline: "VIP-bord. Delad lyx.",
    chooseLang: "Välj språk",
    langSub: "Du kan byta när som helst uppe i menyn.",
    continue: "Fortsätt",
    loginTitle: "Logga in",
    loginSub: "Koppla Facebook, Instagram, TikTok eller Snapchat så ni kan boka tillsammans, dela notan och släppa öppna stolar.",
    loginWith: "Fortsätt med",
    yourName: "Ditt namn",
    yourHandle: "Ditt användarnamn",
    yourEmail: "E-post (valfritt)",
    loginCta: "Logga in",
    loggedInAs: "Inloggad som",
    logout: "Logga ut",
    skipLogin: "Hoppa över",
    openSeats: "Öppna stolar till andra",
    openSeatsHint: "Andra i VELVET kan ta en stol och dela notan.",
    openSeatsCount: "Antal öppna stolar",
    takeSeat: "Ta en stol",
    seatsOpen: "öppna stolar",
    splitOn: "delas på",
    people: "personer",
    noOpen: "Inga öppna stolar just nu",
    noOpenHint: "Skapa en förfrågan och slå på öppna stolar så kan Gabbe, Dan och gänget hoppa in.",
    account: "Konto",
    events: "Kommande",
    sendRequest: "Skicka förfrågan",
    explore: "Utforska ställen",
    seeDest: "Se destinationer",
    heroKicker: "Concierge-förhandsversion · V4",
    heroTitle1: "VIP-bord på världens bästa klubbar.",
    heroTitle2: "Dela kostnaden.",
    heroP: "Skicka en förfrågan, boka med vänner, dela notan och släpp öppna stolar till andra.",
    confirmOpen: "Öppna stolar publiceras i appen så andra kan ansluta. Ingen betalning dras här — VELVET återkommer.",
    perPerson: "per person",
    indicative: "Indikativt",
  },
  en: {
    skip: "Skip to main content",
    ribbon: "Preview · VELVET sends your request to the club — no reservation until we confirm",
    navDestinations: "Destinations",
    navVenues: "Venues",
    navMap: "Map",
    navFav: "Favorites",
    navOpen: "Open seats",
    navBookings: "Requests",
    navSearch: "Search",
    allDest: "All destinations",
    tagline: "VIP tables. Shared luxury.",
    chooseLang: "Choose language",
    langSub: "You can change this anytime in the menu.",
    continue: "Continue",
    loginTitle: "Sign in",
    loginSub: "Connect Facebook, Instagram, TikTok or Snapchat so you can book together, split the bill and leave open seats.",
    loginWith: "Continue with",
    yourName: "Your name",
    yourHandle: "Your username",
    yourEmail: "Email (optional)",
    loginCta: "Sign in",
    loggedInAs: "Signed in as",
    logout: "Sign out",
    skipLogin: "Skip",
    openSeats: "Open seats for others",
    openSeatsHint: "Other VELVET users can take a seat and split the bill.",
    openSeatsCount: "Open seats",
    takeSeat: "Take a seat",
    seatsOpen: "open seats",
    splitOn: "split between",
    people: "people",
    noOpen: "No open seats right now",
    noOpenHint: "Create a request and enable open seats so friends can join.",
    account: "Account",
    events: "Coming up",
    sendRequest: "Send request",
    explore: "Browse venues",
    seeDest: "See destinations",
    heroKicker: "Concierge preview · V4",
    heroTitle1: "VIP tables at the world’s best clubs.",
    heroTitle2: "Split the cost.",
    heroP: "Send a request, book with friends, split the bill and leave open seats for others.",
    confirmOpen: "Open seats are listed in the app so others can join. No charge here — VELVET will follow up.",
    perPerson: "per person",
    indicative: "From",
  },
  es: {
    skip: "Saltar al contenido",
    ribbon: "Vista previa · VELVET envía la solicitud al club — no hay reserva hasta confirmación",
    navDestinations: "Destinos",
    navVenues: "Locales",
    navMap: "Mapa",
    navFav: "Favoritos",
    navOpen: "Asientos libres",
    navBookings: "Solicitudes",
    navSearch: "Buscar",
    allDest: "Todos los destinos",
    tagline: "Mesas VIP. Lujo compartido.",
    chooseLang: "Elige idioma",
    langSub: "Puedes cambiarlo cuando quieras en el menú.",
    continue: "Continuar",
    loginTitle: "Iniciar sesión",
    loginSub: "Conecta Facebook, Instagram, TikTok o Snapchat para reservar juntos, dividir la cuenta y dejar asientos libres.",
    loginWith: "Continuar con",
    yourName: "Tu nombre",
    yourHandle: "Tu usuario",
    yourEmail: "Email (opcional)",
    loginCta: "Entrar",
    loggedInAs: "Sesión de",
    logout: "Salir",
    skipLogin: "Omitir",
    openSeats: "Asientos libres para otros",
    openSeatsHint: "Otros en VELVET pueden ocupar un asiento y dividir la cuenta.",
    openSeatsCount: "Asientos libres",
    takeSeat: "Ocupar asiento",
    seatsOpen: "asientos libres",
    splitOn: "dividido entre",
    people: "personas",
    noOpen: "No hay asientos libres",
    noOpenHint: "Crea una solicitud y activa asientos libres para que se unan.",
    account: "Cuenta",
    events: "Próximos",
    sendRequest: "Enviar solicitud",
    explore: "Ver locales",
    seeDest: "Ver destinos",
    heroKicker: "Vista previa concierge · V4",
    heroTitle1: "Mesas VIP en los mejores clubs.",
    heroTitle2: "Dividid el coste.",
    heroP: "Envía una solicitud, reserva con amigos, dividid la cuenta y dejad asientos libres.",
    confirmOpen: "Los asientos libres se publican para que otros se unan. Aquí no se cobra.",
    perPerson: "por persona",
    indicative: "Desde",
  },
  fr: {
    skip: "Aller au contenu",
    ribbon: "Aperçu · VELVET envoie la demande au club — pas de réservation tant que ce n’est pas confirmé",
    navDestinations: "Destinations",
    navVenues: "Lieux",
    navMap: "Carte",
    navFav: "Favoris",
    navOpen: "Places libres",
    navBookings: "Demandes",
    navSearch: "Rechercher",
    allDest: "Toutes les destinations",
    tagline: "Tables VIP. Luxe partagé.",
    chooseLang: "Choisir la langue",
    langSub: "Vous pourrez changer à tout moment dans le menu.",
    continue: "Continuer",
    loginTitle: "Connexion",
    loginSub: "Connectez Facebook, Instagram, TikTok ou Snapchat pour réserver ensemble, partager l’addition et laisser des places libres.",
    loginWith: "Continuer avec",
    yourName: "Votre nom",
    yourHandle: "Votre identifiant",
    yourEmail: "E-mail (optionnel)",
    loginCta: "Se connecter",
    loggedInAs: "Connecté en tant que",
    logout: "Déconnexion",
    skipLogin: "Passer",
    openSeats: "Places ouvertes aux autres",
    openSeatsHint: "D’autres sur VELVET peuvent prendre une place et partager l’addition.",
    openSeatsCount: "Places ouvertes",
    takeSeat: "Prendre une place",
    seatsOpen: "places libres",
    splitOn: "partagé entre",
    people: "personnes",
    noOpen: "Aucune place libre",
    noOpenHint: "Créez une demande et activez les places libres.",
    account: "Compte",
    events: "À venir",
    sendRequest: "Envoyer la demande",
    explore: "Voir les lieux",
    seeDest: "Voir les destinations",
    heroKicker: "Aperçu concierge · V4",
    heroTitle1: "Tables VIP dans les meilleurs clubs.",
    heroTitle2: "Partagez le coût.",
    heroP: "Envoyez une demande, réservez entre amis, partagez l’addition et laissez des places libres.",
    confirmOpen: "Les places libres sont listées pour que d’autres puissent rejoindre. Aucun paiement ici.",
    perPerson: "par personne",
    indicative: "À partir de",
  },
};

export function t(key) {
  const pack = D[lang] || D.sv;
  if (pack[key]) return pack[key];
  return (D.sv[key] || key);
}

export function applyLang(id) {
  lang = setLang(id);
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    const [attr, key] = (el.getAttribute("data-i18n-attr") || "").split(":");
    if (attr && key) el.setAttribute(attr, t(key));
  });
  return lang;
}

export function bootLang() {
  lang = getLang();
  document.documentElement.lang = lang;
  applyLang(lang);
}
