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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const baza = getDatabase(app);

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

const poklonForma = document.getElementById("poklonForma");
const poklonRezultat = document.getElementById("poklonRezultat");

if (poklonForma && poklonRezultat) {
  poklonForma.addEventListener("submit", async function (event) {
    event.preventDefault();

    const ime = document.getElementById("ime").value.trim();
    const polazak = document.getElementById("polazak").value.trim();
    const datum = document.getElementById("datum").value;
    const tip = document.getElementById("tip").value;
    const neVoli = document.getElementById("neVoli").value;
    const prijevoz = document.getElementById("prijevoz").value;
    const budzet = document.getElementById("budzet").value;
    const trajanje = Number(document.getElementById("trajanje").value);
    const poklonPoruka = document.getElementById("poklonPoruka").value.trim();

    if (!ime || !polazak || !datum || !tip || !neVoli || !prijevoz || !budzet || trajanje < 1) {
      poklonRezultat.innerHTML = `<p class="poruka">Ispuni sva polja za poklon putovanje.</p>`;
      return;
    }

    const destinacija = odaberiDest(tip, neVoli, budzet, prijevoz);

    prikaziKartu({
      ime,
      polazak,
      datum,
      destinacija,
      prijevoz,
      trajanje,
      poruka: poklonPoruka,
      budzet,
      tip
    });

    await spremi("poklonPutovanja", {
      ime,
      polazak,
      datum,
      tip,
      neVoli,
      prijevoz,
      budzet,
      trajanje,
      poruka: poklonPoruka,
      destinacija
    });
  });
}

function odaberiDest(tip, neVoli, budzet, prijevoz) {
  const destinacije = {
    more: ["Santorini", "Malta", "Barcelona", "Dubrovnik", "Lisabon", "Mallorca"],
    grad: ["Pariz", "Rim", "London", "Beč", "Prag", "Amsterdam"],
    priroda: ["Island", "Norveška", "Švicarska", "Slovenija", "Madeira", "Austrija"],
    romantika: ["Pariz", "Venecija", "Santorini", "Firenca", "Prag", "Rim"],
    kultura: ["Rim", "Atena", "Firenca", "Beč", "Berlin", "Madrid"]
  };

  let lista = [...destinacije[tip]];

  if (neVoli === "hladno") {
    lista = lista.filter(d => !["Island", "Norveška", "Švicarska", "Austrija"].includes(d));
  }

  if (neVoli === "dugo" || prijevoz === "bus") {
    lista = lista.filter(d => !["Island", "Norveška", "Madeira", "London"].includes(d));
  }

  if (budzet === "nizi") {
    lista = lista.filter(d => !["Santorini", "Švicarska", "London", "Island", "Norveška"].includes(d));
  }

  if (lista.length === 0) {
    lista = ["Rim", "Prag", "Beč", "Malta"];
  }

  return lista[Math.floor(Math.random() * lista.length)];
}

function prikaziKartu(podaci) {
  const brKarte = "PJ" + Math.floor(Math.random() * 9000 + 1000);
  const ukrcaj = podaci.prijevoz === "bus" ? "07:45" : "08:30";
  const gate = podaci.prijevoz === "bus" ? "P4" : "A" + Math.floor(Math.random() * 20 + 1);
  const sjedalo = Math.floor(Math.random() * 28 + 1) + ["A", "B", "C", "D"][Math.floor(Math.random() * 4)];
  const datFormat = formatiraj(podaci.datum);

  const naslovPrijevoz = podaci.prijevoz === "bus" ? "BUS TICKET" : "BOARDING PASS";
  const ikona = podaci.prijevoz === "bus" ? "🚌" : "✈️";
  const polaziste = podaci.polazak.toUpperCase();
  const poruka = podaci.poruka || "Sretan put i uživaj u svakom trenutku ovog poklon putovanja!";

  poklonRezultat.innerHTML = `
    <div class="karta">
      <div class="glavaKarte">
        <div>PLANORA JOURNEY</div>
        <div>${naslovPrijevoz}</div>
      </div>

      <div class="tijeloKarte">
        <div class="lijevoKarte">
          <div class="okomitiTekst">POKLON KARTA</div>

          <div class="glavniDio">
            <div class="mrezaKarte">
              <div><span>Broj</span><strong>${brKarte}</strong></div>
              <div><span>Ukrcaj</span><strong>${ukrcaj}</strong></div>
              <div><span>Gate</span><strong>${gate}</strong></div>
              <div><span>Sjedalo</span><strong>${sjedalo}</strong></div>
            </div>

            <div class="rutaKarte">
              <div>
                <span>Od:</span>
                <strong>${ocisti(polaziste)}</strong>
                <p>Mjesto polaska</p>
              </div>

              <div class="avionVeliki">${ikona}</div>

              <div>
                <span>Do:</span>
                <strong>${ocisti(podaci.destinacija.toUpperCase())}</strong>
                <p>Poklon destinacija</p>
              </div>
            </div>

            <div class="datumKarte">
              <span>Datum polaska:</span>
              <strong>${datFormat}</strong>
            </div>

            <div class="porukaPoklon">
              <span>Poruka:</span>
              <p>${ocisti(poruka)}</p>
            </div>
          </div>
        </div>

        <div class="razdjelnik"></div>

        <div class="desnoKarte">
          <h3>${naslovPrijevoz}</h3>

          <div class="infoMalo">
            <span>Putnik:</span>
            <strong>${ocisti(podaci.ime.toUpperCase())}</strong>
          </div>

          <div class="infoMalo">
            <span>Prijevoz:</span>
            <strong>${podaci.prijevoz === "bus" ? "AUTOBUS" : "AVION"}</strong>
          </div>

          <div class="infoMalo">
            <span>Trajanje:</span>
            <strong>${podaci.trajanje} dana</strong>
          </div>

          <div class="infoMalo">
            <span>Status:</span>
            <strong>POKLON</strong>
          </div>

          <div class="crtKod"></div>
        </div>
      </div>
    </div>

    <div class="spremiWrap">
      <button id="spremiBtn">Preuzmi kartu</button>
    </div>
  `;

  const spremiBtn = document.getElementById("spremiBtn");

  spremiBtn.addEventListener("click", async function () {
    const karta = document.querySelector(".karta");

    if (!window.html2canvas) {
      alert("Biblioteka za spremanje slike nije učitana.");
      return;
    }

    const canvas = await window.html2canvas(karta, {
      scale: 2,
      backgroundColor: "#ffffff"
    });

    const link = document.createElement("a");
    link.download = `planora-poklon-karta-${podaci.ime.replaceAll(" ", "-").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

function formatiraj(datum) {
  const d = new Date(datum);
  return d.toLocaleDateString("hr-HR");
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