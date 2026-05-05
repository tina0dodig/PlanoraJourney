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
  onValue,
  remove
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

const mojeRezLista = document.getElementById("mojeRezLista");

onAuthStateChanged(auth, function (korisnik) {
  if (btnPrijava && btnReg && btnOdjava) {
    if (korisnik) {
      btnPrijava.classList.add("sakrij");
      btnReg.classList.add("sakrij");
      btnOdjava.classList.remove("sakrij");
    } else {
      btnPrijava.classList.remove("sakrij");
      btnReg.classList.remove("sakrij");
      btnOdjava.classList.add("sakrij");
    }
  }

  ucitajRez();
});

function ucitajRez() {
  if (!mojeRezLista) return;

  const korisnik = auth.currentUser;

  if (!korisnik) {
    mojeRezLista.innerHTML = `<p class="poruka">Potrebna je prijava kako bi se prikazale rezervacije.</p>`;
    return;
  }

  mojeRezLista.innerHTML = `<p class="poruka">Učitavanje tvojih rezervacija...</p>`;

  const rezRef = ref(baza, "rezervacije");

  onValue(rezRef, function (snapshot) {
    if (!snapshot.exists()) {
      mojeRezLista.innerHTML = `<p class="poruka">Ne postoji niti jedna rezervacija.</p>`;
      return;
    }

    const podaci = snapshot.val();
    const sveRez = Object.entries(podaci).map(function ([id, r]) {
      return { id, ...r };
    });

    const moje = sveRez
      .filter(function (r) {
        return r.korisnikId === korisnik.uid;
      })
      .sort(function (a, b) {
        return Number(b.spremljeno || 0) - Number(a.spremljeno || 0);
      });

    if (moje.length === 0) {
      mojeRezLista.innerHTML = `<p class="poruka">Ne postoji niti jedna rezervacija.</p>`;
      return;
    }

    let html = `<div class="rez-grid">`;

    moje.forEach(function (r) {
      html += `
        <article class="rez-kartica">
          <h3>${ocisti(r.destinacija)}</h3>
          <p><strong>Datum polaska:</strong> ${ocisti(formatiraj(r.datum))}</p>
          <p><strong>Broj dana:</strong> ${ocisti(r.dani || r.brojDana)}</p>
          <p><strong>Broj osoba:</strong> ${ocisti(r.osobe || r.brojOsoba)}</p>
          <p><strong>Status:</strong> ${ocisti(r.status || "Rezervirano")}</p>
          ${r.napomena ? `<p><strong>Napomena:</strong> ${ocisti(r.napomena)}</p>` : ""}
          <button class="otkaziGumb" data-id="${r.id}">Otkaži rezervaciju</button>
        </article>
      `;
    });

    html += `</div>`;
    mojeRezLista.innerHTML = html;

    document.querySelectorAll(".otkaziGumb").forEach(function (gumb) {
      gumb.addEventListener("click", async function () {
        const id = gumb.dataset.id;

        if (confirm("Želiš li otkazati ovu rezervaciju?")) {
          await remove(ref(baza, `rezervacije/${id}`));
        }
      });
    });
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