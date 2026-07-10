import { estados } from '/Estados/estados.js';
import { DiagramaSicrometrico } from '/AireHumedo_Diagrama_Canvas/AireHumedo_Diagrama_Canvas.js';

export function iniciaDiagrama(container) {
    const stateManager = new estados();
    const sicro = new DiagramaSicrometrico(container,stateManager);

    return sicro;
}

