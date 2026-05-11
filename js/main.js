const API_KEY   = 'e9a42bc08fa2430b9c225f1599dc10cd';
const AGENDA_ID = '50100';

let tousLesEvenements = [];


function getPilleActive() {
  const active = document.querySelector('.filter-group--city .filter-pill--active');
  if (active) {
    return active.dataset.value;
  }
  return 'all';
}

function filtrerEvenements() {
  const villeChoisie = getPilleActive();

  document.querySelectorAll('.event-row').forEach(function(ligne) {
    const villeLigne = ligne.dataset.ville || '';

    if (villeChoisie === 'all' || villeChoisie === villeLigne) {
      ligne.style.display = '';
    } else {
      ligne.style.display = 'none';
    }
  });
}

function creerPille(label, valeur, estActif) {
  const btn = document.createElement('button');
  btn.className = estActif ? 'filter-pill filter-pill--active' : 'filter-pill';
  btn.textContent = label;
  btn.dataset.value = valeur;

  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-group--city .filter-pill').forEach(function(p) {
      p.classList.remove('filter-pill--active');
    });
    btn.classList.add('filter-pill--active');
    filtrerEvenements();
  });

  return btn;
}

function construireFiltres(evenements) {
  const conteneur = document.querySelector('.filter-group--city .filter-group__pills');
  if (!conteneur) return;

  const villes = [];
  evenements.forEach(function(ev) {
    if (ev.location && ev.location.city) {
      if (villes.indexOf(ev.location.city) === -1) {
        villes.push(ev.location.city);
      }
    }
  });
  villes.sort();

  conteneur.innerHTML = '';
  conteneur.appendChild(creerPille('Tout', 'all', true));
  villes.slice(0, 6).forEach(function(ville) {
    conteneur.appendChild(creerPille(ville, ville.toLowerCase(), false));
  });
}

function afficherEvenements(evenements) {
  const liste = document.getElementById('event-list');
  if (!liste) return;

  liste.innerHTML = '';

  evenements.forEach(function(ev) {
    const titre = ev.title && ev.title.fr ? ev.title.fr : 'Événement';
    const lieu  = ev.location && ev.location.name ? ev.location.name : '';
    const ville = ev.location && ev.location.city ? ev.location.city : '';
    const debut = ev.firstTiming && ev.firstTiming.begin ? ev.firstTiming.begin : '';
    const heure = debut ? debut.substring(11, 16) : '--:--';
    const meta  = lieu && ville ? lieu + ' · ' + ville : lieu || ville;

    let urlMiniature = '';
    if (ev.image && ev.image.base) {
      const variants = ev.image.variants || [];
      let fichier = ev.image.filename;
      for (let i = 0; i < variants.length; i++) {
        if (variants[i].type === 'thumbnail') {
          fichier = variants[i].filename;
          break;
        }
      }
      urlMiniature = ev.image.base + fichier;
    }

    const li = document.createElement('li');
    li.className = 'event-row';
    li.dataset.id    = String(ev.uid);
    li.dataset.ville = ville.toLowerCase();

    li.innerHTML =
      '<span class="event-row__time">' + heure + '</span>' +
      '<div class="event-row__info">' +
        '<h3 class="event-row__name">' + titre + '</h3>' +
        '<p class="event-row__meta">' + meta + '</p>' +
      '</div>' +
      '<div class="event-row__actions">' +
        (urlMiniature ? '<img class="event-row__thumb" src="' + urlMiniature + '" alt="" loading="lazy">' : '') +
        '<span class="event-row__arrow">→</span>' +
      '</div>';

    li.addEventListener('click', function() {
      window.location.href = 'event-detail.html?id=' + ev.uid;
    });

    liste.appendChild(li);
  });
}

async function chargerEvenements() {
  try {
    const url = 'https://api.openagenda.com/v2/agendas/' + AGENDA_ID + '/events'
              + '?key=' + API_KEY
              + '&relative[0]=current&relative[1]=upcoming&limit=50';

    const reponse = await fetch(url);
    const donnees = await reponse.json();

    tousLesEvenements = donnees.events || [];

    afficherEvenements(tousLesEvenements);
    construireFiltres(tousLesEvenements);

  } catch (erreur) {
    console.error('Erreur de chargement :', erreur);
    const liste = document.getElementById('event-list');
    if (liste) {
      liste.innerHTML = '<li class="event-row">Impossible de charger les événements.</li>';
    }
  }
}

chargerEvenements();
