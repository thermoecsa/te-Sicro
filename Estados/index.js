// Importar las clases necesarias

import { estados } from '/Estados/estados.js';
import { TableRenderer } from '/Estados/tablaestadosRenderer.js';

export function iniciaTablaEstados(container) {

console.log('Contenedor encontrado:', container); // Verifica si el contenedor existe

// Inicializar el gestor de estados
const stateManager = new estados();

// Inicializar el renderizador de la tabla, pasando el StateManager y el ID del contenedor
const tableRenderer = new TableRenderer(stateManager, container,() => {});
tableRenderer.addEstado();
tableRenderer.renderTable();

return tableRenderer;

}

