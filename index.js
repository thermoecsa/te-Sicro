// Importar las clases necesarias
import { estados } from './Estados/estados.js';
import { TableRenderer } from './Estados/tablaestadosRenderer.js';
import { editor_AireHumedo } from './AireHumedo_Editor_001/editor_AireHumedo.js';
import { DiagramaSicrometrico } from './AireHumedo_Diagrama_Canvas/AireHumedo_Diagrama_Canvas.js';
import { ModalConfiguracion } from './AireHumedo_Configuracion/ModalConfiguracion.js';
import { configSicro } from './AireHumedo_Configuracion/configDiagrama.js';

export function inicia(container1, container2, container3) {
    // Crear el vector de estados
    const stateManager = new estados();
    var i_sicro=0;
    var i_editor1=0;
    var i_tablaestados=0;

    // Inicializar el renderizador del diagrama sicrométrico
    const sicro = new DiagramaSicrometrico(container3, stateManager, (aireHumedo) => {
        i_sicro=i_sicro+1;
        console.log('callback sicro',i_sicro);
        tablaEstados.renderTable(); // Actualizar tabla cuando cambia el diagrama
        editor.cambiarAireHumedo(aireHumedo); // Cambiar aire húmedo en el editor
        if (window.renderProcesos) window.renderProcesos();
    });

    // Inicializar el panel de detalle del estado seleccionado
    const editor = new editor_AireHumedo(container2, () =>
        {
            i_editor1=i_editor1+1;
            console.log('callback editor',i_editor1);
            tablaEstados.renderTable(); // Actualizar tabla cuando cambia el editor
            sicro.reDibuja(); // Redibujar el diagrama cuando cambia el editor
        }
    );

    // Inicializar el renderizador de la tabla, pasando el callback onStateChange
    const tablaEstados = new TableRenderer(stateManager, container1, (estado) => {
        if (estado != null) {
            i_tablaestados=i_tablaestados+1;
            console.log('callback tablaEstados',i_tablaestados);
            editor.cambiarAireHumedo(estado.getAireHumedo()); // Cambiar aire húmedo en el editor
            sicro.reDibuja(); // Redibujar el diagrama cuando cambia la tabla
        }
        if (window.renderProcesos) window.renderProcesos();
    });


    // Modal de configuración del diagrama (presión, ejes, líneas HR/TH/entalpía)
    const modalConfig = new ModalConfiguracion({ sicro, stateManager, tablaEstados });

    stateManager.addState(); // Añadir un estado inicial

    tablaEstados.renderTable(); // Actualizar tabla cuando cambia el editor

    sicro.reDibuja(); // Redibujar el diagrama cuando cambia el editor

    editor.renderizarTabla(); // Cambiar aire húmedo en el editor
    editor.cambiarAireHumedo(stateManager.getState(0).getAireHumedo()); // Cambiar aire húmedo en el editor

    // Expuesto para el guardado/carga de proyecto (ver js de la página): acceso al estado y
    // forma de refrescar todos los paneles tras sustituir los estados en bloque.
    window.__sicroApp = {
        stateManager,
        sicro,
        tablaEstados,
        modalConfig,
        configSicro,
        renderAll: () => {
            tablaEstados.renderTable();
            sicro.reDibuja();
            editor.renderizarTabla();
            if (window.renderProcesos) window.renderProcesos();
        }
    };
    if (window.renderProcesos) window.renderProcesos();
}
