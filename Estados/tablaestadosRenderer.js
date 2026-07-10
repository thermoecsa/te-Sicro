// Las 7 propiedades sicrométricas editables (mismo listado/orden que usaba el panel de detalle),
// más la presión (que va aparte, siempre editable, no cuenta en el grupo de "2 activas").
export const VARIABLES = [
    { id: 'Ts', tipo: 'T', nombre: 'Temperatura seca', unidad: 'ºC' },
    { id: 'HR', tipo: 'HR', nombre: 'Humedad relativa', unidad: '%' },
    { id: 'W', tipo: 'W', nombre: 'Humedad absoluta', unidad: 'gr/kg as' },
    { id: 'Tr', tipo: 'TR', nombre: 'Temperatura rocío', unidad: 'ºC' },
    { id: 'Th', tipo: 'TH', nombre: 'Temperatura húmeda', unidad: 'ºC' },
    { id: 'h', tipo: 'H', nombre: 'Entalpía', unidad: 'kJ/kg as' },
    { id: 'v', tipo: 'V', nombre: 'Volumen específico', unidad: 'm³/kg as' }
];

export class TableRenderer {
    constructor(stateManager, container,onStateChange) {
        this.stateManager = stateManager;
        this.container = container;
        this.onStateChange = onStateChange; // Función de callback para manejar el cambio de estado
        this.selectedRowIndex = 0; // Índice de la fila seleccionada


        this.cargarCSS('./Estados/Tabla_Estados.css');
    }

    // Función para cargar el archivo CSS
    cargarCSS(rutaCSS) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = rutaCSS;
        document.head.appendChild(link);
    }

    // Cada estado recuerda qué 2 propiedades son las "activas" (editables) de sus 7 variables.
    // Por defecto Ts y HR, igual que el comportamiento anterior.
    asegurarVariablesActivas(state) {
        if (!state.variablesActivas || state.variablesActivas.length !== VARIABLES.length) {
            state.variablesActivas = VARIABLES.map((_, i) => i === 0 || i === 1);
        }
        return state.variablesActivas;
    }

    renderTable() {
        // Limpiar el contenedor
        this.container.innerHTML = '';

        // Crear la tabla
        const table = document.createElement('table');
        table.id = 'state-table';
        table.classList.add('tabla-estados');

        // Crear el encabezado de la tabla (2 filas: acrónimo con tooltip, y unidad debajo)
        const thead = document.createElement('thead');
        const filaAcronimos = document.createElement('tr');
        filaAcronimos.innerHTML = `
            <th rowspan="2" title="Nombre del estado">ID</th>
            <th rowspan="2" title="Visibilidad">👁</th>
            <th rowspan="2" title="Icono">Icono</th>
            <th rowspan="2" title="Color">Color</th>
            ${VARIABLES.map(v => `<th title="${v.nombre}">${v.id}</th>`).join('')}
            <th rowspan="2" title="Acciones">⋮</th>
            <th rowspan="2" title="Reordenar">↕</th>
        `;
        const filaUnidades = document.createElement('tr');
        filaUnidades.innerHTML = VARIABLES.map(v => `<th class="th-unidad">[${v.unidad}]</th>`).join('');
        thead.appendChild(filaAcronimos);
        thead.appendChild(filaUnidades);
        table.appendChild(thead);

        // Crear el cuerpo de la tabla
        const tbody = document.createElement('tbody');
        this.stateManager.states.forEach((state, index) => {
            const activas = this.asegurarVariablesActivas(state);
            const row = document.createElement('tr');

            // Alternar colores de filas
            row.classList.add(index % 2 === 0 ? 'even' : 'odd');

            // Marcar como seleccionado si corresponde
            if (index === this.selectedRowIndex) {
                row.classList.add('selected');
            }

            // Agregar evento para seleccionar fila
            row.addEventListener('click', () => this.selectRow(row));

            // Crear las celdas
            const ICON_OPTIONS = [
                { value: 'circle',           label: '●' },
                { value: 'square',           label: '■' },
                { value: 'triangle-up',      label: '▲' },
                { value: 'triangle-down',    label: '▼' },
                { value: 'diamond',          label: '◆' },
                { value: 'star',             label: '★' },
                { value: 'cross',            label: '✚' },
                { value: 'circle-open',      label: '○' },
            ];

            // El icono actual del estado puede ser un valor Lucide o un carácter unicode legacy
            const currentIcon = state.icon || 'circle';
            // Detectar si es un icono Lucide (string sin unicode) o uno legacy
            const isLucideIcon = ICON_OPTIONS.some(o => o.value === currentIcon);
            const selectedLucide = isLucideIcon ? currentIcon : 'circle';

            const celdasVariables = VARIABLES.map((v, vi) => {
                const activa = activas[vi];
                const valor = state.aireHumedo.get(v.tipo);
                return `
                <td class="var-cell ${activa ? 'var-cell-activa' : ''}" title="${v.nombre}">
                    <input type="checkbox" class="var-check" data-idx="${vi}" ${activa ? 'checked' : ''} ${activa ? '' : (activas.filter(Boolean).length >= 2 ? 'disabled' : '')}>
                    <input type="number" class="var-valor" data-idx="${vi}" value="${(valor ?? 0).toFixed(2)}" ${activa ? '' : 'disabled'}>
                </td>`;
            }).join('');

            row.innerHTML = `
                <td contenteditable="true" class="editable">${state.name}</td>
                <td>
                    <button class="icon-btn eyes" title="${state.visible ? 'Ocultar' : 'Mostrar'}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" data-lucide="${state.visible ? 'eye' : 'eye-off'}" class="lucide-icon"></svg>
                    </button>
                </td>
                <td>
                    <div class="icon-picker-wrapper">
                        <button class="icon-picker-btn" title="Cambiar icono" style="color: ${state.color}">
                            <span class="icon-picker-label">${ICON_OPTIONS.find(o => o.value === selectedLucide)?.label ?? '●'}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" data-lucide="chevron-down" class="lucide-icon"></svg>
                        </button>
                        <div class="icon-dropdown" style="display:none;">
                            ${ICON_OPTIONS.map(o => `
                                <button class="icon-option ${o.value === selectedLucide ? 'icon-selected' : ''}"
                                    data-icon="${o.value}" title="${o.value}" style="color: ${state.color}">
                                    <span class="icon-shape-label">${o.label}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </td>
                <td><input type="color" value="${state.color}"></td>
                ${celdasVariables}
                <td>
                    <button class="icon-btn delete-btn" title="Eliminar estado">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" data-lucide="trash-2" class="lucide-icon"></svg>
                    </button>
                </td>
                <td class="reorder-cell">
                    <button class="icon-btn move-up" ${index === 0 ? 'disabled' : ''} title="Subir">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" data-lucide="chevron-up" class="lucide-icon"></svg>
                    </button>
                    <button class="icon-btn move-down" ${index === this.stateManager.states.length - 1 ? 'disabled' : ''} title="Bajar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" data-lucide="chevron-down" class="lucide-icon"></svg>
                    </button>
                </td>
            `;

            // Eventos de cada botón e input
            row.querySelector('.eyes').addEventListener('click', (e) => {
                e.stopPropagation();
                const rowIndex = e.target.closest('tr').rowIndex-2;
                this.stateManager.toggleVisibility(index);
                this.renderTable();
                this.onStateChange(rowIndex >= 0 ? this.stateManager.getState(rowIndex) : null);
            });

            // Icon picker dropdown logic
            const pickerBtn = row.querySelector('.icon-picker-btn');
            const dropdown = row.querySelector('.icon-dropdown');
            pickerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Cerrar otros dropdowns abiertos
                document.querySelectorAll('.icon-dropdown').forEach(d => {
                    if (d !== dropdown) d.style.display = 'none';
                });
                dropdown.style.display = dropdown.style.display === 'none' ? 'grid' : 'none';
            });
            row.querySelectorAll('.icon-option').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const rowIndex = e.target.closest('tr').rowIndex-2;
                    const newIcon = btn.dataset.icon;
                    this.stateManager.updateIcon(index, newIcon);
                    dropdown.style.display = 'none';
                    this.renderTable();
                    this.onStateChange(rowIndex >= 0 ? this.stateManager.getState(rowIndex) : null);
                });
            });

            row.querySelector('input[type="color"]').addEventListener('change', (e) => {
                const rowIndex = e.target.closest('tr').rowIndex-2;
                this.stateManager.updateColor(index, e.target.value);
                this.renderTable();
                this.onStateChange(rowIndex >= 0 ? this.stateManager.getState(rowIndex) : null);           });

            row.querySelector('.delete-btn').addEventListener('click', (e) => {
                const rowIndex = e.target.closest('tr').rowIndex-2;
                e.stopPropagation();
                if(this.stateManager.getStates().length>1)this.stateManager.deleteState(index);
                this.renderTable();
                this.onStateChange(rowIndex >= 0 ? this.stateManager.getState(rowIndex) : null);
                                                                                                             });

            row.querySelector('.move-up').addEventListener('click', (e) => {
                e.stopPropagation();
                const rowIndex = e.target.closest('tr').rowIndex-2;
                this.stateManager.moveStateUp(index);
                this.renderTable();
                this.onStateChange(rowIndex >= 0 ? this.stateManager.getState(rowIndex) : null);           });

            row.querySelector('.move-down').addEventListener('click', (e) => {
                e.stopPropagation();
                const rowIndex = e.target.closest('tr').rowIndex-2;
                this.stateManager.moveStateDown(index);
                this.renderTable();
                this.onStateChange(rowIndex >= 0 ? this.stateManager.getState(rowIndex) : null);           });

            // Evento para actualizar el nombre al editar (se activa al perder el foco o pulsar Enter)
            const editableCell = row.querySelector('.editable');
            editableCell.addEventListener('blur', (e) => {
                const rowIndex = e.target.closest('tr').rowIndex-2;
                const newName = e.target.textContent.trim();

                if (this.stateManager.getState(rowIndex).getName() !== newName) {
                    this.stateManager.getState(rowIndex).setName(newName);
                    this.onStateChange(rowIndex >= 0 ? this.stateManager.getState(rowIndex) : null);
                    this.renderTable();
                }
            });

            editableCell.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Prevenir salto de línea
                    e.target.blur(); // Forzar el evento blur
                }
            });

            // Checkboxes de las 7 variables: alternar cuál de las 2 está activa (mismo comportamiento
            // que el antiguo panel de detalle: al llegar a 2, el resto se deshabilita hasta soltar una)
            row.querySelectorAll('.var-check').forEach((chk) => {
                chk.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const rowIndex = e.target.closest('tr').rowIndex - 2;
                    const st = this.stateManager.getState(rowIndex);
                    const vi = Number(e.target.dataset.idx);
                    const activas = this.asegurarVariablesActivas(st);
                    activas[vi] = e.target.checked;
                    this.renderTable();
                    this.onStateChange(st);
                });
            });

            // Inputs de valor de las 7 variables: recalcula el estado completo con las 2 activas
            row.querySelectorAll('.var-valor').forEach((inp) => {
                inp.addEventListener('change', (e) => {
                    const rowIndex = e.target.closest('tr').rowIndex - 2;
                    const st = this.stateManager.getState(rowIndex);
                    this.recalcularEstado(st);
                    this.renderTable();
                    this.onStateChange(st);
                });
            });

            tbody.appendChild(row);
        });

        table.appendChild(tbody);

        // Añadir la tabla al contenedor (el botón de añadir estado vive en la cabecera del panel)
        this.container.appendChild(table);

        // Renderizar todos los iconos Lucide del DOM
        if (window.lucide) window.lucide.createIcons();

        // Cerrar dropdowns al hacer click fuera
        document.addEventListener('click', () => {
            document.querySelectorAll('.icon-dropdown').forEach(d => d.style.display = 'none');
        }, { once: true });
    }

    // Recalcula un estado a partir de los valores actualmente escritos en sus 2 celdas activas
    // (lee del DOM porque el usuario puede haber cambiado el valor justo antes de disparar esto).
    recalcularEstado(state) {
        const activas = this.asegurarVariablesActivas(state);
        const indicesActivos = activas.map((a, i) => a ? i : -1).filter(i => i >= 0);
        if (indicesActivos.length !== 2) return;

        const idxEstado = this.stateManager.getStates().indexOf(state);
        const fila = this.container.querySelectorAll('tbody tr')[idxEstado];
        if (!fila) return;

        const [i1, i2] = indicesActivos;
        const v1 = Number(fila.querySelector(`.var-valor[data-idx="${i1}"]`).value);
        const v2 = Number(fila.querySelector(`.var-valor[data-idx="${i2}"]`).value);
        state.aireHumedo.setEstado(VARIABLES[i1].tipo, v1, VARIABLES[i2].tipo, v2);
    }

    // Recalcula todos los estados tras un cambio de presión global: a diferencia de
    // recalcularEstado(), no lee del DOM (la tabla puede no reflejar aún la presión nueva)
    // sino de los valores ya calculados en cada aireHumedo, para mantener fijo el mismo
    // par de variables que el usuario tenía activo en cada estado.
    recalcularTodosTrasCambioPresion() {
        this.stateManager.getStates().forEach((state) => {
            const activas = this.asegurarVariablesActivas(state);
            const indicesActivos = activas.map((a, i) => a ? i : -1).filter(i => i >= 0);
            if (indicesActivos.length !== 2) return;

            const [i1, i2] = indicesActivos;
            const v1 = state.aireHumedo.get(VARIABLES[i1].tipo);
            const v2 = state.aireHumedo.get(VARIABLES[i2].tipo);
            state.aireHumedo.setEstado(VARIABLES[i1].tipo, v1, VARIABLES[i2].tipo, v2);
        });
    }

    // Método para seleccionar una fila
    selectRow(row) {
        console.log('Row selected:', row);
        const index = row.rowIndex - 2; // 2 filas de cabecera
        if (index >= 0 && index !== this.selectedRowIndex) {
            this.selectedRowIndex = index;

            // Actualizar clase seleccionada en el DOM sin reconstruir la tabla
            const rows = this.container.querySelectorAll('tbody tr');
            rows.forEach((r, idx) => {
                if (idx === this.selectedRowIndex) {
                    r.classList.add('selected');
                } else {
                    r.classList.remove('selected');
                }
            });

            // Notificar cambios para que editor y canvas se actualicen
            const selectedState = this.stateManager.getState(this.selectedRowIndex);
            this.onStateChange(selectedState);
        }
    }

    addEstado(){
        const newState=this.stateManager.addState();
        this.selectedRowIndex = this.stateManager.states.length - 1;
        this.renderTable();
        this.onStateChange(newState); // Llamar a la función de callback
    }
}
