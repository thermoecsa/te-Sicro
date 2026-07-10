// Configuración global y compartida del diagrama sicrométrico (presión, ejes, líneas auxiliares).
// La lee/escribe tanto el canvas (AireHumedo_Diagrama_Canvas.js) como el modal de configuración
// (ModalConfiguracion.js) y estados.js (para que los estados nuevos nazcan con la presión global).

function valoresPorDefecto() {
    return {
        presionAbsoluta: 101325, // Pa — única para todos los estados del proyecto

        ejes: {
            t: { mostrar: true, nombre: 'Temperatura (ºC)', min: 5, max: 40, paso: 5, color: '#cbd5e1' },
            w: { mostrar: true, nombre: 'Humedad absoluta (gr/kg as)', min: 0, max: 60, paso: 5, color: '#cbd5e1' }
        },

        hr: { mostrar: true, numLineas: 9, color: '#94a3b8' },  // líneas de HR=cte intermedias (además de la de 100%, siempre visible)
        th: { mostrar: true, numLineas: 6, color: '#2563eb' },  // líneas de TH=cte

        h: { mostrar: true, numLineas: 8, color: '#9D162E' }    // líneas de entalpía + escala oblicua junto a la saturación
    };
}

export const DEFAULTS_SICRO = valoresPorDefecto();

export const configSicro = valoresPorDefecto();

// Restaura configSicro a los valores de fábrica, mutando el mismo objeto (los demás módulos
// guardan una referencia a configSicro, así que hay que mutar, no reasignar).
export function resetConfigSicro() {
    const def = valoresPorDefecto();
    configSicro.presionAbsoluta = def.presionAbsoluta;
    Object.assign(configSicro.ejes.t, def.ejes.t);
    Object.assign(configSicro.ejes.w, def.ejes.w);
    Object.assign(configSicro.hr, def.hr);
    Object.assign(configSicro.th, def.th);
    Object.assign(configSicro.h, def.h);
}
