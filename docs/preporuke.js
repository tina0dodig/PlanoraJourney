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
  onValue,
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
/*Nisam mogla napraviti da se slike spremaju na firebase jer se placa, pa sam napravila preko cloudinary-a */
const OBLAK_IME = "dhsj2hkzi";
const OBLAK= "planora_preset";

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

const prepForma = document.getElementById("prepForma");
const prepLista = document.getElementById("prepLista");
const prepPoruka = document.getElementById("prepPoruka");

if (prepForma && prepLista) {
  ucitajListu();

  prepForma.addEventListener("submit", async function (event) {
    event.preventDefault();

    const destinacija = document.getElementById("prepDest").value.trim();
    const ocjena = document.getElementById("prepOcjena").value;
    const opis = document.getElementById("prepOpis").value.trim();
    const slika = document.getElementById("prepSlika").files[0];

    if (!destinacija || !ocjena || !opis || !slika) {
      prikaziPor("Ispuni sva polja i dodaj sliku.", false);
      return;
    }

    if (slika.size > 5 * 1024 * 1024) {
      prikaziPor("Slika je prevelika. Odaberi sliku manju od 5 MB.", false);
      return;
    }

    try {
      prikaziPor("Preporuka se sprema...", true);

      const urlSlike = await uploadSliku(slika);

      await spremi("putnickePreporuke", {
        destinacija,
        ocjena,
        opis,
        urlSlike,
        korisnik: auth.currentUser ? auth.currentUser.email : "Anonimni korisnik"
      });

      prepForma.reset();
      prikaziPor("Preporuka je uspješno objavljena!", true);
    } catch (greska) {
      console.error(greska);
      prikaziPor("Došlo je do greške kod spremanja slike.", false);
    }
  });
}

async function uploadSliku(slika) {
  const podaci = new FormData();

  podaci.append("file", slika);
  podaci.append("upload_preset", OBLAK);

  const odg = await fetch(
    `https://api.cloudinary.com/v1_1/${OBLAK_IME}/image/upload`,
    {
      method: "POST",
      body: podaci
    }
  );

  const rez = await odg.json();

  if (!odg.ok) {
    console.error("Cloudinary greška:", rez);
    throw new Error("Cloudinary upload nije uspio.");
  }

  return rez.secure_url;
}

function ucitajListu() {
  prepLista.innerHTML = `<p class="poruka">Učitavam preporuke...</p>`;

  const refPreporuke = ref(baza, "putnickePreporuke");

  onValue(refPreporuke, function (snapshot) {
    if (!snapshot.exists()) {
      prepLista.innerHTML = `<p class="poruka">Još nema preporuka. Budi prva koja će objaviti putovanje!</p>`;
      return;
    }

    const preporuke = Object.values(snapshot.val()).sort(function (a, b) {
      return Number(b.spremljeno || 0) - Number(a.spremljeno || 0);
    });

    let html = "";

    preporuke.forEach(function (p) {
      html += `
        <article class="prep-kartica">
          <img src="${ocisti(p.urlSlike)}" alt="${ocisti(p.destinacija)}">
          <div class="prep-sadrzaj">
            <div class="prep-vrh">
              <h3>${ocisti(p.destinacija)}</h3>
              <span>${zvjezdice(p.ocjena)}</span>
            </div>
            <p>${ocisti(p.opis)}</p>
            <small>Objavio/la: ${ocisti(p.korisnik || "Anonimni korisnik")}</small>
            <button class="rezGumb rezGumbPrep" data-dest="${ocisti(p.destinacija)}">
              Rezerviraj
            </button>
          </div>
        </article>
      `;
    });

    prepLista.innerHTML = html;

    document.querySelectorAll(".rezGumbPrep").forEach(function (gumb) {
      gumb.addEventListener("click", function () {
        otvoriRez(gumb.dataset.dest, "");
      });
    });
  });
}

function zvjezdice(ocjena) {
  return "⭐".repeat(Number(ocjena));
}

function prikaziPor(tekst, uspjeh) {
  if (!prepPoruka) return;

  prepPoruka.classList.remove("sakrij");
  prepPoruka.textContent = tekst;
  prepPoruka.style.color = uspjeh ? "#1d4ed8" : "#dc2626";
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
