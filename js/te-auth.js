// Módulo de autenticación compartido entre te-apps, te-Pools y te-Sicro.
// La sesión se guarda en una cookie con dominio .thermoecsa.es para que las tres apps
// (subdominios distintos) compartan el login sin tener que repetirlo en cada una.
const TE_AUTH_PB_URL = 'https://auth.thermoecsa.es';
const TE_AUTH_COOKIE_DOMAIN = '.thermoecsa.es';

const teAuthPb = new PocketBase(TE_AUTH_PB_URL);
teAuthPb.authStore.loadFromCookie(document.cookie);

teAuthPb.authStore.onChange(() => {
    document.cookie = teAuthPb.authStore.exportToCookie({
        httpOnly: false,
        sameSite: 'Lax',
        path: '/',
        domain: TE_AUTH_COOKIE_DOMAIN,
        secure: true
    });
});

async function teAuthRegistrar(email, password) {
    await teAuthPb.collection('users').create({ email, password, passwordConfirm: password });
    await teAuthPb.collection('users').authWithPassword(email, password);
    await teAuthPb.collection('users').requestVerification(email);
}

async function teAuthLogin(email, password) {
    await teAuthPb.collection('users').authWithPassword(email, password);
}

async function teAuthLoginGoogle() {
    await teAuthPb.collection('users').authWithOAuth2({ provider: 'google' });
}

function teAuthLogout() {
    teAuthPb.authStore.clear();
}

function teAuthUsuarioActual() {
    return teAuthPb.authStore.record;
}

// Widget de cabecera: botón "Iniciar sesión" (abre modal de login/registro) o email + "Cerrar sesión"
function teAuthMontarWidget(contenedor) {
    function render() {
        const usuario = teAuthUsuarioActual();
        contenedor.innerHTML = '';
        if (usuario) {
            const badge = document.createElement('div');
            badge.className = 'te-auth-badge';
            badge.innerHTML = `<span class="te-auth-email">${usuario.email}</span>`;
            const btnSalir = document.createElement('button');
            btnSalir.type = 'button';
            btnSalir.className = 'te-auth-btn te-auth-btn-ghost';
            btnSalir.textContent = 'Cerrar sesión';
            btnSalir.addEventListener('click', teAuthLogout);
            badge.appendChild(btnSalir);
            contenedor.appendChild(badge);
        } else {
            const btnEntrar = document.createElement('button');
            btnEntrar.type = 'button';
            btnEntrar.className = 'te-auth-btn';
            btnEntrar.textContent = 'Iniciar sesión';
            btnEntrar.addEventListener('click', teAuthAbrirModal);
            contenedor.appendChild(btnEntrar);
        }
    }
    teAuthPb.authStore.onChange(render);
    render();
}

const TE_AUTH_ICONO_GOOGLE = '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.3 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.3-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 7.1 29.5 5 24 5c-7.5 0-13.9 4.3-17.7 9.7z"/><path fill="#4CAF50" d="M24 45c5.4 0 10.3-2.1 14-5.5l-6.5-5.5c-2 1.5-4.6 2.5-7.5 2.5-5.3 0-9.7-2.7-11.3-7.5l-6.5 5C9.9 40.6 16.4 45 24 45z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.5 5.5C40.5 36.5 43 30.8 43 24c0-1.3-.1-2.7-.4-3.5z"/></svg>';

function teAuthAbrirModal() {
    if (document.getElementById('te-auth-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'te-auth-modal';
    overlay.className = 'te-auth-overlay';
    overlay.innerHTML = `
        <div class="te-auth-dialog">
            <button type="button" class="te-auth-cerrar" aria-label="Cerrar">×</button>

            <div class="te-auth-tabs">
                <button type="button" class="te-auth-tab te-auth-tab-activo" data-ir-a="login">Iniciar sesión</button>
                <button type="button" class="te-auth-tab" data-ir-a="registro">Registrarse</button>
            </div>

            <button type="button" class="te-auth-btn-google">${TE_AUTH_ICONO_GOOGLE} Continuar con Google</button>
            <div class="te-auth-separador"><span>o con tu email</span></div>

            <form class="te-auth-form" data-vista="login">
                <label>Email<input type="email" name="email" required></label>
                <label>Contraseña<input type="password" name="password" required></label>
                <p class="te-auth-error" hidden></p>
                <button type="submit" class="te-auth-btn te-auth-btn-full">Entrar</button>
            </form>
            <form class="te-auth-form" data-vista="registro" hidden>
                <label>Email<input type="email" name="email" required></label>
                <label>Contraseña (mín. 8 caracteres)<input type="password" name="password" minlength="8" required></label>
                <p class="te-auth-error" hidden></p>
                <button type="submit" class="te-auth-btn te-auth-btn-full">Crear cuenta</button>
            </form>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('.te-auth-cerrar').addEventListener('click', () => overlay.remove());

    overlay.querySelector('.te-auth-btn-google').addEventListener('click', async () => {
        try {
            await teAuthLoginGoogle();
            overlay.remove();
        } catch (err) {
            // El usuario cerró el popup u ocurrió un error de OAuth; no hace falta mostrar nada, puede reintentarlo.
        }
    });

    const tabs = overlay.querySelectorAll('.te-auth-tab');
    const forms = overlay.querySelectorAll('.te-auth-form');

    function mostrarVista(vista) {
        forms.forEach(f => f.hidden = f.dataset.vista !== vista);
        tabs.forEach(t => t.classList.toggle('te-auth-tab-activo', t.dataset.irA === vista));
    }

    overlay.querySelectorAll('[data-ir-a]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarVista(link.dataset.irA);
        });
    });

    const formLogin = overlay.querySelector('[data-vista="login"]');
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = formLogin.querySelector('.te-auth-error');
        errorEl.hidden = true;
        try {
            await teAuthLogin(formLogin.email.value, formLogin.password.value);
            overlay.remove();
        } catch (err) {
            errorEl.textContent = 'Email o contraseña incorrectos.';
            errorEl.hidden = false;
        }
    });

    const formRegistro = overlay.querySelector('[data-vista="registro"]');
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = formRegistro.querySelector('.te-auth-error');
        errorEl.hidden = true;
        try {
            const email = formRegistro.email.value;
            await teAuthRegistrar(email, formRegistro.password.value);
            formRegistro.replaceWith(teAuthCrearAvisoVerificacion(email));
        } catch (err) {
            errorEl.textContent = 'No se pudo crear la cuenta (¿email ya registrado?).';
            errorEl.hidden = false;
        }
    });
}

function teAuthCrearAvisoVerificacion(email) {
    const p = document.createElement('p');
    p.className = 'te-auth-aviso-verificacion';
    p.innerHTML = `Cuenta creada. Te hemos enviado un email de confirmación a <strong>${email}</strong> — revisa tu bandeja de entrada para verificarla.`;
    return p;
}
