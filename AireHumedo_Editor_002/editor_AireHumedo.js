import { AireHumedo } from '../AireHumedo/aireHumedo.js';

export class editor_AireHumedo2 {
    constructor(contenedor, onStateChange = null) {
        this.contenedor = contenedor;
        this.onStateChange = onStateChange; // Función de callback para manejar el cambio de estado

        this.aireHumedo = new AireHumedo();
        this.aireHumedo.setEstado('T', 25, 'HR', 50);

        this.tabla = null;
        this.numVariablesActivas = 2;
        this.numVariables = 7;
        this.estadoVariable = [true, true, false, false, false, false, false];
        
        this.tipoVariable = ['T', 'HR', 'W', 'TR', 'TH', 'H', 'V'];
        
        this.nombreVariable = [
            ["T", "Dry temperature"],
            ["HR", "Relative Humidity"],
            ["W", "Humidity ratio"],
            ["Tr", "Dew Temperature"],
            ["Th", "Wet temperature"],
            ["h", "Enthalpy"],
            ["v", "Specific volume"]
        ];
        
        this.unidadVariable = [
            ["ºC", "K"],
            ["%", "%"],
            ["gr/kg as", "gr/lb da"],
            ["ºC", "K"],
            ["ºC", "K"],
            ["kJ/kg as", "Btu/lb da"],
            ["m^3/kg as", "ft^3/lb da"]
        ];

        this.cargarCSS('/AireHumedo_Editor_002/AireHumedo_Editor_002.css');
    }

    cargarCSS(rutaCSS) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = rutaCSS;
        document.head.appendChild(link);
    }

    renderizarTabla() {
        this.contenedor.innerHTML = ""; // Limpiar contenido previo
        this.contenedor.setAttribute("style", "background-color:whitesmoke");

        this.tabla = document.createElement("table");
        this.tabla.classList.add("editor-aireHumedo2");
        this.contenedor.appendChild(this.tabla);

        const tblHead = document.createElement("thead");
        const tblBody = document.createElement("tbody");
        this.tabla.appendChild(tblHead);
        this.tabla.appendChild(tblBody);

        const filaCabecera = document.createElement("tr");

        const celdaPresion = document.createElement("th");
        celdaPresion.innerHTML = `
            <span>P [kPa]</span>
        `;
        celdaPresion.style.textAlign = "center";
        filaCabecera.appendChild(celdaPresion);

        this.nombreVariable.forEach((n, idx) => {
            const celda = document.createElement("th");
            celda.style.textAlign = "center";
            celda.innerHTML = `
                <label style="display: inline-flex; align-items: center; gap: 5px;">
                    <input type="checkbox" id="e2-v${idx}-check" ${this.estadoVariable[idx] ? "checked" : ""} style="margin: 0;">
                    <span>${n[0]} [${this.unidadVariable[idx][0]}]</span>
                </label>
            `;
            filaCabecera.appendChild(celda);
        });

        tblHead.appendChild(filaCabecera);

        const filaValores = document.createElement("tr");
        filaValores.innerHTML = `
            <td><input type="number" id="e2-vp-valor" value="101.325" min="0"></td>
            ${this.nombreVariable.map((_, idx) => `
                <td>
                    <input type="number" id="e2-v${idx}-valor" min="0" ${this.estadoVariable[idx] ? "" : "disabled"}>
                </td>
            `).join('')}
        `;
        tblBody.appendChild(filaValores);

        const mensaje = document.createElement("P");
        mensaje.setAttribute("id", "e2-mensaje");
        mensaje.setAttribute("style", "background-color:c2001B");
        this.contenedor.appendChild(mensaje);

        this.agregarEventos();
    }

    agregarEventos() {
        const inputPresion = document.getElementById('e2-vp-valor');
        inputPresion.addEventListener('input', () => this.calcular());

        for (let i = 0; i < this.numVariables; i++) {
            const inputValor = document.getElementById(`e2-v${i}-valor`);
            const inputCheck = document.getElementById(`e2-v${i}-check`);
            
            inputValor.addEventListener('change', () => this.calcular());
            inputCheck.addEventListener('click', () => this.activarVariable(i));
        }
    }

    activarVariable(id) {
        const check = document.getElementById(`e2-v${id}-check`);
        const valor = document.getElementById(`e2-v${id}-valor`);
        this.estadoVariable[id] = check.checked;
        this.numVariablesActivas += this.estadoVariable[id] ? 1 : -1;

        for (let i = 0; i < this.numVariables; i++) {
            const checkElem = document.getElementById(`e2-v${i}-check`);
            const valorElem = document.getElementById(`e2-v${i}-valor`);
            valorElem.disabled = !this.estadoVariable[i];
            checkElem.disabled = this.numVariablesActivas === 2 && !this.estadoVariable[i];
        }
    }

    calcular() {
        const Patm = Number(document.getElementById('e2-vp-valor').value) * 1000;
        const valores = [];
        const tipos = [];

        for (let i = 0; i < this.numVariables; i++) {
            if (this.estadoVariable[i]) {
                valores.push(Number(document.getElementById(`e2-v${i}-valor`).value));
                tipos.push(this.tipoVariable[i]);
            }
        }

        this.aireHumedo.setPresion(Patm);
        const existe = this.aireHumedo.setEstado(tipos[0], valores[0], tipos[1], valores[1]);

        const mensaje = document.getElementById('e2-mensaje');
        if (existe) {
            mensaje.innerHTML = "";
            this.escribirValores();
        } else {
            mensaje.innerHTML = "Combinación incoherente";
        }
    }

    escribirValores(notify = true) {
        document.getElementById('e2-vp-valor').value = (this.aireHumedo.get('P') / 1000).toFixed(3);
        for (let i = 0; i < this.numVariables; i++) {
            document.getElementById(`e2-v${i}-valor`).value = this.aireHumedo.get(this.tipoVariable[i]).toFixed(2);
        }
        if (notify && this.onStateChange !== null && this.onStateChange !== undefined) {
            this.onStateChange(); // Llamar a la función de callback
        }
       }

    cambiarAireHumedo(nuevoAireHumedo) {
        this.aireHumedo = nuevoAireHumedo;
        this.escribirValores(false);
    }
}
