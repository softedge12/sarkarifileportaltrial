document.getElementById("loginBox").addEventListener("submit", (event) => {
    event.preventDefault();
});

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        checkExpiry(user);
    }
});

function showSpinner(show) {
    const spinner = document.getElementById("loadingSpinner");
    spinner.classList.toggle("d-none", !show);
}

function login() {
    showSpinner(true);
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            checkRedirectPage(user);
        })
        .catch((error) => {
            document.getElementById("error").innerHTML = error.message;
        })
        .finally(() => showSpinner(false));
}

function signUp() {
    showSpinner(true);
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(() => {
            alert("आप सफलतापूर्वक साइनअप हो गए हैं। आपके भुगतान के सत्यापन के उपरांत 24 घंटे के अन्दर आपकी लॉगिन सक्रिय हो जाएगी।");
        })
        .catch((error) => {
            document.getElementById("signupError").innerHTML = error.message;
        })
        .finally(() => showSpinner(false));
}

function forgotPass() {
    const email = document.getElementById("email").value;

    firebase.auth().sendPasswordResetEmail(email)
        .then(() => {
            alert("Reset link sent to your email id");
        })
        .catch((error) => {
            document.getElementById("error").innerHTML = error.message;
        });
}

function toggleForms() {
    const loginBox = document.getElementById("loginBox");
    const signupBox = document.getElementById("signupBox");
    const toggleBtn = document.querySelector(".toggle-btn");

    if (loginBox.classList.contains("hidden")) {
        loginBox.classList.remove("hidden");
        signupBox.classList.add("hidden");
        toggleBtn.innerText = "Switch To Sign Up";
    } else {
        loginBox.classList.add("hidden");
        signupBox.classList.remove("hidden");
        toggleBtn.innerText = "Switch To Login";
    }
}


function checkExpiry(user) {
    const userEmail = user.email;
    const userRef = firebase.database().ref("users").orderByChild("email").equalTo(userEmail);

    userRef.once("value", (snapshot) => {
        if (snapshot.exists()) {
            snapshot.forEach(userData => {
                const expiryDate = new Date(userData.val().expiryDate);
                const currentDate = new Date();

                if (currentDate > expiryDate) {
                    alert("Your account has expired. You will be logged out.");
                    firebase.auth().signOut().then(() => {
                        location.replace("index.html");
                    });
                }
            });
        } else {
            alert("आपकी लॉगिन सुविधा अभी उपलब्ध नहीं है। कृपया बाद में प्रयास करें।");
            firebase.auth().signOut().then(() => {
                location.replace("index.html");
            });
        }
    });
}

function checkRedirectPage(user) {
    const userEmail = user.email;

    firebase.database().ref("users").orderByChild("email").equalTo(userEmail).once("value")
        .then(snapshot => {
            if (snapshot.exists()) {
                const pages = [];
                snapshot.forEach(userData => {
                    if (userData.val().pages) {
                        userData.val().pages.forEach(page => {
                            const expiryDate = new Date(page.expiryDate);
                            const currentDate = new Date();

                            if (currentDate <= expiryDate) {
                                pages.push(page.redirectPage);
                            }
                        });
                    }
                });

                if (pages.length > 0) {
                    showPageSelection(pages);
                } else {
                    alert("No active pages available.");
                }
            } else {
                alert("User not found.");
            }
        })
        .catch(error => {
            document.getElementById("error").innerHTML = error.message;
        });
}

function showPageSelection(pages) {
    const pageList = document.getElementById("pageList");
    pageList.innerHTML = "";

    pages.forEach(page => {
        const listItem = document.createElement("li");
        listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

        listItem.innerHTML = `
          <span>${page}</span>
          <button class="btn btn-primary btn-sm" onclick="window.location.href='${page}'">Go</button>
        `;
        pageList.appendChild(listItem);
    });

    const modal = new mdb.Modal(document.getElementById('pageSelectionModal'));
    modal.show();
}
