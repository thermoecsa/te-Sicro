import { editor_AireHumedo } from '/AireHumedo_Editor_001/editor_AireHumedo.js';

export function iniciaEditorEstado(container) {
    console.log('Contenedor encontrado:', container); // Verifica si el contenedor existe

    const editor = new editor_AireHumedo(container);
    editor.renderizarTabla();
    editor.escribirValores();

    return editor;
}

