const API_KEY   = 'e9a42bc08fa2430b9c225f1599dc10cd';
const AGENDA_ID = '50100';


function afficherEvenement(ev) {
  document.title = ev.title.fr + ' · villa.nova';

  document.getElementById('event-title').textContent = ev.title.fr;

  const lieu  = ev.location && ev.location.name ? ev.location.name : '';
  const ville = ev.location && ev.location.city ? ev.location.city : '';
  document.getElementById('event-lieu').textContent = lieu + (ville ? ' — ' + ville : '');

  const dateLongue = ev.dateRange && ev.dateRange.fr ? ev.dateRange.fr : '';
  document.getElementById('event-date').textContent = dateLongue;

  let description = '';
  if (ev['description-de-loeuvre'] && ev['description-de-loeuvre'].fr) {
    description = ev['description-de-loeuvre'].fr;
  } else if (ev.description && ev.description.fr) {
    description = ev.description.fr;
  }
  document.getElementById('event-description').textContent = description;

  if (ev.image && ev.image.base) {
    let fichier = ev.image.filename;
    const variants = ev.image.variants || [];
    for (let i = 0; i < variants.length; i++) {
      if (variants[i].type === 'full') {
        fichier = variants[i].filename;
        break;
      }
    }
    const img = document.getElementById('event-image');
    if (img) {
      img.src = ev.image.base + fichier;
      img.alt = ev.title.fr;
    }
  }
}


async function chargerEvenement() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    document.getElementById('event-description').textContent = 'Aucun événement sélectionné.';
    return;
  }

  try {
    const url = 'https://api.openagenda.com/v2/agendas/' + AGENDA_ID + '/events/' + id
              + '?key=' + API_KEY;

    const reponse = await fetch(url);
    const donnees = await reponse.json();

    afficherEvenement(donnees.event);

  } catch (erreur) {
    console.error('Erreur de chargement :', erreur);
    document.getElementById('event-description').textContent = 'Impossible de charger cet événement.';
  }
}


chargerEvenement();
