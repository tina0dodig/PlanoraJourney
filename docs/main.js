import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
  btnPrijava.addEventListener("click", function () {
    otvoriModal("prijava");
  });

  btnReg.addEventListener("click", function () {
    otvoriModal("registracija");
  });
}

if (zatvoreno && prijavaPopup) {
  zatvoreno.addEventListener("click", function () {
    prijavaPopup.classList.add("sakrij");
    if (poruka) {
      poruka.textContent = "";
    }
  });
}

function otvoriModal(nacin) {
  nacinPrijave = nacin;
  prijavaPopup.classList.remove("sakrij");
  if (poruka) {
    poruka.textContent = "";
  }
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
      if (poruka) {
        poruka.textContent = "";
      }
    } catch (greska) {
      if (poruka) {
        poruka.style.color = "red";
        poruka.textContent = "Provjeri email i lozinku.";
      }
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
