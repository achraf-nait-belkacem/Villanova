const API_KEY   = 'e9a42bc08fa2430b9c225f1599dc10cd';
const AGENDA_ID = '326750';

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
    initAutocomplete();

  } catch (erreur) {
    console.error('Erreur de chargement :', erreur);
    const liste = document.getElementById('event-list');
    if (liste) {
      liste.innerHTML = '<li class="event-row">Impossible de charger les événements.</li>';
    }
  }
}


function debounce(fn, delai) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(function() { fn(...args); }, delai);
  };
}

function rechercherDansTousLesEvenements(query) {
  const q = query.toLowerCase().trim();
  return tousLesEvenements.filter(function(ev) {
    const titre = ev.title && ev.title.fr ? ev.title.fr.toLowerCase() : '';
    const lieu  = ev.location && ev.location.name ? ev.location.name.toLowerCase() : '';
    const ville = ev.location && ev.location.city ? ev.location.city.toLowerCase() : '';
    return titre.includes(q) || lieu.includes(q) || ville.includes(q);
  }).slice(0, 5);
}

function fermerSuggestions(liste, input) {
  liste.hidden = true;
  input.setAttribute('aria-expanded', 'false');
}

function afficherSuggestions(evenements, liste, input) {
  liste.innerHTML = '';

  if (evenements.length === 0) {
    fermerSuggestions(liste, input);
    return;
  }

  evenements.forEach(function(ev) {
    const titre = ev.title && ev.title.fr ? ev.title.fr : 'Événement';
    const ville = ev.location && ev.location.city ? ev.location.city : '';

    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.setAttribute('tabindex', '-1');

    const spanTitre = document.createElement('span');
    spanTitre.textContent = titre;

    const spanVille = document.createElement('small');
    spanVille.textContent = ville;

    li.appendChild(spanTitre);
    li.appendChild(spanVille);

    li.addEventListener('click', function() {
      input.value = titre;
      fermerSuggestions(liste, input);

      window.location.href = 'event-detail.html?id=' + ev.uid;
    });

    liste.appendChild(li);
  });

  liste.hidden = false;
  input.setAttribute('aria-expanded', 'true');
}

function gererClavier(e, liste, input) {
  const items = [...liste.querySelectorAll('[role="option"]')];
  const indexActuel = items.indexOf(document.activeElement);

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      if (indexActuel < items.length - 1) {
        items[indexActuel + 1].focus();
      } else {
        items[0] && items[0].focus();
      }
      break;

    case 'ArrowUp':
      e.preventDefault();
      if (indexActuel > 0) {
        items[indexActuel - 1].focus();
      } else {
        input.focus();
      }
      break;

    case 'Escape':
      fermerSuggestions(liste, input);
      input.focus();

      afficherEvenements(tousLesEvenements);
      break;

    case 'Enter':
      if (document.activeElement !== input) {
        document.activeElement.click();
      }
      break;
  }
}

function initAutocomplete() {
  const input = document.getElementById('search-events');
  const liste = document.getElementById('search-suggestion');

  if (!input || !liste) return;

  const rechercheDebounce = debounce(function(query) {
    if (query.length < 2) {
      fermerSuggestions(liste, input);
      afficherEvenements(tousLesEvenements);
      return;
    }
    const resultats = rechercherDansTousLesEvenements(query);
    afficherSuggestions(resultats, liste, input);
  }, 300);

  input.addEventListener('input', function(e) {
    rechercheDebounce(e.target.value);
  });

  input.addEventListener('keydown', function(e) {
    gererClavier(e, liste, input);
  });

  liste.addEventListener('keydown', function(e) {
    gererClavier(e, liste, input);
  });


  document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-container')) {
      fermerSuggestions(liste, input);
    }
  });
}

const chargerEvenementsOriginal = chargerEvenements;

chargerEvenements();
