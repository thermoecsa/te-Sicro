import { AireHumedo } from '../AireHumedo/aireHumedo.js';

export class editor_AireHumedo {
    constructor(contenedor,onStateChange=null) {
        this.contenedor = contenedor;
        this.onStateChange = onStateChange; // Función de callback para manejar el cambio de estado
     
        this.aireHumedo = new AireHumedo();
        this.aireHumedo.setEstado('T', 25, 'HR', 50);

        this.tabla = null;
        this.numVariablesActivas = 2;
        this.numVariables = 7;
        this.estadoVariable = [true, true, false, false, false, false, false];
        
        // Asociar cada variable con su tipo correspondiente
        this.tipoVariable = ['T', 'HR', 'W', 'TR', 'TH', 'H', 'V'];
        
        this.nombreVariable = [
            ["Temperatura seca", "Dry temperature"],
            ["Humedad relativa", "Relative Humidity"],
            ["Humedad absoluta", "Humidity ratio"],
            ["Temperatura rocío", "Dew Temperature"],
            ["Temperatura húmeda", "Wet temperature"],
            ["Entalpía", "Enthalpy"],
            ["Volumen específico", "Specific volume"]
        ];

        // Identificadores cortos para mostrar en la columna ID (igual que la tabla)
        this.idVariable = ['Ts', 'HR', 'W', 'TR', 'TH', 'H', 'V'];
        
        this.unidadVariable = [
            ["ºC", "K"],
            ["%", "%"],
            ["gr/kg as", "gr/lb da"],
            ["ºC", "K"],
            ["ºC", "K"],
            ["kJ/kg as", "Btu/lb da"],
            ["m^3/kg as", "ft^3/lb da"]
        ];

        this.cargarCSS('/AireHumedo_Editor_001/AireHumedo_Editor_001.css');

    }

    // Función para cargar el archivo CSS
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
        this.tabla.classList.add("editor-aireHumedo");
        this.contenedor.appendChild(this.tabla);

        const tblHead = document.createElement("thead");
        const tblBody = document.createElement("tbody");
        this.tabla.appendChild(tblHead);
        this.tabla.appendChild(tblBody);

        // Crear fila cabecera
        const filaCabecera = document.createElement("tr");
        ["", "ID", "Variable", "Valor", "Unidad"].forEach(texto => {
            const celda = document.createElement("th");
            celda.appendChild(document.createTextNode(texto));
            filaCabecera.appendChild(celda);
        });
        tblHead.appendChild(filaCabecera);

        // Crear fila para presión atmosférica
        const filaPresion = document.createElement("tr");
        filaPresion.innerHTML = `
            <td></td>
            <td class="var-id" title="Presión atmosférica">P</td>
            <td id="vp-nombre">Presión atmosférica</td>
            <td><input type="number" id="vp-valor" value="101.325" min="0"></td>
            <td id="vp-unidad">[kPa]</td>
        `;
        tblBody.appendChild(filaPresion);

        // Crear filas para las variables
        for (let i = 0; i < this.numVariables; i++) {
            const fila = document.createElement("tr");
            fila.classList.add("editor-aireHumedo");
            fila.innerHTML = `
                <td><input type="checkbox" id="v${i}-check" ${this.estadoVariable[i] ? "checked" : ""}></td>
                <td class="var-id" title="${this.nombreVariable[i][0]}">${this.idVariable[i]}</td>
                <td id="v${i}-nombre">${this.nombreVariable[i][0]}</td>
                <td><input type="number" id="v${i}-valor" min="0" ${this.estadoVariable[i] ? "" : "disabled"}></td>
                <td id="v${i}-unidad">[${this.unidadVariable[i][0]}]</td>
            `;
            tblBody.appendChild(fila);
        }

        // Agregar mensaje
        const mensaje = document.createElement("p");
        mensaje.setAttribute("id", "mensaje");
        mensaje.setAttribute("style", "background-color:c2001B");
        this.contenedor.appendChild(mensaje);

        // Agregar los manejadores de eventos a los elementos creados
        this.agregarEventos();
    }

    agregarEventos() {
        // Obtener elementos de la tabla
        const inputPresion = document.getElementById('vp-valor');
        inputPresion.addEventListener('input', () => this.calcular());

        for (let i = 0; i < this.numVariables; i++) {
            const inputValor = document.getElementById(`v${i}-valor`);
            const inputCheck = document.getElementById(`v${i}-check`);
            
            // Evento para cambios en el valor de las variables
            inputValor.addEventListener('change', () => this.calcular());

            // Evento para activar/desactivar variables
            inputCheck.addEventListener('click', () => this.activarVariable(i));
        }
    }

    activarVariable(id) {
        this.estadoVariable[id] = document.getElementById(`v${id}-check`).checked;
        this.numVariablesActivas += this.estadoVariable[id] ? 1 : -1;

        if (this.numVariablesActivas === 0 || this.numVariablesActivas === 1) {
            for (let i = 0; i < this.numVariables; i++) {
                const check = document.getElementById(`v${i}-check`);
                const valor = document.getElementById(`v${i}-valor`);
                valor.disabled = !this.estadoVariable[i];
                check.disabled = false;
            }
        } else if (this.numVariablesActivas === 2) {
            for (let i = 0; i < this.numVariables; i++) {
                const check = document.getElementById(`v${i}-check`);
                const valor = document.getElementById(`v${i}-valor`);
                valor.disabled = !this.estadoVariable[i];
                check.disabled = !this.estadoVariable[i];
            }
        }
    }

    calcular() {
        const Patm = Number(document.getElementById('vp-valor').value) * 1000;
        const valores = [];
        const tipos = [];

        // Asociar los valores a sus tipos correctos
        for (let i = 0; i < this.numVariables; i++) {
            if (this.estadoVariable[i]) {
                valores.push(Number(document.getElementById(`v${i}-valor`).value));
                tipos.push(this.tipoVariable[i]); // Usar tipoVariable en lugar de nombreVariable
            }
        }

        this.aireHumedo.setPresion(Patm);
        const existe = this.aireHumedo.setEstado(tipos[0], valores[0], tipos[1], valores[1]);

        const mensaje = document.getElementById('mensaje');
        if (existe) {
            mensaje.innerHTML = "";
            this.escribirValores();
        } else {
            mensaje.innerHTML = "Combinación incoherente";
        }
    }

    escribirValores(notify = true) {
        document.getElementById('vp-valor').value = (this.aireHumedo.get('P') / 1000).toFixed(3);
        for (let i = 0; i < this.numVariables; i++) {
            document.getElementById(`v${i}-valor`).value = this.aireHumedo.get(this.tipoVariable[i]).toFixed(2); // Usar tipoVariable para obtener los valores
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
