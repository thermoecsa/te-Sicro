import { editor_AireHumedo2 } from '/AireHumedo_Editor_002/editor_AireHumedo.js';

export function iniciaEditorEstado(container) {
    const editor = new editor_AireHumedo2(container);
    editor.renderizarTabla();
    editor.escribirValores();

    return editor;
}

