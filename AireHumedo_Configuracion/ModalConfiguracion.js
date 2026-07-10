import { configSicro, resetConfigSicro } from './configDiagrama.js';

// Ejes y líneas auxiliares configurables del diagrama: una fila por eje/línea en la pestaña "Diagrama".
const EJES_DIAGRAMA = [
    { key: 't', nombre: 'Temperatura seca [ºC]' },
    { key: 'w', nombre: 'Humedad absoluta [gr/kg as]' }
];
const LINEAS_DIAGRAMA = [
    { key: 'hr', nombre: 'Humedad relativa constante' },
    { key: 'th', nombre: 'Temperatura húmeda constante' },
    { key: 'h', nombre: 'Entalpía constante' }
];

// Modal de configuración del diagrama sicrométrico. Pensado para ir creciendo: `tabs` es una
// lista de { id, label, render(container) } — añadir una pestaña nueva es solo añadir un
// elemento a esa lista, sin tocar la estructura del modal (cabecera, tabs, cuerpo, pie).
export class ModalConfiguracion {
    constructor(deps) {
        this.deps = deps; // { sicro, stateManager, tablaEstados }
        this.tabActiva = 'diagrama';
        this.tabs = [
            { id: 'diagrama', label: 'Diagrama', render: (cont) => this.renderTabDiagrama(cont) }
        ];

        this.cargarCSS('./AireHumedo_Configuracion/ModalConfiguracion.css');
        this.creaModal();
    }

    cargarCSS(ruta) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = ruta;
        document.head.appendChild(link);
    }

    creaModal() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'te-modal-overlay';
        this.overlay.hidden = true;

        this.overlay.innerHTML = `
            <div class="te-modal" role="dialog" aria-modal="true">
                <div class="te-modal-cabecera">
                    <h2 class="te-modal-titulo">Configuración</h2>
                    <button type="button" class="te-modal-cerrar" title="Cerrar">✕</button>
                </div>
                <nav class="te-modal-tabs"></nav>
                <div class="te-modal-cuerpo"></div>
                <div class="te-modal-pie">
                    <button type="button" class="te-modal-btn te-modal-btn-secundario te-modal-btn-reset">Restablecer valores por defecto</button>
                    <button type="button" class="te-modal-btn te-modal-btn-primario te-modal-btn-cerrar">Cerrar</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.overlay);

        this.tabsNav = this.overlay.querySelector('.te-modal-tabs');
        this.cuerpo = this.overlay.querySelector('.te-modal-cuerpo');

        this.overlay.querySelector('.te-modal-cerrar').addEventListener('click', () => this.close());
        this.overlay.querySelector('.te-modal-btn-cerrar').addEventListener('click', () => this.close());
        this.overlay.querySelector('.te-modal-btn-reset').addEventListener('click', () => {
            resetConfigSicro();
            this.aplicarCambioPresion(); // recalcula todo a la presión/valores por defecto
            this.deps.sicro.restablecerZoom();
            this.renderTabActiva();
        });
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.overlay.hidden) this.close();
        });

        this.renderTabs();
    }

    renderTabs() {
        this.tabsNav.innerHTML = this.tabs.map(t =>
            `<button type="button" class="te-modal-tab ${t.id === this.tabActiva ? 'te-tab-activa' : ''}" data-tab="${t.id}">${t.label}</button>`
        ).join('');
        this.tabsNav.querySelectorAll('.te-modal-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                this.tabActiva = btn.dataset.tab;
                this.renderTabs();
                this.renderTabActiva();
            });
        });
    }

    renderTabActiva() {
        this.cuerpo.innerHTML = '';
        const tab = this.tabs.find(t => t.id === this.tabActiva);
        if (tab) tab.render(this.cuerpo);
    }

    open() {
        this.renderTabs();
        this.renderTabActiva();
        this.overlay.hidden = false;
        // Forzar reflow para que la transición de apertura se aprecie
        requestAnimationFrame(() => this.overlay.classList.add('te-modal-abierto'));
    }

    close() {
        this.overlay.classList.remove('te-modal-abierto');
        this.overlay.hidden = true;
    }

    // Aplica un cambio de presión ya guardado en configSicro.presionAbsoluta a todos los
    // estados existentes y refresca tabla/diagrama/procesos. La usan el input de presión y
    // el botón de "Restablecer valores por defecto".
    aplicarCambioPresion() {
        const { stateManager, tablaEstados, sicro } = this.deps;
        stateManager.getStates().forEach(st => st.getAireHumedo().setPresion(configSicro.presionAbsoluta));
        tablaEstados.recalcularTodosTrasCambioPresion();
        tablaEstados.renderTable();
        sicro.reDibuja();
        if (window.renderProcesos) window.renderProcesos();
    }

    // ── Pestaña "Diagrama" ──────────────────────────────────────────────────────────────
    renderTabDiagrama(cont) {
        cont.innerHTML = `
            <div class="te-modal-seccion">
                <h3 class="te-modal-seccion-titulo">Presión</h3>
                <div class="te-modal-campos">
                    <div class="te-modal-campo">
                        <label>Presión atmosférica [kPa]</label>
                        <input type="number" step="0.1" id="cfg-presion" value="${(configSicro.presionAbsoluta / 1000).toFixed(3)}">
                    </div>
                </div>
            </div>

            <div class="te-modal-seccion">
                <h3 class="te-modal-seccion-titulo">Ejes</h3>
                <div class="te-modal-filas-ejes">
                    <div class="te-modal-fila-eje te-modal-fila-eje-cabecera">
                        <span></span><span>Eje</span><span>Mín.</span><span>Máx.</span><span>Paso</span><span>Color</span>
                    </div>
                    ${EJES_DIAGRAMA.map(e => `
                    <div class="te-modal-fila-eje" data-key="${e.key}">
                        <input type="checkbox" class="cfg-eje-mostrar" ${configSicro.ejes[e.key].mostrar ? 'checked' : ''} title="Ver eje">
                        <span class="te-modal-fila-nombre">${e.nombre}</span>
                        <input type="number" class="cfg-eje-min" step="0.5" value="${configSicro.ejes[e.key].min}">
                        <input type="number" class="cfg-eje-max" step="0.5" value="${configSicro.ejes[e.key].max}">
                        <input type="number" class="cfg-eje-paso" step="0.5" min="0.1" value="${configSicro.ejes[e.key].paso}">
                        <input type="color" class="cfg-eje-color" value="${configSicro.ejes[e.key].color}">
                    </div>`).join('')}
                </div>
            </div>

            <div class="te-modal-seccion">
                <h3 class="te-modal-seccion-titulo">Líneas del diagrama</h3>
                <div class="te-modal-filas-lineas">
                    <div class="te-modal-fila-linea te-modal-fila-linea-cabecera">
                        <span></span><span>Línea</span><span>Nº líneas</span><span>Color</span>
                    </div>
                    ${LINEAS_DIAGRAMA.map(l => `
                    <div class="te-modal-fila-linea" data-key="${l.key}">
                        <input type="checkbox" class="cfg-linea-mostrar" ${configSicro[l.key].mostrar ? 'checked' : ''} title="Ver línea">
                        <span class="te-modal-fila-nombre">${l.nombre}</span>
                        <input type="number" class="cfg-linea-num" min="0" step="1" value="${configSicro[l.key].numLineas}">
                        <input type="color" class="cfg-linea-color" value="${configSicro[l.key].color}">
                    </div>`).join('')}
                </div>
            </div>
        `;

        const { sicro } = this.deps;

        cont.querySelector('#cfg-presion').addEventListener('change', (ev) => {
            configSicro.presionAbsoluta = Number(ev.target.value) * 1000;
            this.aplicarCambioPresion();
        });

        cont.querySelectorAll('.te-modal-fila-eje[data-key]').forEach(fila => {
            const eje = configSicro.ejes[fila.dataset.key];
            fila.querySelector('.cfg-eje-mostrar').addEventListener('change', (ev) => {
                eje.mostrar = ev.target.checked;
                sicro.reDibuja();
            });
            fila.querySelector('.cfg-eje-min').addEventListener('change', (ev) => {
                eje.min = Number(ev.target.value);
                sicro.restablecerZoom();
            });
            fila.querySelector('.cfg-eje-max').addEventListener('change', (ev) => {
                eje.max = Number(ev.target.value);
                sicro.restablecerZoom();
            });
            fila.querySelector('.cfg-eje-paso').addEventListener('change', (ev) => {
                eje.paso = Number(ev.target.value);
                sicro.reDibuja();
            });
            fila.querySelector('.cfg-eje-color').addEventListener('input', (ev) => {
                eje.color = ev.target.value;
                sicro.reDibuja();
            });
        });

        cont.querySelectorAll('.te-modal-fila-linea[data-key]').forEach(fila => {
            const key = fila.dataset.key;
            fila.querySelector('.cfg-linea-mostrar').addEventListener('change', (ev) => {
                configSicro[key].mostrar = ev.target.checked;
                sicro.reDibuja();
            });
            fila.querySelector('.cfg-linea-num').addEventListener('change', (ev) => {
                configSicro[key].numLineas = Number(ev.target.value);
                sicro.reDibuja();
            });
            fila.querySelector('.cfg-linea-color').addEventListener('input', (ev) => {
                configSicro[key].color = ev.target.value;
                sicro.reDibuja();
            });
        });
    }
}
