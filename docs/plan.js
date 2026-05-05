import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getDatabase,
  ref,
  push,
  set,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAmNgdy7Tc31cenwENPmWUnddcZ_c1t2LE",
  authDomain: "my-project-5a69f.firebaseapp.com",
  databaseURL: "https://my-project-5a69f-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "my-project-5a69f",
  storageBucket: "my-project-5a69f.firebasestorage.app",
  messagingSenderId: "159399214608",
  appId: "1:159399214608:web:65e67b78fb815404d49495"
};

const KLJUC_SLIKE = "F7_yf7Go3cAJVlZGrdCC4ctGWaQGd_BrWx3EjpamdDc";
const KLJUC_MAPE = "5ae2e3f221c38a28845f05b664df9b9d08658fd606c5c454c7d272d1";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const baza = getDatabase(app);

const gradoviHR = {
  paris: "Pariz",
  rome: "Rim",
  vienna: "Beč",
  venice: "Venecija",
  prague: "Prag",
  lisbon: "Lisabon",
  london: "London",
  barcelona: "Barcelona",
  madrid: "Madrid",
  berlin: "Berlin",
  amsterdam: "Amsterdam",
  budapest: "Budimpešta",
  athens: "Atena",
  florence: "Firenca",
  milan: "Milano",
  dubrovnik: "Dubrovnik",
  zagreb: "Zagreb",
  split: "Split",
  tokyo: "Tokio"
};

const btnPrijava = document.getElementById("btnPrijava");
const btnReg = document.getElementById("btnReg");
const btnOdjava = document.getElementById("btnOdjava");
const prijavaPopup = document.getElementById("prijavaPopup");
const zatvoreno = document.getElementById("zatvoreno");
const modNaslov = document.getElementById("modNaslov");
const prijavaForma = document.getElementById("prijavaForma");
const posalji = document.getElementById("posalji");
const poruka = document.getElementById("poruka");

let nacinPrijave = "prijava";

if (btnPrijava && btnReg && prijavaPopup) {
  btnPrijava.addEventListener("click", () => otvoriModal("prijava"));
  btnReg.addEventListener("click", () => otvoriModal("registracija"));
}

if (zatvoreno && prijavaPopup) {
  zatvoreno.addEventListener("click", () => {
    prijavaPopup.classList.add("sakrij");
    if (poruka) poruka.textContent = "";
  });
}

function otvoriModal(nacin) {
  nacinPrijave = nacin;
  prijavaPopup.classList.remove("sakrij");
  poruka.textContent = "";

  if (nacin === "prijava") {
    modNaslov.textContent = "Prijava";
    posalji.textContent = "Prijavi se";
  } else {
    modNaslov.textContent = "Registracija";
    posalji.textContent = "Registriraj se";
  }
}

if (prijavaForma) {
  prijavaForma.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const lozinka = document.getElementById("lozinka").value.trim();

    try {
      if (nacinPrijave === "prijava") {
        await signInWithEmailAndPassword(auth, email, lozinka);
      } else {
        await createUserWithEmailAndPassword(auth, email, lozinka);
      }

      prijavaPopup.classList.add("sakrij");
      prijavaForma.reset();
      poruka.textContent = "";
    } catch (greska) {
      poruka.style.color = "red";
      poruka.textContent = "Provjeri email i lozinku.";
      console.error(greska);
    }
  });
}

if (btnOdjava) {
  btnOdjava.addEventListener("click", async function () {
    await signOut(auth);
  });
}

onAuthStateChanged(auth, function (korisnik) {
  if (!btnPrijava || !btnReg || !btnOdjava) return;

  if (korisnik) {
    btnPrijava.classList.add("sakrij");
    btnReg.classList.add("sakrij");
    btnOdjava.classList.remove("sakrij");
  } else {
    btnPrijava.classList.remove("sakrij");
    btnReg.classList.remove("sakrij");
    btnOdjava.classList.add("sakrij");
  }
});

const planForma = document.getElementById("planForma");
const planRezultat = document.getElementById("planRezultat");

if (planForma) {
  planForma.addEventListener("submit", async function (event) {
    event.preventDefault();

    const destinacija = document.getElementById("destinacija").value.trim();
    const dani = Number(document.getElementById("dani").value);

    if (!destinacija || dani < 1) {
      planRezultat.innerHTML = `<p class="poruka">Unesi destinaciju i ispravan broj dana.</p>`;
      return;
    }

    planRezultat.innerHTML = `<p class="poruka">Izrađujem tvoj plan putovanja...</p>`;

    try {
      const slika = await dohvatiSliku(destinacija);
      const opis = await dohvatiOpis(destinacija);
      const koord = await dohvatiKoord(destinacija);
      const atrakcije = await dohvatiAtrakcije(koord.lat, koord.lon);
      const restorani = await dohvatiRestorane(koord.lat, koord.lon);
      const plan = sloziPlan(atrakcije, restorani, dani, destinacija);

      prikaziPlan(destinacija, dani, slika, opis, plan);

      await spremi("planoviPutovanja", {
        destinacija,
        dani,
        opis,
        slika,
        atrakcije,
        restorani,
        plan
      });
    } catch (greska) {
      console.error(greska);
      planRezultat.innerHTML = `
        <p class="poruka">
          Nije moguće napraviti plan za ovu destinaciju. Probaj upisati poznatiji grad.
        </p>
      `;
    }
  });
}

function dajHRNaziv(destinacija) {
  const kljuc = destinacija.toLowerCase().trim();
  return gradoviHR[kljuc] || destinacija;
}

async function dohvatiSliku(destinacija) {
  const pojam = `${destinacija} famous landmark beautiful city travel`;
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(pojam)}&orientation=landscape&per_page=20&client_id=${KLJUC_SLIKE}`;

  const odg = await fetch(url);
  if (!odg.ok) throw new Error("Greška kod slike.");

  const podaci = await odg.json();

  if (!podaci.results || podaci.results.length === 0) {
    return "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=90";
  }

  const slike = podaci.results
    .filter(s => s.width > s.height)
    .sort((a, b) => b.likes - a.likes);

  return (slike[0] || podaci.results[0]).urls.regular;
}

async function dohvatiOpis(destinacija) {
  const hrvNaziv = dajHRNaziv(destinacija);
  const url = `https://hr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hrvNaziv)}`;

  try {
    const odg = await fetch(url);
    if (!odg.ok) return "Opis destinacije trenutno nije dostupan.";

    const podaci = await odg.json();
    return podaci.extract || "Opis destinacije trenutno nije dostupan.";
  } catch {
    return "Opis destinacije trenutno nije dostupan.";
  }
}

async function dohvatiKoord(destinacija) {
  const url = `https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(destinacija)}&apikey=${KLJUC_MAPE}`;

  const odg = await fetch(url);
  if (!odg.ok) throw new Error("Koordinate nisu pronađene.");

  const podaci = await odg.json();

  if (!podaci.lat || !podaci.lon) {
    throw new Error("Koordinate nisu dostupne.");
  }

  return {
    lat: podaci.lat,
    lon: podaci.lon
  };
}

async function dohvatiAtrakcije(lat, lon) {
  const vrste = [
    "historic",
    "cultural",
    "museums",
    "architecture",
    "monuments",
    "religion",
    "palaces",
    "bridges",
    "squares",
    "interesting_places"
  ].join(",");

  const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=11000&lon=${lon}&lat=${lat}&rate=3&kinds=${vrste}&format=json&limit=120&apikey=${KLJUC_MAPE}`;

  const odg = await fetch(url);
  if (!odg.ok) throw new Error("Atrakcije nisu pronađene.");

  const podaci = await odg.json();

  const atrakcije = podaci
    .filter(m => m.name && m.name.trim().length > 2)
    .filter(m => {
      const naziv = m.name.toLowerCase();
      const lose = ["hotel", "hostel", "restaurant", "bar", "shop", "parking", "school", "office"];
      return !lose.some(r => naziv.includes(r));
    })
    .sort((a, b) => Number(b.rate || 0) - Number(a.rate || 0))
    .map(m => m.name.trim())
    .filter((naziv, i, polje) => polje.indexOf(naziv) === i)
    .slice(0, 50);

  if (atrakcije.length < 3) throw new Error("Premalo atrakcija.");

  return atrakcije;
}

async function dohvatiRestorane(lat, lon) {
  const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=7000&lon=${lon}&lat=${lat}&kinds=foods&format=json&limit=80&apikey=${KLJUC_MAPE}`;

  try {
    const odg = await fetch(url);
    if (!odg.ok) throw new Error("Restorani nisu pronađeni.");

    const podaci = await odg.json();

    const restorani = podaci
      .filter(m => m.name && m.name.trim().length > 2)
      .map(m => m.name.trim())
      .filter((naziv, i, polje) => polje.indexOf(naziv) === i)
      .slice(0, 20);

    if (restorani.length < 2) {
      return ["lokalnom restoranu u centru grada", "restoranu blizu znamenitosti"];
    }

    return restorani;
  } catch {
    return ["lokalnom restoranu u centru grada", "restoranu blizu znamenitosti"];
  }
}

function sloziPlan(atrakcije, restorani, dani, destinacija) {
  const plan = [];
  const naziv = dajHRNaziv(destinacija);

  const hoteli = [
    `Hotel Aurora ${naziv}`,
    `Hotel Central ${naziv}`,
    "Boutique Hotel Stella",
    "Hotel Vista Palace"
  ];

  const hotel = hoteli[Math.floor(Math.random() * hoteli.length)];
  let brA = 0;
  let brR = 0;

  for (let d = 1; d <= dani; d++) {
    const a1 = atrakcije[brA % atrakcije.length];
    const a2 = atrakcije[(brA + 1) % atrakcije.length];
    const a3 = atrakcije[(brA + 2) % atrakcije.length];

    const r1 = restorani[brR % restorani.length];
    const r2 = restorani[(brR + 1) % restorani.length];

    plan.push({
      dan: d,
      hotel,
      polazak: d === 1 ? `08:00 — Polazak prema destinaciji ${naziv}.` : "",
      smjestaj: d === 1
        ? `10:30 — Dolazak i prijava u ${hotel}.`
        : `09:00 — Doručak u hotelu ${hotel}.`,
      jutro: `11:00 — Obilazak lokacije ${a1}.`,
      rucak: `13:30 — Ručak u restoranu ${r1}.`,
      popodne: `15:00 — Posjet atrakciji ${a2}.`,
      vecera: `19:30 — Večera u restoranu ${r2}.`,
      vecer: `21:00 — Večernja šetnja kod lokacije ${a3}.`,
      odlazak: d === dani ? `Sljedeće jutro — Odjava iz hotela i odlazak.` : ""
    });

    brA += 3;
    brR += 2;
  }

  return plan;
}

function prikaziPlan(destinacija, dani, slika, opis, plan) {
  const naziv = dajHRNaziv(destinacija);

  let html = `
    <section class="herojRezultat stakloPlan">
      <div class="okvirSlika">
        <img src="${slika}" alt="${ocisti(naziv)}" class="slikaDestinacije">
      </div>

      <div class="tekstRezultat">
        <p class="oznakaMala">Plan putovanja</p>
        <h2>${ocisti(naziv)}</h2>
        <p>${ocisti(opis)}</p>

        <div class="infoMini">
          <span>${dani} dana</span>
          <span>${ocisti(plan[0].hotel)}</span>
          <span>Planora Journey</span>
        </div>

        <button class="rezGumb" data-dest="${ocisti(naziv)}" data-dana="${dani}">
          Rezerviraj ovo putovanje
        </button>
      </div>
    </section>

    <div class="mrezaPlan">
  `;

  plan.forEach(function (d) {
    html += `
      <article class="karticaPlana stakloPlan">
        <div class="glavaDana">
          <div>
            <p>Plan za</p>
            <h3>Dan ${d.dan}</h3>
          </div>
          <span>${ocisti(d.hotel)}</span>
        </div>

        <div class="vremenskaCrta">
          ${d.polazak ? sloziStavku("Polazak", d.polazak) : ""}
          ${sloziStavku("Hotel", d.smjestaj)}
          ${sloziStavku("Jutro", d.jutro)}
          ${sloziStavku("Ručak", d.rucak)}
          ${sloziStavku("Popodne", d.popodne)}
          ${sloziStavku("Večera", d.vecera)}
          ${sloziStavku("Večer", d.vecer)}
          ${d.odlazak ? sloziStavku("Odlazak", d.odlazak) : ""}
        </div>
      </article>
    `;
  });

  html += `</div>`;
  planRezultat.innerHTML = html;

  const gumb = document.querySelector(".rezGumb");

  if (gumb) {
    gumb.addEventListener("click", function () {
      otvoriRez(gumb.dataset.dest, gumb.dataset.dana);
    });
  }
}

function sloziStavku(naslov, tekst) {
  return `
    <div class="crtaStavka">
      <div class="sadrzajCrta bezIkone">
        <span>${ocisti(naslov)}</span>
        <p>${ocisti(tekst)}</p>
      </div>
    </div>
  `;
}

function napraviRezModal() {
  if (document.getElementById("rezPopup")) return;

  const modal = document.createElement("div");

  modal.innerHTML = `
    <div id="rezPopup" class="popup sakrij">
      <div class="kutija rezKutija">
        <button id="zatvoriRez" class="iks">&times;</button>
        <h2>Rezervacija putovanja</h2>

        <form id="rezForma">
          <input type="text" id="rezDest" placeholder="Destinacija" readonly required>
          <input type="date" id="rezDatum" required>
          <input type="number" id="rezDani" min="1" max="30" placeholder="Broj dana" required>
          <input type="number" id="rezOsobe" min="1" max="10" placeholder="Broj osoba" required>
          <textarea id="rezNap" placeholder="Napomena"></textarea>
          <button type="submit">Potvrdi rezervaciju</button>
          <p id="rezPoruka"></p>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("zatvoriRez").addEventListener("click", function () {
    document.getElementById("rezPopup").classList.add("sakrij");
  });

  document.getElementById("rezForma").addEventListener("submit", async function (event) {
    event.preventDefault();

    const korisnik = auth.currentUser;
    const rezPoruka = document.getElementById("rezPoruka");

    if (!korisnik) {
      rezPoruka.style.color = "red";
      rezPoruka.textContent = "Moraš se prijaviti za rezervaciju.";
      return;
    }

    await spremi("rezervacije", {
      korisnikId: korisnik.uid,
      korisnikEmail: korisnik.email,
      destinacija: document.getElementById("rezDest").value.trim(),
      datum: document.getElementById("rezDatum").value,
      dani: Number(document.getElementById("rezDani").value),
      osobe: Number(document.getElementById("rezOsobe").value),
      napomena: document.getElementById("rezNap").value.trim(),
      status: "Rezervirano"
    });

    rezPoruka.style.color = "green";
    rezPoruka.textContent = "Rezervacija je uspješno spremljena.";

    setTimeout(function () {
      document.getElementById("rezPopup").classList.add("sakrij");
      document.getElementById("rezForma").reset();
    }, 900);
  });
}

function otvoriRez(destinacija, dani) {
  napraviRezModal();

  document.getElementById("rezDest").value = destinacija;
  document.getElementById("rezDani").value = dani || "";
  document.getElementById("rezOsobe").value = "";
  document.getElementById("rezDatum").value = "";
  document.getElementById("rezNap").value = "";
  document.getElementById("rezPoruka").textContent = "";

  document.getElementById("rezPopup").classList.remove("sakrij");
}

function ocisti(tekst) {
  return String(tekst)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function spremi(putanja, podaci) {
  const novaRef = push(ref(baza, putanja));

  await set(novaRef, {
    ...podaci,
    spremljeno: serverTimestamp()
  });
}
