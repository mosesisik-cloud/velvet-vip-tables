export const AUTH_PROVIDERS = ['google', 'apple', 'facebook', 'instagram', 'tiktok', 'snapchat'];

export function authOptions(config, environment) {
  const ownedHost = /^(?:b2b\.bakemyday\.se|localhost|127\.0\.0\.1)$/i.test(environment.hostname || '');
  const passkey = ownedHost && environment.secureContext === true
    && environment.publicKeyCredential === true && environment.credentials === true;
  const flags = config?.oauth;
  const known = flags && AUTH_PROVIDERS.some(id => typeof flags[id] === 'boolean');
  return {
    passkey,
    passkeyReason: passkey ? '' : ownedHost ? 'browserUnsupported' : 'hostUnsupported',
    providerState: known ? 'ready' : 'error',
    providers: known ? AUTH_PROVIDERS.filter(id => flags[id] === true) : [],
  };
}

const copy = {
  intro: ['Välj en tillgänglig inloggningsmetod.', 'Choose an available sign-in method.', 'Elige un método de acceso disponible.', 'Choisissez une méthode de connexion disponible.'],
  passkey: ['Logga in med enhetsnyckel', 'Sign in with a passkey', 'Acceder con una clave de acceso', 'Se connecter avec une clé d’accès'],
  passkeyHint: ['Använd enhetens ansiktsigenkänning, fingeravtryck eller skärmlås.', 'Use your device’s face recognition, fingerprint or screen lock.', 'Usa el reconocimiento facial, la huella o el bloqueo de pantalla del dispositivo.', 'Utilisez la reconnaissance faciale, l’empreinte ou le verrouillage de votre appareil.'],
  hostUnsupported: ['Enhetsnyckel är inte tillgänglig på den här webbplatsadressen.', 'Passkeys are unavailable at this website address.', 'Las claves de acceso no están disponibles en esta dirección web.', 'Les clés d’accès sont indisponibles à cette adresse web.'],
  browserUnsupported: ['Den här webbläsaren eller anslutningen stöder inte enhetsnycklar.', 'This browser or connection does not support passkeys.', 'Este navegador o conexión no admite claves de acceso.', 'Ce navigateur ou cette connexion ne prend pas en charge les clés d’accès.'],
  loading: ['Kontrollerar inloggningsalternativ…', 'Checking sign-in options…', 'Comprobando métodos de acceso…', 'Vérification des méthodes de connexion…'],
  error: ['Inloggningsalternativen kunde inte hämtas.', 'Sign-in options could not be loaded.', 'No se pudieron cargar los métodos de acceso.', 'Impossible de charger les méthodes de connexion.'],
  empty: ['Social inloggning är inte aktiverad just nu.', 'Social sign-in is not enabled right now.', 'El acceso con redes sociales no está activado actualmente.', 'La connexion via les réseaux sociaux n’est pas activée actuellement.'],
  retry: ['Kontrollera igen', 'Check again', 'Comprobar de nuevo', 'Vérifier à nouveau'],
  continueWith: ['Fortsätt med {provider}', 'Continue with {provider}', 'Continuar con {provider}', 'Continuer avec {provider}'],
  failed: ['Inloggningen kunde inte startas. Försök igen eller välj en annan metod.', 'Sign-in could not be started. Try again or choose another method.', 'No se pudo iniciar el acceso. Inténtalo de nuevo o elige otro método.', 'La connexion n’a pas pu démarrer. Réessayez ou choisissez une autre méthode.'],
};
export function authCopy(key, lang = 'en') {
  const index = ['sv', 'en', 'es', 'fr'].indexOf(lang);
  return copy[key]?.[index < 0 ? 1 : index] || key;
}
