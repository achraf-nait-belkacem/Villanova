// ─────────────────────────────────────────────
//  CONFIGURATION
// ─────────────────────────────────────────────

var API_KEY   = 'e9a42bc08fa2430b9c225f1599dc10cd';
var AGENDA_ID = '50100';


// ─────────────────────────────────────────────
//  TICKER (bande défilante en haut de page)
// ─────────────────────────────────────────────

function construireTicker(ev) {
  var contenu = document.querySelector('.ticker__content');
  if (!contenu) return;

  var elements = [
    { label: 'ÉVÉNEMENT', texte: ev.titre },
    { label: 'LIEU',      texte: ev.lieu },
    { label: 'DATE',      texte: ev.dateLongue },
    { label: 'ENTRÉE',    texte: 'Gratuite' },
  ];

  contenu.innerHTML = '';
  var ancienClone = contenu.parentElement.querySelector('[aria-hidden="true"]');
  if (ancienClone) ancienClone.remove();

  elements.forEach(function(el) {
    if (!el.texte) return;

    var span = document.createElement('span');
    span.className = 'ticker__item';
    span.innerHTML = '<span class="ticker__label">' + el.label + '</span> ' + el.texte;
    contenu.appendChild(span);

    var sep = document.createElement('span');
    sep.className = 'ticker__sep';
    sep.textContent = '•';
    contenu.appendChild(sep);
  });

  var clone = contenu.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  contenu.parentElement.appendChild(clone);
}


// ─────────────────────────────────────────────
//  ONGLETS MOBILE (ABOUT / VENUE)
// ─────────────────────────────────────────────

function initOnglets() {
  var onglets = document.querySelectorAll('.detail-tab');
  var panneaux = document.querySelectorAll('.detail__section[role="tabpanel"]');

  // Sur mobile, montrer seulement le premier panneau
  if (window.innerWidth <= 767) {
    panneaux.forEach(function(panneau, i) {
      panneau.hidden = (i !== 0);
    });
  }

  onglets.forEach(function(onglet) {
    onglet.addEventListener('click', function() {
      var cibleId = onglet.getAttribute('aria-controls');

      // Mettre à jour les boutons d'onglets
      onglets.forEach(function(o) {
        o.classList.remove('detail-tab--active');
        o.setAttribute('aria-selected', 'false');
      });
      onglet.classList.add('detail-tab--active');
      onglet.setAttribute('aria-selected', 'true');

      // Afficher le bon panneau sur mobile
      if (window.innerWidth <= 767) {
        panneaux.forEach(function(panneau) {
          panneau.hidden = (panneau.id !== cibleId);
        });
      }
    });
  });
}


// ─────────────────────────────────────────────
//  AFFICHAGE DE L'ÉVÉNEMENT
// ─────────────────────────────────────────────

function afficherEvenement(ev) {
  // Titre de la page
  document.title = ev.titre + ' · villa.nova';

  // --- Ticket desktop ---
  document.querySelector('.ticket__title').textContent     = ev.titre;
  document.querySelector('.ticket__category').textContent  = ev.categorie;
  document.querySelector('.ticket__price').textContent     = 'GRATUIT';
  document.querySelector('.ticket__meta').innerHTML =
    '<dt>Date</dt><dd>' + ev.dateLongue + '</dd>' +
    '<dt>Lieu</dt><dd>' + ev.lieu + '</dd>';

  // --- Ticket mobile ---
  var titreM = document.querySelector('.mobile-ticket__title');
  if (titreM) {
    titreM.innerHTML = '<span class="subtitle">' + ev.categorie + ' · ' + ev.lieu.toUpperCase() + '</span>' + ev.titre;
  }
  var valeurs = document.querySelectorAll('.mobile-ticket__meta .meta-value');
  if (valeurs[0]) valeurs[0].textContent = ev.dateCourtе;
  if (valeurs[1]) valeurs[1].textContent = ev.heure;

  // --- Image principale ---
  var colPrincipale = document.querySelector('.detail__col--main');
  if (colPrincipale && ev.imageUrl) {
    var imgExistante = colPrincipale.querySelector('.detail__hero');
    if (imgExistante) imgExistante.remove();

    var img = document.createElement('img');
    img.className = 'detail__hero';
    img.src       = ev.imageUrl;
    img.alt       = ev.titre;
    colPrincipale.insertBefore(img, colPrincipale.firstChild);
  }

  // --- Description ---
  document.querySelector('.detail__text').textContent = ev.description;

  // --- Programme ---
  var programme = document.querySelector('.lineup');
  if (programme) {
    programme.innerHTML = '';
    ev.programme.forEach(function(ligne) {
      var li = document.createElement('li');
      li.textContent = ligne;
      programme.appendChild(li);
    });
  }

  // --- Carte (Leaflet) ---
  var carteEl = document.querySelector('.venue-map');
  if (carteEl && ev.latitude && ev.longitude) {
    carteEl.innerHTML = '';
    var carte = L.map(carteEl, { zoomControl: true, scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(carte);
    carte.setView([ev.latitude, ev.longitude], 16);
    L.marker([ev.latitude, ev.longitude]).addTo(carte);
  }

  // Mettre le focus sur le titre pour l'accessibilité
  var titreEl = document.getElementById('event-title');
  if (titreEl) titreEl.focus();

  // Ticker
  construireTicker(ev);
}


// ─────────────────────────────────────────────
//  CONVERSION DES DONNÉES DE L'API
// ─────────────────────────────────────────────

function convertirEvenement(apiEv) {
  // Extraire l'heure et la date depuis "firstTiming.begin"
  var debut = apiEv.firstTiming && apiEv.firstTiming.begin ? apiEv.firstTiming.begin : '';
  var heure = debut ? debut.substring(11, 16) : '';

  var dateCourte = '';
  if (debut) {
    var parties = debut.substring(5, 10).split('-');
    dateCourte = parties[1] + '/' + parties[0];
  }

  // Description
  var description = '';
  if (apiEv['description-de-loeuvre'] && apiEv['description-de-loeuvre'].fr) {
    description = apiEv['description-de-loeuvre'].fr;
  } else if (apiEv.description && apiEv.description.fr) {
    description = apiEv.description.fr;
  }

  // Programme de la soirée
  var programme = [];
  var titreOeuvre = apiEv['titre-de-loeuvre'] && apiEv['titre-de-loeuvre'].fr ? apiEv['titre-de-loeuvre'].fr : '';
  var auteur      = apiEv['auteur-de-loeuvre'] && apiEv['auteur-de-loeuvre'].fr ? apiEv['auteur-de-loeuvre'].fr : '';
  var etabl       = apiEv['nom-de-letablissement'] && apiEv['nom-de-letablissement'].fr ? apiEv['nom-de-letablissement'].fr : '';

  if (heure)   programme.push(heure + ' — ' + (titreOeuvre || apiEv.title.fr || 'Événement'));
  if (auteur)  programme.push('Auteur : ' + auteur);
  if (etabl)   programme.push('Établissement : ' + etabl);
  if (programme.length === 0) programme.push('Programme à confirmer');

  // Image
  var imageUrl = null;
  if (apiEv.image && apiEv.image.base) {
    var variants = apiEv.image.variants || [];
    var full = null;
    for (var i = 0; i < variants.length; i++) {
      if (variants[i].type === 'full') { full = variants[i]; break; }
    }
    imageUrl = apiEv.image.base + (full ? full.filename : apiEv.image.filename);
  }

  return {
    id:          String(apiEv.uid),
    titre:       apiEv.title && apiEv.title.fr ? apiEv.title.fr : 'Événement',
    categorie:   'ÉVÉNEMENT',
    lieu:        apiEv.location && apiEv.location.name ? apiEv.location.name : '',
    dateCourte:  dateCourte,
    dateLongue:  apiEv.dateRange && apiEv.dateRange.fr ? apiEv.dateRange.fr : '',
    heure:       heure,
    description: description,
    programme:   programme,
    imageUrl:    imageUrl,
    latitude:    apiEv.location ? apiEv.location.latitude  : null,
    longitude:   apiEv.location ? apiEv.location.longitude : null,
  };
}


// ─────────────────────────────────────────────
//  CHARGEMENT DE L'ÉVÉNEMENT
// ─────────────────────────────────────────────

async function chargerEvenement() {
  // Lire l'ID dans l'URL (ex: event-detail.html?id=1234)
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');

  if (!id) {
    document.querySelector('.detail__text').textContent = 'Aucun événement sélectionné.';
    return;
  }

  try {
    var url = 'https://api.openagenda.com/v2/agendas/' + AGENDA_ID + '/events/' + id
            + '?key=' + API_KEY;

    var reponse = await fetch(url);
    if (!reponse.ok) throw new Error('Erreur ' + reponse.status);

    var donnees = await reponse.json();
    var ev = convertirEvenement(donnees.event);
    afficherEvenement(ev);

  } catch (erreur) {
    console.error('Erreur API :', erreur);
    document.querySelector('.detail__text').textContent = 'Impossible de charger cet événement.';
  }
}


// ─────────────────────────────────────────────
//  DÉMARRAGE
// ─────────────────────────────────────────────

initOnglets();
chargerEvenement();
