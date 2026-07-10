// /AireHumedo/estados.js

import { EstadoAireHumedo } from '../AireHumedo/estadoAireHumedo.js'; // Importar la clase EstadoAireHumedo
import { configSicro } from '../AireHumedo_Configuracion/configDiagrama.js';

function hslAHex(h, s, l) {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const aHex = (x) => Math.round(255 * x).toString(16).padStart(2, '0');
    return `#${aHex(f(0))}${aHex(f(8))}${aHex(f(4))}`;
}

// Color por defecto de un estado nuevo: una escala de tonos (ángulo dorado, para que colores
// consecutivos queden bien separados visualmente) con saturación y luminosidad moderadas, en
// vez de un hex totalmente aleatorio — que podía salir demasiado intenso/neón. El usuario puede
// cambiarlo luego a mano desde la tabla.
function colorPorIndice(indice) {
    const tono = (indice * 137.508) % 360;
    return hslAHex(tono, 55, 45);
}

export class estados {
    constructor() {
        this.states = [];
    }

    getNextStateName() {
        let maxNum = 0;
        this.states.forEach(state => {
            const name = state.getName();
            if (name) {
                const match = name.match(/^E(\d+)$/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNum) {
                        maxNum = num;
                    }
                }
            }
        });
        return 'E' + (maxNum + 1);
    }


    addState(state = null) {
        const name = this.getNextStateName();

        // Todo estado nuevo (venga de aquí o ya construido por el llamante) nace con la
        // presión global del proyecto y un color de la escala de tonos por defecto — es un
        // único punto de paso para todas las altas.
        if (state === null) {
            // Crear un nuevo EstadoAireHumedo si no se pasa argumento
            const newEstado = new EstadoAireHumedo();
            newEstado.setName(name);
            newEstado.setColor(colorPorIndice(this.states.length));
            newEstado.getAireHumedo().setPresion(configSicro.presionAbsoluta);
            this.states.push(newEstado);
            return newEstado;
        }
        else {
 //       if (state instanceof EstadoAireHumedo) {
            const currName = state.getName();
            if (!currName || currName.startsWith('Estado ') || /^E\d+$/.test(currName)) {
                state.setName(name);
            }
            state.setColor(colorPorIndice(this.states.length));
            state.getAireHumedo().setPresion(configSicro.presionAbsoluta);
            this.states.push(state);
            return state;
        }
   
       
           //     throw new Error('El objeto debe ser una instancia de EstadoAireHumedo.');
    }


    getStates() {   
        return this.states;
    }

    getState(index) {        
        return this.states[index];      
    }
    deleteState(index) {
        this.states.splice(index, 1);
    }

    moveStateUp(index) {
        if (index > 0) {
            [this.states[index], this.states[index - 1]] = [this.states[index - 1], this.states[index]];
        }
    }

    moveStateDown(index) {
        if (index < this.states.length - 1) {
            [this.states[index], this.states[index + 1]] = [this.states[index + 1], this.states[index]];
        }
    }

    toggleVisibility(index) {
        this.states[index].visible = !this.states[index].visible;
    }

    updateColor(index, newColor) {
        this.states[index].color = newColor;
    }

    updateIcon(index, newIcon) {
        this.states[index].icon = newIcon;
    }
}
