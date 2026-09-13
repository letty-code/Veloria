/* =========================================================
   VELORIA
   MAIN JAVASCRIPT
   ========================================================= */

/* =========================================================
   1. API CONFIGURATION
   ========================================================= */

const API_URL = import.meta.env.VITE_API_URL;


/* =========================================================
   2. MENU
   ========================================================= */

const menuBtn = document.getElementById("menu-btn");
const menuBox = document.getElementById("menu-box");

if (menuBtn && menuBox) {

    menuBtn.addEventListener("click", function (event) {

        event.preventDefault();

        menuBox.style.display =
            menuBox.style.display === "block"
                ? "none"
                : "block";

    });


    document.addEventListener("click", function (event) {

        if (
            !menuBox.contains(event.target) &&
            !menuBtn.contains(event.target)
        ) {

            menuBox.style.display = "none";

        }

    });

}


/* =========================================================
   3. SEARCH
   ========================================================= */

const searchBtn = document.getElementById("search-btn");
const searchBox = document.getElementById("search-box");
const searchInput = document.getElementById("search-input");
const searchSubmit = document.getElementById("search-submit");

if (searchBtn && searchBox) {

    searchBtn.addEventListener("click", function (event) {

        event.preventDefault();

        if (searchBox.style.display === "block") {

            searchBox.style.display = "none";

        } else {

            searchBox.style.display = "block";

            if (searchInput) {
                searchInput.focus();
            }

        }

    });


    document.addEventListener("click", function (event) {

        if (
            !searchBox.contains(event.target) &&
            !searchBtn.contains(event.target)
        ) {

            searchBox.style.display = "none";

        }

    });

}


/* =========================================================
   4. SEARCH SUBMIT
   ========================================================= */

if (searchSubmit && searchInput) {

    searchSubmit.addEventListener("click", function () {

        const searchTerm =
            searchInput.value.trim().toLowerCase();

        if (!searchTerm) {
            return;
        }

        const productCards = document.querySelectorAll(".product-card");
        let matches = 0;

        productCards.forEach(function (card) {
            const text = card.textContent.toLowerCase();
            const match = text.includes(searchTerm);
            card.style.display = match ? "" : "none";
            if (match) matches += 1;
        });

        if (productCards.length === 0) {
            window.location.href = `index.html?search=${encodeURIComponent(searchTerm)}`;
            return;
        }

        if (matches === 0) {
            alert(`No products found for "${searchTerm}".`);
        }

    });

}


/* =========================================================
   5. CART
   ========================================================= */

function getCart() {

    try {

        return JSON.parse(
            localStorage.getItem("cart")
        ) || [];

    } catch (error) {

        console.error(
            "Error reading cart:",
            error
        );

        return [];

    }

}


function saveCart(cart) {

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

}


function updateCartCount() {

    const cartCount =
        document.getElementById("cart-count");

    if (!cartCount) {
        return;
    }

    const cart = getCart();

    const totalItems = cart.reduce(
        (total, item) => {

            return total +
                (Number(item.quantity) || 0);

        },
        0
    );

    cartCount.textContent = totalItems;

}


/* =========================================================
   6. CART NOTIFICATION
   ========================================================= */

function showCartNotification(productName) {

    let notification =
        document.getElementById("cart-notification");


    if (!notification) {

        notification =
            document.createElement("div");

        notification.id =
            "cart-notification";

        notification.className =
            "cart-notification";

        notification.innerHTML = `
            <div class="cart-notification-title">
                Added to bag
            </div>

            <div class="cart-notification-text"></div>
        `;

        document.body.appendChild(notification);

    }


    const text =
        notification.querySelector(
            ".cart-notification-text"
        );


    if (text) {
        text.textContent = productName;
    }


    notification.classList.add("show");


    clearTimeout(
        notification.hideTimeout
    );


    notification.hideTimeout =
        setTimeout(function () {

            notification.classList.remove("show");

        }, 2500);

}


/* =========================================================
   7. ADD TO CART
   ========================================================= */

const addToCartButtons =
    document.querySelectorAll(".add-to-cart");


addToCartButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const product = {

            id: button.dataset.id,

            name: button.dataset.name,

            price:
                Number(button.dataset.price) || 0,

            image:
                new URL(
                    button.dataset.image,
                    document.baseURI
                ).href,

            category:
                button.dataset.category,

            quantity: 1

        };


        const cart = getCart();


        const existingProduct =
            cart.find(function (item) {

                return item.id === product.id;

            });


        if (existingProduct) {

            existingProduct.quantity += 1;

        } else {

            cart.push(product);

        }


        saveCart(cart);

        updateCartCount();

        showCartNotification(
            product.name
        );

    });

});


/* =========================================================
   8. CART TOTAL
   ========================================================= */

function updateCartTotal() {

    const subtotalElement =
        document.getElementById("cart-subtotal");

    const totalElement =
        document.getElementById("cart-total");


    if (
        !subtotalElement ||
        !totalElement
    ) {
        return;
    }


    const cart = getCart();


    const subtotal = cart.reduce(
        function (total, product) {

            const price =
                Number(product.price) || 0;

            const quantity =
                Number(product.quantity) || 0;

            return total +
                price * quantity;

        },
        0
    );


    const formattedTotal =
        `$${subtotal.toLocaleString()}`;


    subtotalElement.textContent =
        formattedTotal;

    totalElement.textContent =
        formattedTotal;

}


/* =========================================================
   9. CHANGE QUANTITY
   ========================================================= */

function changeQuantity(productId, change) {

    const cart = getCart();


    const product =
        cart.find(function (item) {

            return item.id === productId;

        });


    if (!product) {
        return;
    }


    product.quantity =
        (Number(product.quantity) || 1) +
        change;


    if (product.quantity <= 0) {

        const index =
            cart.findIndex(function (item) {

                return item.id === productId;

            });


        if (index !== -1) {

            cart.splice(index, 1);

        }

    }


    saveCart(cart);

    updateCartCount();

    renderCart();

}


/* =========================================================
   10. REMOVE FROM CART
   ========================================================= */

function removeFromCart(productId) {

    const cart = getCart();


    const updatedCart =
        cart.filter(function (item) {

            return item.id !== productId;

        });


    saveCart(updatedCart);

    updateCartCount();

    renderCart();

}


/* =========================================================
   11. RENDER CART
   ========================================================= */

function renderCart() {

    const cartItems =
        document.getElementById("cart-items");

    const cartContent =
        document.getElementById("cart-content");


    if (
        !cartItems ||
        !cartContent
    ) {
        return;
    }


    const cart = getCart();


    /* -----------------------------
       EMPTY CART
       ----------------------------- */

    if (cart.length === 0) {

        cartContent.style.display = "block";

        cartItems.innerHTML = "";

        updateCartCount();

        updateCartTotal();

        return;

    }


    /* -----------------------------
       CART WITH PRODUCTS
       ----------------------------- */

    cartContent.style.display = "none";

    cartItems.innerHTML = "";


    cart.forEach(function (product) {

        const quantity =
            Number(product.quantity) || 1;

        const price =
            Number(product.price) || 0;


        const cartItem =
            document.createElement("div");


        cartItem.className =
            "cart-item";


        cartItem.innerHTML = `

            <img
                src="${product.image}"
                alt="${product.name}"
                class="cart-item-image"
            >

            <div class="cart-item-info">

                <h3 class="cart-item-name">
                    ${product.name}
                </h3>

                <p class="cart-item-price">
                    $${price.toLocaleString()}
                </p>

                <div class="quantity-controls">

                    <button
                        type="button"
                        class="quantity-minus"
                        data-id="${product.id}">
                        −
                    </button>

                    <span class="quantity">
                        ${quantity}
                    </span>

                    <button
                        type="button"
                        class="quantity-plus"
                        data-id="${product.id}">
                        +
                    </button>

                </div>

                <button
                    type="button"
                    class="remove-from-cart"
                    data-id="${product.id}">
                    Remove
                </button>

            </div>
        `;


        cartItems.appendChild(cartItem);

    });


    updateCartTotal();

    updateCartCount();


    /* -----------------------------
       MINUS BUTTONS
       ----------------------------- */

    document
        .querySelectorAll(".quantity-minus")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    changeQuantity(
                        button.dataset.id,
                        -1
                    );

                }
            );

        });


    /* -----------------------------
       PLUS BUTTONS
       ----------------------------- */

    document
        .querySelectorAll(".quantity-plus")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    changeQuantity(
                        button.dataset.id,
                        1
                    );

                }
            );

        });


    /* -----------------------------
       REMOVE BUTTONS
       ----------------------------- */

    document
        .querySelectorAll(".remove-from-cart")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    removeFromCart(
                        button.dataset.id
                    );

                }
            );

        });

}


/* =========================================================
   12. CHECKOUT BUTTON
   ========================================================= */

const checkoutButton =
    document.getElementById("checkout-button");


if (checkoutButton) {

    checkoutButton.addEventListener(
        "click",
        function () {

            const cart = getCart();


            if (cart.length === 0) {

                alert(
                    "Your cart is empty."
                );

                return;

            }


            window.location.href =
                "checkout.html";

        }
    );

}


/* =========================================================
   13. CHECKOUT
   ========================================================= */

const checkoutItems =
    document.getElementById(
        "checkout-items"
    );

const checkoutSubtotal =
    document.getElementById(
        "checkout-subtotal"
    );

const checkoutTotal =
    document.getElementById(
        "checkout-total"
    );

const placeOrderButton =
    document.getElementById(
        "place-order"
    );


function renderCheckout() {

    if (!checkoutItems) {
        return;
    }


    const cart = getCart();


    checkoutItems.innerHTML = "";


    let subtotal = 0;


    if (cart.length === 0) {

        checkoutItems.innerHTML = `
            <p>Your cart is empty.</p>
        `;


        if (checkoutSubtotal) {
            checkoutSubtotal.textContent = "$0";
        }


        if (checkoutTotal) {
            checkoutTotal.textContent = "$0";
        }


        return;

    }


    cart.forEach(function (product) {

        const quantity =
            Number(product.quantity) || 1;

        const price =
            Number(product.price) || 0;

        const productTotal =
            price * quantity;


        subtotal += productTotal;


        const item =
            document.createElement("div");


        item.className =
            "checkout-item";


        item.innerHTML = `

            <img
                src="${product.image}"
                alt="${product.name}"
            >

            <div class="checkout-item-info">

                <div class="checkout-item-name">
                    ${product.name}
                </div>

                <div class="checkout-item-quantity">
                    Quantity: ${quantity}
                </div>

            </div>

            <div class="checkout-item-price">
                $${productTotal.toLocaleString()}
            </div>

        `;


        checkoutItems.appendChild(item);

    });


    if (checkoutSubtotal) {

        checkoutSubtotal.textContent =
            `$${subtotal.toLocaleString()}`;

    }


    if (checkoutTotal) {

        checkoutTotal.textContent =
            `$${subtotal.toLocaleString()}`;

    }

}


/* =========================================================
   14. PLACE ORDER
   ========================================================= */

if (placeOrderButton) {

    placeOrderButton.addEventListener(
        "click",
        async function () {

            const cart = getCart();

            if (cart.length === 0) {
                alert("Your cart is empty.");
                return;
            }

            const requiredInputs =
                document.querySelectorAll(".checkout-form input[required]");

            let valid = true;

            requiredInputs.forEach(function (input) {
                if (!input.value.trim()) {
                    valid = false;
                    input.focus();
                }
            });

            if (!valid) {
                alert("Please complete all required fields.");
                return;
            }

            const getValue = function (id) {
                const element = document.getElementById(id);
                return element ? element.value.trim() : "";
            };

            const payload = {
                items: cart.map(function (product) {
                    return {
                        productId: product.id,
                        quantity: Number(product.quantity) || 1
                    };
                }),
                customer: {
                    email: getValue("checkout-email"),
                    firstName: getValue("first-name"),
                    lastName: getValue("last-name"),
                    address: getValue("address"),
                    city: getValue("city"),
                    postalCode: getValue("postal-code"),
                    phone: getValue("phone")
                },
                paymentMethod: "cash"
            };

            placeOrderButton.disabled = true;

            try {
                const response = await fetch(`${API_URL}/api/orders`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.status === 401) {
                    alert("Please sign in before placing your order.");
                    window.location.href = "account.html";
                    return;
                }

                if (!response.ok) {
                    alert(data.detail || "Unable to place your order.");
                    return;
                }

                localStorage.setItem("order", JSON.stringify(data.order));
                localStorage.removeItem("cart");

                window.location.href = "confirmation.html";
            } catch (error) {
                console.error("Checkout error:", error);
                alert("Unable to connect to the server.");
            } finally {
                placeOrderButton.disabled = false;
            }
        }
    );

}


/* =========================================================
   15. CONFIRMATION
   ========================================================= */

const confirmationOrderNumber =
    document.getElementById(
        "order-number"
    );


if (confirmationOrderNumber) {

    try {

        const savedOrder =
            JSON.parse(
                localStorage.getItem("order")
            );


        if (
            savedOrder &&
            savedOrder.orderNumber
        ) {

            confirmationOrderNumber.textContent =
                savedOrder.orderNumber;

        }

    } catch (error) {

        console.error(
            "Error reading order:",
            error
        );

    }

}


/* =========================================================
   16. ACCOUNT ELEMENTS
   ========================================================= */

const accountForm =
    document.querySelector(
        "#account-form"
    );

const signInForm =
    document.querySelector(
        "#sign-in-form"
    );


const createAccountSection =
    document.querySelector(
        "#create-account-section"
    );

const signInSection =
    document.querySelector(
        "#sign-in-section"
    );

const myAccountSection =
    document.querySelector(
        "#my-account-section"
    );


const signInLink =
    document.querySelector(
        "#sign-in-link"
    );

const createAccountLink =
    document.querySelector(
        "#create-account-link"
    );


const accountFirstName =
    document.querySelector(
        "#account-first-name"
    );

const accountLastName =
    document.querySelector(
        "#account-last-name"
    );

const accountEmail =
    document.querySelector(
        "#account-email"
    );


const logoutButton =
    document.querySelector(
        "#logout-btn"
    );


/* =========================================================
   17. SHOW SIGN IN
   ========================================================= */

if (
    signInLink &&
    createAccountSection &&
    signInSection
) {

    signInLink.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            createAccountSection.style.display =
                "none";

            signInSection.style.display =
                "block";

        }
    );

}


/* =========================================================
   18. SHOW CREATE ACCOUNT
   ========================================================= */

if (
    createAccountLink &&
    createAccountSection &&
    signInSection
) {

    createAccountLink.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            signInSection.style.display =
                "none";

            createAccountSection.style.display =
                "block";

        }
    );

}


/* =========================================================
   19. REGISTER
   ========================================================= */

if (accountForm) {

    accountForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const firstName =
                document
                    .getElementById("first-name")
                    .value
                    .trim();


            const lastName =
                document
                    .getElementById("last-name")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            const confirmPassword =
                document
                    .getElementById("confirm-password")
                    .value;


            if (
                password !==
                confirmPassword
            ) {

                alert(
                    "Passwords do not match."
                );

                return;

            }


            try {

                const response =
                    await fetch(
                        `${API_URL}/api/auth/register`,
                        {

                            method: "POST",

                            credentials: "include",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    firstName:
                                        firstName,

                                    lastName:
                                        lastName,

                                    email:
                                        email,

                                    password:
                                        password
                                })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.detail ||
                        "Unable to create account."
                    );

                    return;

                }


                alert(
                    "Account created successfully! Please sign in."
                );


                accountForm.reset();


                if (
                    createAccountSection &&
                    signInSection
                ) {

                    createAccountSection.style.display =
                        "none";

                    signInSection.style.display =
                        "block";

                }

            } catch (error) {

                console.error(
                    "Register error:",
                    error
                );


                alert(
                    "Unable to connect to the server."
                );

            }

        }
    );

}


/* =========================================================
   20. LOGIN
   ========================================================= */

if (signInForm) {

    signInForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document
                    .getElementById(
                        "sign-in-email"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "sign-in-password"
                    )
                    .value;


            try {

                const response =
                    await fetch(
                        `${API_URL}/api/auth/login`,
                        {

                            method: "POST",

                            credentials: "include",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    email: email,
                                    password: password
                                })

                        }
                    );


                const data =
                    await response.json();


                /* -----------------------------
                   LOGIN FAILED
                   ----------------------------- */

                if (!response.ok) {

                    alert(
                        data.detail ||
                        "Invalid email or password."
                    );

                    return;

                }


                /* -----------------------------
                   AUTHENTICATION
                   -----------------------------
                   The session is stored by the API in an HttpOnly cookie.
                   JavaScript must never read or store the authentication token.
                   ----------------------------- */


                /* -----------------------------
                   SAVE USER
                   ----------------------------- */

                /* -----------------------------
                   SUCCESS
                   ----------------------------- */

                alert(
                    `Welcome back, ${data.user.firstName}!`
                );


                signInForm.reset();


                showAccount(
                    data.user
                );


                console.log(
                    "Login successful."
                );

                console.log(
                    "User:",
                    data.user
                );

            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                alert(
                    "Unable to connect to the server."
                );

            }

        }
    );

}


/* =========================================================
   21. GET CURRENT USER
   ========================================================= */

async function getCurrentUser() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/auth/me`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

        if (!response.ok) {

            return null;

        }

        const user =
            await response.json();

        return user;

    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        return null;

    }

}

/* =========================================================
   22. SHOW ACCOUNT
   ========================================================= */

function showAccount(user) {

    if (!myAccountSection) {

        console.warn(
            "My account section was not found."
        );

        return;

    }


    /* -----------------------------
       HIDE AUTH FORMS
       ----------------------------- */

    if (createAccountSection) {

        createAccountSection.style.display =
            "none";

    }


    if (signInSection) {

        signInSection.style.display =
            "none";

    }


    /* -----------------------------
       USER INFORMATION
       ----------------------------- */

    if (accountFirstName) {

        accountFirstName.textContent =
            user.firstName || "";

    }


    if (accountLastName) {

        accountLastName.textContent =
            user.lastName || "";

    }


    if (accountEmail) {

        accountEmail.textContent =
            user.email || "";

    }


    /* -----------------------------
       SHOW ACCOUNT
       ----------------------------- */

    myAccountSection.style.display =
        "block";

}


/* =========================================================
   23. LOGOUT
   ========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            try {
                await fetch(
                    `${API_URL}/api/auth/logout`,
                    {
                        method: "POST",
                        credentials: "include"
                    }
                );
            } catch (error) {
                console.error("Logout error:", error);
            }

            if (myAccountSection) {

                myAccountSection.style.display =
                    "none";

            }


            if (signInSection) {

                signInSection.style.display =
                    "block";

            }


            if (createAccountSection) {

                createAccountSection.style.display =
                    "none";

            }


            alert(
                "You have been logged out."
            );

        }
    );

}


/* =========================================================
   24. INITIALIZE ACCOUNT
   ========================================================= */

async function initializeAccount() {

    /*
       Authentication is now handled by the HttpOnly session cookie.
       JavaScript intentionally cannot read the cookie.
    */

    const user =
        await getCurrentUser();

    if (user) {
        showAccount(user);
    }

}

/* =========================================================
   25. INITIALIZE
   ========================================================= */

updateCartCount();

renderCart();

renderCheckout();

initializeAccount();