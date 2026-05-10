// ─────────────────────────────────────────────
//  CONFIGURATION
// ─────────────────────────────────────────────

var API_KEY   = 'e9a42bc08fa2430b9c225f1599dc10cd';
var AGENDA_ID = '50100';

// Liste de tous les événements chargés depuis l'API
var tousLesEvenements = [];

// Jour sélectionné dans le calendrier (ex: "2025-06-11")
var jourSelectionne = null;

// Noms des jours et des mois en français
var JOURS  = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
var MOIS   = ['JAN','FÉV','MAR','AVR','MAI','JUN','JUL','AOÛ','SEP','OCT','NOV','DÉC'];


// ─────────────────────────────────────────────
//  TICKER (bande défilante en haut de page)
// ─────────────────────────────────────────────

function construireTicker(evenements) {
  var contenu = document.querySelector('.ticker__content');
  if (!contenu) return;

  // Compter les événements d'aujourd'hui
  var aujourdhui = new Date().toISOString().substring(0, 10);
  var nbAujourdhui = 0;
  evenements.forEach(function(ev) {
    if (ev.firstTiming && ev.firstTiming.begin) {
      if (ev.firstTiming.begin.substring(0, 10) === aujourdhui) {
        nbAujourdhui++;
      }
    }
  });

  // Récupérer les villes uniques
  var villesVues = {};
  evenements.forEach(function(ev) {
    if (ev.location && ev.location.city) {
      villesVues[ev.location.city] = true;
    }
  });
  var villes = Object.keys(villesVues).sort();

  // Construire les éléments du ticker
  var elements = [];
  elements.push({ label: 'AGENDA',  texte: evenements.length + ' événements' });
  if (nbAujourdhui > 0) {
    elements.push({ label: "AUJOURD'HUI", texte: nbAujourdhui + ' événement(s)' });
  }
  elements.push({ label: 'ENTRÉE', texte: 'Gratuite pour tous' });
  if (villes.length > 0) {
    elements.push({ label: 'VILLES', texte: villes.slice(0, 4).join(' · ') });
  }

  // Vider l'ancien contenu et le clone
  contenu.innerHTML = '';
  var ancienClone = contenu.parentElement.querySelector('[aria-hidden="true"]');
  if (ancienClone) ancienClone.remove();

  // Ajouter les nouveaux éléments
  elements.forEach(function(el) {
    var span = document.createElement('span');
    span.className = 'ticker__item';
    span.innerHTML = '<span class="ticker__label">' + el.label + '</span> ' + el.texte;
    contenu.appendChild(span);

    var sep = document.createElement('span');
    sep.className = 'ticker__sep';
    sep.textContent = '•';
    contenu.appendChild(sep);
  });

  // Dupliquer pour le défilement infini
  var clone = contenu.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  contenu.parentElement.appendChild(clone);
}


// ─────────────────────────────────────────────
//  CALENDRIER (bande de jours en haut)
// ─────────────────────────────────────────────

function mettreAJourDateHero(dateStr, nombre) {
  var d = new Date(dateStr + 'T00:00:00');

  var el = {
    jour:   document.querySelector('.date-hero__day'),
    chiff:  document.querySelector('.date-hero__number'),
    mois:   document.querySelector('.date-hero__info'),
    label:  document.querySelector('.date-hero__label'),
    compte: document.querySelector('.date-hero__count'),
    sub:    document.querySelector('.date-hero__sub'),
  };

  if (el.jour)   el.jour.textContent   = JOURS[d.getDay()];
  if (el.chiff)  el.chiff.textContent  = d.getDate();
  if (el.mois)   el.mois.textContent   = MOIS[d.getMonth()];
  if (el.label)  el.label.textContent  = '';
  if (el.compte) el.compte.textContent = nombre + ' événement' + (nombre > 1 ? 's' : '');
  if (el.sub)    el.sub.textContent    = '';
}

function construireCalendrier(evenements) {
  var bande = document.querySelector('.week-strip__days');
  if (!bande) return;

  // Compter les événements par date
  var parDate = {};
  evenements.forEach(function(ev) {
    if (!ev.firstTiming || !ev.firstTiming.begin) return;
    var date = ev.firstTiming.begin.substring(0, 10);
    parDate[date] = (parDate[date] || 0) + 1;
  });

  // Prendre les 7 premières dates avec des événements
  var dates = Object.keys(parDate).sort().slice(0, 7);
  if (dates.length === 0) return;

  bande.innerHTML = '';

  // Sélectionner le premier jour par défaut
  jourSelectionne = dates[0];
  mettreAJourDateHero(dates[0], parDate[dates[0]]);

  dates.forEach(function(dateStr, index) {
    var d      = new Date(dateStr + 'T00:00:00');
    var nombre = parDate[dateStr];
    var actif  = (index === 0);

    // Créer le bouton du jour
    var btn = document.createElement('button');
    btn.className = actif ? 'week-day week-day--active' : 'week-day';
    btn.dataset.date = dateStr;
    btn.setAttribute('aria-pressed', actif ? 'true' : 'false');

    btn.innerHTML =
      '<span class="week-day__label">' + JOURS[d.getDay()] + '</span>' +
      '<span class="week-day__number">' + d.getDate() + '</span>' +
      '<span class="week-day__events">' + nombre + ' év.</span>';

    // Quand on clique sur un jour
    btn.addEventListener('click', function() {
      // Désactiver tous les boutons
      document.querySelectorAll('.week-day').forEach(function(b) {
        b.classList.remove('week-day--active');
        b.setAttribute('aria-pressed', 'false');
      });

      // Activer ce bouton
      btn.classList.add('week-day--active');
      btn.setAttribute('aria-pressed', 'true');

      // Mettre à jour le jour sélectionné
      jourSelectionne = dateStr;
      mettreAJourDateHero(dateStr, parDate[dateStr]);

      // Remettre le filtre "quand" à "Tout"
      document.querySelectorAll('.filter-group--when .filter-pill').forEach(function(p) {
        var estTout = (p.dataset.value === 'all');
        p.classList.toggle('filter-pill--active', estTout);
        p.setAttribute('aria-pressed', estTout ? 'true' : 'false');
      });

      filtrerEvenements();
    });

    bande.appendChild(btn);
  });

  // Appliquer le filtre pour le premier jour
  filtrerEvenements();
}


// ─────────────────────────────────────────────
//  FILTRES (ville et date)
// ─────────────────────────────────────────────

function getPilleActive(classe) {
  var active = document.querySelector('.' + classe + ' .filter-pill--active');
  return active ? active.dataset.value.toLowerCase() : 'all';
}

function filtrerEvenements() {
  var filtreville = getPilleActive('filter-group--city');
  var filtreDate  = getPilleActive('filter-group--when');

  var aujourdhui  = new Date().toISOString().substring(0, 10);
  var dansUneSemaine = new Date();
  dansUneSemaine.setDate(dansUneSemaine.getDate() + 7);

  document.querySelectorAll('.event-row').forEach(function(ligne) {
    // Trouver l'événement correspondant
    var ev = null;
    for (var i = 0; i < tousLesEvenements.length; i++) {
      if (String(tousLesEvenements[i].uid) === ligne.dataset.id) {
        ev = tousLesEvenements[i];
        break;
      }
    }

    if (!ev) { ligne.style.display = ''; return; }

    var villeEv = ev.location && ev.location.city ? ev.location.city.toLowerCase() : '';
    var dateEv  = ev.firstTiming ? ev.firstTiming.begin.substring(0, 10) : '';

    // Vérifier la ville
    var villeOk = (filtreville === 'all' || filtreville === villeEv);

    // Vérifier la date
    var dateOk = false;
    if (jourSelectionne) {
      dateOk = (dateEv === jourSelectionne);
    } else if (filtreDate === 'today') {
      dateOk = (dateEv === aujourdhui);
    } else if (filtreDate === 'thisweek') {
      var d = new Date(dateEv);
      dateOk = (d >= new Date() && d <= dansUneSemaine);
    } else {
      dateOk = true;
    }

    ligne.style.display = (villeOk && dateOk) ? '' : 'none';
  });
}

function creerPille(label, valeur, groupe, actif) {
  var btn = document.createElement('button');
  btn.className = 'filter-pill' + (actif ? ' filter-pill--active' : '');
  btn.textContent = label;
  btn.dataset.value = valeur;
  btn.setAttribute('aria-pressed', actif ? 'true' : 'false');

  btn.addEventListener('click', function() {
    // Désactiver toutes les pilles du groupe
    document.querySelectorAll('.' + groupe + ' .filter-pill').forEach(function(p) {
      p.classList.remove('filter-pill--active');
      p.setAttribute('aria-pressed', 'false');
    });

    btn.classList.add('filter-pill--active');
    btn.setAttribute('aria-pressed', 'true');

    // Si on choisit une date dans les filtres, désélectionner le calendrier
    if (groupe === 'filter-group--when') {
      jourSelectionne = null;
      document.querySelectorAll('.week-day').forEach(function(b) {
        b.classList.remove('week-day--active');
        b.setAttribute('aria-pressed', 'false');
      });
    }

    filtrerEvenements();
  });

  return btn;
}

function construireFiltres(evenements) {
  // Récupérer les villes uniques depuis les événements
  var villesVues = {};
  evenements.forEach(function(ev) {
    if (ev.location && ev.location.city) {
      villesVues[ev.location.city] = true;
    }
  });
  var villes = Object.keys(villesVues).sort().slice(0, 6);

  // Pilles de villes
  var conteneurVilles = document.querySelector('.filter-group--city .filter-group__pills');
  if (conteneurVilles) {
    conteneurVilles.innerHTML = '';
    conteneurVilles.appendChild(creerPille('Tout', 'all', 'filter-group--city', true));
    villes.forEach(function(ville) {
      conteneurVilles.appendChild(creerPille(ville, ville.toLowerCase(), 'filter-group--city', false));
    });
  }

  // Pilles de dates
  var conteneurDates = document.querySelector('.filter-group--when .filter-group__pills');
  if (conteneurDates) {
    conteneurDates.innerHTML = '';
    conteneurDates.appendChild(creerPille('Tout',          'all',      'filter-group--when', true));
    conteneurDates.appendChild(creerPille("Aujourd'hui",   'today',    'filter-group--when', false));
    conteneurDates.appendChild(creerPille('Cette semaine', 'thisweek', 'filter-group--when', false));
  }
}


// ─────────────────────────────────────────────
//  LISTE D'ÉVÉNEMENTS
// ─────────────────────────────────────────────

function getUrlMiniature(ev) {
  if (!ev.image || !ev.image.base) return null;
  var variants = ev.image.variants;
  if (variants) {
    for (var i = 0; i < variants.length; i++) {
      if (variants[i].type === 'thumbnail') {
        return ev.image.base + variants[i].filename;
      }
    }
  }
  return ev.image.base + ev.image.filename;
}

function afficherEvenements(evenements) {
  var liste = document.getElementById('event-list');
  if (!liste) return;

  liste.innerHTML = '';

  if (evenements.length === 0) {
    liste.innerHTML = '<li class="event-row event-row--empty">Aucun événement trouvé.</li>';
    return;
  }

  evenements.forEach(function(ev) {
    var titre  = ev.title && ev.title.fr ? ev.title.fr : 'Événement';
    var lieu   = ev.location && ev.location.name ? ev.location.name : '';
    var ville  = ev.location && ev.location.city ? ev.location.city : '';
    var debut  = ev.firstTiming && ev.firstTiming.begin ? ev.firstTiming.begin : '';
    var heure  = debut ? debut.substring(11, 16) : '—:—';
    var meta   = [lieu, ville].filter(Boolean).join(' · ');
    var miniature = getUrlMiniature(ev);

    // Créer la ligne de l'événement
    var li = document.createElement('li');
    li.className = 'event-row';
    li.dataset.id = String(ev.uid);
    li.setAttribute('tabindex', '0');
    li.setAttribute('role', 'button');
    li.setAttribute('aria-label', titre + ', ' + heure + ', ' + meta);

    li.innerHTML =
      '<span class="event-row__time">' + heure + '</span>' +
      '<div class="event-row__info">' +
        '<h3 class="event-row__name">' + titre + '</h3>' +
        '<p class="event-row__meta">' + meta + '</p>' +
      '</div>' +
      '<div class="event-row__actions">' +
        (miniature ? '<img class="event-row__thumb" src="' + miniature + '" alt="" aria-hidden="true" loading="lazy">' : '') +
        '<span class="event-row__arrow" aria-hidden="true">→</span>' +
      '</div>';

    // Aller sur la page de détail au clic
    li.addEventListener('click', function() {
      window.location.href = 'event-detail.html?id=' + ev.uid;
    });
    li.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = 'event-detail.html?id=' + ev.uid;
      }
    });

    liste.appendChild(li);
  });
}


// ─────────────────────────────────────────────
//  CHARGEMENT DES DONNÉES
// ─────────────────────────────────────────────

async function chargerEvenements() {
  var liste = document.getElementById('event-list');
  if (liste) {
    liste.innerHTML = '<li class="event-row event-row--loading">Chargement…</li>';
  }

  try {
    var url = 'https://api.openagenda.com/v2/agendas/' + AGENDA_ID + '/events'
            + '?key=' + API_KEY
            + '&relative[0]=current&relative[1]=upcoming&limit=50';

    var reponse = await fetch(url);
    if (!reponse.ok) throw new Error('Erreur ' + reponse.status);

    var donnees = await reponse.json();
    tousLesEvenements = donnees.events || [];

    afficherEvenements(tousLesEvenements);
    construireFiltres(tousLesEvenements);
    construireCalendrier(tousLesEvenements);
    construireTicker(tousLesEvenements);

    var hint = document.querySelector('.agenda__hint');
    if (hint) hint.textContent = tousLesEvenements.length + ' événements →';

  } catch (erreur) {
    console.error('Erreur API :', erreur);
    if (liste) {
      liste.innerHTML = '<li class="event-row event-row--error">Impossible de charger les événements.</li>';
    }
  }
}


// ─────────────────────────────────────────────
//  DÉMARRAGE
// ─────────────────────────────────────────────

chargerEvenements();
