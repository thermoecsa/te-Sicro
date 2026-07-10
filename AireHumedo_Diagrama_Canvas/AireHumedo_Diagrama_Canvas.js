import { AireHumedo } from '../AireHumedo/aireHumedo.js'; // Importar la clase EstadoAireHumedo
import { EstadoAireHumedo } from '../AireHumedo/estadoAireHumedo.js'; // Importar la clase EstadoAireHumedo
import { configSicro } from '../AireHumedo_Configuracion/configDiagrama.js';
  
  var muestraCursor = false;
  var muestraEstadoCursor = true;
  var permitir_agregarEstados_Dblclick = true;
  var muestraEstados = true;
  var  muestraLeyendaEstados = true;

  var colorMarco = 'white';
  var colorDiagrama = 'white';

  var W = 0; // Ancho del canvas
  var  H = 0; // Alto del canvas
  var pR = 0; // Padding right
  var pL = 0; // Padding left
  var pT = 0; // Padding Top
  var  pB = 0; // Padding Bottom

  var X0 = 0;
  var Y0 = 0;
  var IX = 0;
  var IY = 0;

  var Tmin = 5;
  var Tmax = 40;
  var Wmin = 0;
  var Wmax = 60;

  var ejesAncho = 1.8;
  var ejesColor = 'black';

export class DiagramaSicrometrico {


  constructor(container,estados,onStateChange) {

    this.container=container;
    this.estados = estados;
    this.canvas = null;
    this.ctx = null;
    this.procesos = []; // [{ origen, destino, color, estilo }] — ver actualizarProcesos()

    // Zoom por selección: límites T-W actuales del área visible del diagrama.
    // Al pulsar y arrastrar se dibuja un rectángulo de selección y, al soltar,
    // esos límites pasan a ser los nuevos Tmin/Tmax/Wmin/Wmax (ejes y grid se recalculan).
    this.viewTmin = configSicro.ejes.t.min;
    this.viewTmax = configSicro.ejes.t.max;
    this.viewWmin = configSicro.ejes.w.min;
    this.viewWmax = configSicro.ejes.w.max;
    this._isSelecting = false;
    this._selStartX = 0;
    this._selStartY = 0;
    this._selCurX = 0;
    this._selCurY = 0;

    this.onStateChange = onStateChange; // Función de callback para manejar el cambio de estado

    this.creaSicro(container);

    this.cargarCSS('/AireHumedo_Diagrama_Canvas/AireHumedo_Diagrama_Canvas.css');

      // Observador de redimensionamiento
    this.resizeObserver = new ResizeObserver(() => {
        console.log('Alto: ', this.container.clientHeight, 'Ancho: ', this.container.clientWidth);
        this.reDibuja();
    });
    this.resizeObserver.observe(this.container);
  }

    // Función para cargar el archivo CSS
    cargarCSS(rutaCSS) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = rutaCSS;
      document.head.appendChild(link);
  }
 
creaSicro(container) {

   //CREANDO EL CANVAS 
  this.canvas = document.createElement("canvas");
  this.canvas.setAttribute("id", "teDiagramaSicrometrico");
  this.canvas.style.cursor = 'crosshair';
  this.canvas.addEventListener('mousemove', (evt) => this.onMouseMove(evt), false);
  this.canvas.addEventListener('mousedown', (evt) => this.onMouseDown(evt), false);
  this.canvas.addEventListener('mouseup', (evt) => this.onMouseUp(evt), false);
  this.canvas.addEventListener('mouseleave', (evt) => this.onMouseLeave(evt), false);
  this.canvas.addEventListener('contextmenu', (evt) => this.onResetZoom(evt), false);
  this.canvas.addEventListener('dblclick', (evt) => this.addNuevoEstado(evt), false);

  container.innerHTML = "";
  this.container.appendChild(this.canvas);


  this.ctx = this.canvas.getContext('2d');


  this.reDibuja();

}



reDibuja() {
  var ah = new AireHumedo();

  if (this.canvas.getContext) {

    //Ajustar al tamaño del contenedor
    const c = this.container
    this.canvas.height = c.clientHeight;
    this.canvas.width = c.clientWidth;


    //dimensiones del Area de Dibujo T-W
    W = this.canvas.width;
    H = this.canvas.height;
    pR = 0.05 * W; //padding right
    pB = 0.05 * H;
    // Con la escala de entalpía activa se reserva algo más de margen arriba/izquierda, donde
    // esa escala se pega por fuera a la curva de saturación, siguiendo su curvatura.
    pL = configSicro.h.mostrar ? 0.08 * W : 0.05 * W;
    pT = configSicro.h.mostrar ? 0.08 * H : 0.05 * H;

    //Dimensiones del gráfico T-W
    X0 = W - pR;
    Y0 = H - pB;
    IX = W - pR - pL;
    IY = H - pT - pB;

    //Posiciona los Ejes
    //ctx.translate(pLeft,alto-pBottom);
    //ctx.rotate(Math.PI);

    //dimensiones del Area de Dibujo T-W (límites actuales de zoom por selección)
    Tmin = this.viewTmin;
    Tmax = this.viewTmax;
    Wmin = this.viewWmin;
    Wmax = this.viewWmax;


    const ctx=this.ctx;
    // ----------------------------------------------------------
    //  COLOR FONDO SICROMÉTRICO
    ctx.fillStyle = colorMarco;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = colorDiagrama;
    ctx.fillRect(this.xT(Tmin), this.yW(Wmax), IX, IY);

    // ----------------------------------------------------------
    //  DIBUJA LOS EJES 
    ctx.setLineDash([]);
    this.dibujaEjes();

    //  ESCRIBE LEYENDAS EJES PRINCIPALES (mismo tamaño y color que las etiquetas de marcas)
    ctx.fillStyle = '#475569';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = '10px serif';
    ctx.fillText('Temperatura (ºC)', this.xT((Tmin + Tmax) / 2), Y0 + pB * 0.9 - 5);

    ah.setEstado('T', Tmax, 'HR', 100);
    var _wmax = ah.get('W');
    ctx.translate(X0 + pR / 2 + 10, this.yW((_wmax + Wmin) / 2));
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Humedad absoluta (gr H2O/kg a.s.)', 0, 0);
    ctx.rotate(+Math.PI / 2);
    ctx.translate(-(X0 + pR / 2 + 10), -this.yW((_wmax + Wmin) / 2));


    // ----------------------------------------------------------
    //  DIBUJA GRID VERTICAL (eje T)
    if (configSicro.ejes.t.mostrar && configSicro.ejes.t.paso > 0) {
      ctx.strokeStyle = configSicro.ejes.t.color;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([]);

      var IT = configSicro.ejes.t.paso;
      var decT = this.decimalesPaso(IT);
      var vT = new Array();
      for (var T = this.inicioEjes(Tmin, IT); T <= Tmax; T = T + IT) vT.push(this.redondeaPaso(T, decT));
      vT.forEach(element => this.dibujaT(element));

      ctx.fillStyle = '#475569';
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = '10px serif';
      vT.forEach(element => ctx.fillText(element.toFixed(decT), this.xT(element), Y0 + pB / 2));
    }

    // ----------------------------------------------------------
    //  DIBUJA GRID HORIZONTAL (eje W)
    if (configSicro.ejes.w.mostrar && configSicro.ejes.w.paso > 0) {
      ctx.strokeStyle = configSicro.ejes.w.color;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([]);

      ah.setEstado('T', Tmax, 'HR', 100);
      var _wmax = ah.get('W');
      var IW = configSicro.ejes.w.paso;
      var decW = this.decimalesPaso(IW);
      var vW = new Array();
      for (var _W = this.inicioEjes(Wmin, IW); _W <= _wmax; _W = _W + IW) vW.push(this.redondeaPaso(_W, decW));
      vW.forEach(element => this.dibujaW(element));

      ctx.fillStyle = '#475569';
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = '10px serif';
      vW.forEach(element => ctx.fillText(element.toFixed(decW), X0 + 10, this.yW(element) + 3));
    }



    // ----------------------------------------------------------
    //  DIBUJA CURVAS DE HR=cte (la de 100%, saturación, siempre visible: es el borde del diagrama)
    ctx.strokeStyle = configSicro.hr.color;
    ctx.lineWidth = 1;
    this.dibujaHR(100, false);

    if (configSicro.hr.mostrar) {
      ctx.setLineDash([5, 10]);
      ctx.lineWidth = 0.5;
      var HR = this.generaValoresHR(configSicro.hr.numLineas);
      // Fracción de la longitud de cada curva donde va su etiqueta: escalonada por línea para
      // que no coincidan todas en el mismo punto (ver comentario en dibujaHR).
      HR.forEach((element, i) => this.dibujaHR(element, true, 0.28 + 0.5 * (i / Math.max(1, HR.length - 1))));
    }

    // ----------------------------------------------------------
    //  DIBUJA CURVAS DE TH=cte
    if (configSicro.th.mostrar) {
      ctx.strokeStyle = configSicro.th.color;
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;
      var TH = this.generaValoresTH(configSicro.th.numLineas);
      TH.forEach(element => this.dibujaTH(element, true));
    }

    // ----------------------------------------------------------
    //  DIBUJA LÍNEAS DE ENTALPÍA (H=cte) Y SU ESCALA, JUNTO A LA CURVA DE SATURACIÓN
    if (configSicro.h.mostrar) {
      ctx.strokeStyle = configSicro.h.color;
      ctx.setLineDash([2, 4]);
      ctx.lineWidth = 0.6;

      ah.setEstado('T', Tmin, 'W', Wmin);
      var Hmin = ah.get('H');
      ah.setEstado('T', Tmax, 'HR', 100);
      var Hmax = ah.get('H');

      var pasoH = this.pasoEjes(Hmax - Hmin, configSicro.h.numLineas + 1);
      var decH = this.decimalesPaso(pasoH);
      var vH = new Array();
      for (var _H = this.inicioEjes(Hmin, pasoH); _H <= Hmax; _H = _H + pasoH) vH.push(this.redondeaPaso(_H, decH));

      // Eje recto de entalpía (calculado una sola vez) al que deben llegar todas las líneas
      var ejeH = this.calculaEjeEntalpia();
      var marcasH = [];
      vH.forEach(element => {
        var m = this.dibujaH(element, decH, ejeH);
        if (m) marcasH.push(m);
      });
      this.dibujaEscalaEntalpia(ejeH, marcasH);
    }

  }


  this.procesos.forEach(p => this.dibujaProceso(p));

  this.estados.getStates().forEach(element => {
    if (element.visible) {
        this.dibujaEstado(element);
    }
});

  this.dibujaSeleccion();

}

// Dibuja el rectángulo de selección (mientras se arrastra) que definirá el nuevo zoom
dibujaSeleccion() {
  if (!this._isSelecting) return;
  const ctx = this.ctx;
  const x = Math.min(this._selStartX, this._selCurX);
  const y = Math.min(this._selStartY, this._selCurY);
  const w = Math.abs(this._selCurX - this._selStartX);
  const h = Math.abs(this._selCurY - this._selStartY);

  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#9D162E';
  ctx.fillStyle = 'rgba(157, 22, 46, 0.12)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

// Sustituye la lista de procesos a dibujar (origen/destino/color/estilo de línea) y redibuja
actualizarProcesos(lista) {
  this.procesos = lista || [];
  this.reDibuja();
}

// Patrones de trazo disponibles para las líneas de proceso
static ESTILOS_LINEA = {
  solida: [],
  discontinua: [8, 5],
  punteada: [2, 4]
};

dibujaProceso(proceso) {
  const ctx = this.ctx;
  const ah1 = proceso.origen.getAireHumedo();
  const ah2 = proceso.destino.getAireHumedo();

  ctx.save();
  ctx.strokeStyle = proceso.color || '#9D162E';
  ctx.lineWidth = 2;
  ctx.setLineDash(DiagramaSicrometrico.ESTILOS_LINEA[proceso.estilo] || []);

  ctx.beginPath();
  ctx.moveTo(this.xT(ah1.get('T')), this.yW(ah1.get('W')));
  ctx.lineTo(this.xT(ah2.get('T')), this.yW(ah2.get('W')));
  ctx.stroke();

  // Punta de flecha en el destino
  const ang = Math.atan2(this.yW(ah2.get('W')) - this.yW(ah1.get('W')), this.xT(ah2.get('T')) - this.xT(ah1.get('T')));
  const px = this.xT(ah2.get('T')), py = this.yW(ah2.get('W'));
  const largo = 9;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px - largo * Math.cos(ang - Math.PI / 7), py - largo * Math.sin(ang - Math.PI / 7));
  ctx.lineTo(px - largo * Math.cos(ang + Math.PI / 7), py - largo * Math.sin(ang + Math.PI / 7));
  ctx.closePath();
  ctx.fillStyle = proceso.color || '#9D162E';
  ctx.fill();

  ctx.restore();
}

 xT(T) {
  return X0 - IX * (Tmax - T) / (Tmax - Tmin);
}

 yW(W) {
  return Y0 - IY * (W - Wmin) / (Wmax - Wmin);
}

 Tx(x) {

  return Tmax - (X0 - x) / IX * (Tmax - Tmin);
}

 Wy(y) {
  return Wmin + (Y0 - y) / IY * (Wmax - Wmin);
}


// Calcula un paso "redondo" (1, 2, 2.5, 5 x 10^n) para que el número de marcas
// del eje se mantenga razonable (~8) sea cual sea el rango visible tras el zoom
pasoEjes(rango, numTicksDeseado = 8) {
  if (!(rango > 0)) return 1;
  var pasoBruto = rango / numTicksDeseado;
  var exponente = Math.floor(Math.log10(pasoBruto));
  var base = Math.pow(10, exponente);
  var fraccion = pasoBruto / base;
  var pasoNormalizado;
  if (fraccion <= 1) pasoNormalizado = 1;
  else if (fraccion <= 2) pasoNormalizado = 2;
  else if (fraccion <= 5) pasoNormalizado = 5;
  else pasoNormalizado = 10;
  return pasoNormalizado * base;
}

// Nº de decimales necesarios para representar un paso de eje (2 -> 0, 0.5 -> 1, 0.02 -> 2...)
decimalesPaso(paso) {
  return Math.max(0, -Math.floor(Math.log10(paso) + 1e-9));
}

// Primer múltiplo del paso >= min (evita arrastrar los decimales del límite de zoom)
inicioEjes(min, paso) {
  return Math.ceil(min / paso) * paso;
}

// Redondea un valor de eje al nº de decimales del paso, evitando arrastres de coma flotante
redondeaPaso(valor, decimales) {
  return Number(valor.toFixed(decimales));
}

// Genera `numLineas` valores de HR (%) repartidos en "redondo" entre 0 y 100 (sin incluir
// los extremos, que ya se dibujan aparte: 100% siempre en trazo continuo)
generaValoresHR(numLineas) {
  if (!(numLineas > 0)) return [];
  var paso = this.pasoEjes(100, numLineas + 1);
  var valores = new Array();
  for (var hr = paso; hr < 100; hr += paso) valores.push(this.redondeaPaso(hr, this.decimalesPaso(paso)));
  return valores;
}

// Genera `numLineas` valores de TH (ºC) repartidos en "redondo" dentro del rango T visible
generaValoresTH(numLineas) {
  if (!(numLineas > 0)) return [];
  var paso = this.pasoEjes(Tmax - Tmin, numLineas + 1);
  var dec = this.decimalesPaso(paso);
  var valores = new Array();
  for (var th = this.inicioEjes(Tmin, paso); th < Tmax; th += paso) valores.push(this.redondeaPaso(th, dec));
  return valores;
}

 dibujaEjes() {
  const ctx=this.ctx;
  ctx.lineWidth = ejesAncho;
  ctx.strokeStyle = ejesColor;

  //Dibuja Eje X
  ctx.beginPath();
  ctx.moveTo(this.xT(Tmax), this.yW(Wmin));
  ctx.lineTo(this.xT(Tmin), this.yW(Wmin));
  ctx.stroke();

  //Dibuja Eje Y
  ctx.beginPath();
  ctx.moveTo(this.xT(Tmax), this.yW(Wmin));
  ctx.lineTo(this.xT(Tmax), this.yW(Wmax));
  ctx.stroke();

}

 dibujaT(T) {
  var ah = new AireHumedo();
  var curva = new Array();

  //Punto nº 1 en el HR=100%
  ah.setEstado('T', T, 'HR', 100);
  curva.push({
    T: T,
    W: ah.get('W')
  });

  //Punto nº 2 en el W=Wmin
  ah.setEstado('T', T, 'W', Wmin);
  curva.push({
    T: ah.get('T'),
    W: Wmin
  });
  this.dibujaCurva(curva);
}

 dibujaW(W) {
  var ah = new AireHumedo();
  var curva = new Array();

  //Punto nº 1 en el (Tmax,W)
  curva.push({
    T: Tmax,
    W: W
  });

  //Punto nº 2 en el 100% o corte Tmin
  ah.setEstado('T', Tmin, 'HR', 100);
  var Wmax = ah.get('W');
  if (W >= Wmax) {
    ah.setEstado('HR', 100, 'W', W);
    curva.push({
      T: ah.get('T'),
      W: W
    });
  } else {
    curva.push({
      T: Tmin,
      W: W
    });
  }


  this.dibujaCurva(curva);
}

 dibujaHR(HR, mostrarEtiqueta, fraccion) {
  var ah = new AireHumedo();
  var curva = new Array();

  for (var T = Tmin; T <= Tmax; T += 1) {
    ah.setEstado('T', T, 'HR', HR);
    var w1 = ah.get('W');
    curva.push({
      T: T,
      W: w1
    });
  }
  this.dibujaCurva(curva);

  if (mostrarEtiqueta) {
    // Las líneas de HR=cte son, en la práctica, versiones a escala de la misma curva base
    // (W = HR/100 · f(T), con una ligera no-linealidad): por eso su "mitad" geométrica (calculada
    // por longitud, por T o por W) cae siempre en el mismo punto para TODAS, aunque cada una sea
    // más corta o más larga — usar ese punto único haría que todas las etiquetas se amontonaran
    // en el centro del diagrama. Para que cada una quede sobre SU línea, sin pisarse, se reparten
    // en distintas posiciones (por longitud de arco) a lo largo de su propio trazo visible.
    var visibles = curva.filter(p => p.W >= Wmin && p.W <= Wmax);
    var punto = this.puntoEnCurva(visibles, fraccion);
    if (punto) this.etiquetaSobreCurva(HR + '%', punto.T, punto.W);
  }
}

// Punto situado a una fracción (0..1) de la longitud en pantalla de una curva — 0.5 es el
// centro geométrico real; otras fracciones sirven para repartir varias etiquetas sin que
// coincidan cuando las curvas son autosimilares (ver dibujaHR).
 puntoEnCurva(curva, fraccion) {
  if (!curva || curva.length === 0) return null;
  if (curva.length === 1) return curva[0];

  var pts = curva.map(p => ({ T: p.T, W: p.W, x: this.xT(p.T), y: this.yW(p.W) }));
  var acumulada = [0];
  for (var i = 1; i < pts.length; i++) {
    acumulada.push(acumulada[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  var objetivo = acumulada[acumulada.length - 1] * (fraccion == null ? 0.5 : fraccion);
  var idx = acumulada.findIndex(d => d >= objetivo);
  if (idx < 0) idx = pts.length - 1;
  return { T: pts[idx].T, W: pts[idx].W };
}


 dibujaTH(TH, mostrarEtiqueta) {
  var ah = new AireHumedo();
  var curva = new Array();

  //Punto nº 1 en el HR=100%
  ah.setEstado('T', TH, 'HR', 100);
  curva.push({
    T: TH,
    W: ah.get('W')
  });

  //Punto nº 2 en el W=Wmin
  ah.setEstado('TH', TH, 'W', Wmin);
  var Tcorte = ah.get('T');
  if (Tcorte <= Tmax) {
    curva.push({
      T: Tcorte,
      W: Wmin
    });
  } else {
    ah.setEstado('T', Tmax, 'TH', TH);
    curva.push({
      T: Tmax,
      W: ah.get('W')
    });
  }
  this.dibujaCurva(curva);

  if (mostrarEtiqueta) {
    // Etiqueta en la intersección con la curva de saturación (curva[0]), proyectada hacia
    // fuera del área del diagrama en la dirección de la propia línea de TH=cte.
    this.etiquetaExterior(curva[0].T, curva[0].W, curva[1].T, curva[1].W, TH + 'ºC');
  }
}

// Calcula el eje recto de entalpía: una línea recta (como un eje "girado" cualquiera del
// diagrama) paralela a la diagonal general de la curva de saturación, desplazada hacia fuera
// (arriba-izquierda) un margen fijo. Se calcula UNA vez por redibujado y todas las líneas de
// H=cte se prolongan hasta cruzarla — así sus marcas de graduación quedan todas paralelas entre
// sí (perpendiculares al eje), en vez de cada una con su propia dirección suelta.
 calculaEjeEntalpia() {
  var ah = new AireHumedo();
  ah.setEstado('T', Tmin, 'HR', 100);
  var pInicio = { x: this.xT(Tmin), y: this.yW(ah.get('W')) };
  ah.setEstado('T', Tmax, 'HR', 100);
  var pFin = { x: this.xT(Tmax), y: this.yW(ah.get('W')) };

  var dx = pFin.x - pInicio.x, dy = pFin.y - pInicio.y;
  var largo = Math.hypot(dx, dy) || 1;
  var dir = { x: dx / largo, y: dy / largo };

  var normal = { x: -dir.y, y: dir.x };
  if (normal.x > 0 || normal.y > 0) { normal.x = -normal.x; normal.y = -normal.y; } // hacia fuera (arriba-izquierda)

  var centro = { x: (pInicio.x + pFin.x) / 2, y: (pInicio.y + pFin.y) / 2 };
  // Deja hueco de sobra para las marcas, números y la leyenda antes del borde del lienzo
  var margen = Math.min(pL, pT) * 0.45;
  var anclaje = { x: centro.x + normal.x * margen, y: centro.y + normal.y * margen };

  return { anclaje: anclaje, dir: dir, normal: normal };
}

// Recorta un punto de la recta del eje de entalpía (anclaje + t·dir) para que, junto con la
// marca, el número y la leyenda que se dibujan a partir de él, quede siempre dentro del
// lienzo — calculando el rango de "t" (a lo largo del eje) que cabe en un rectángulo con el
// margen de seguridad necesario para ese texto, en vez de fiarlo a dónde caiga cada cruce real.
 recortaPuntoEje(eje, punto) {
  var margenSeguro = 42; // hueco para marca + número + leyenda, medido desde el borde del lienzo
  var xMin = margenSeguro, xMax = W - margenSeguro;
  var yMin = margenSeguro, yMax = H - margenSeguro;

  var t = (punto.x - eje.anclaje.x) * eje.dir.x + (punto.y - eje.anclaje.y) * eje.dir.y;

  var txMin = -Infinity, txMax = Infinity;
  if (Math.abs(eje.dir.x) > 1e-6) {
    var t1 = (xMin - eje.anclaje.x) / eje.dir.x, t2 = (xMax - eje.anclaje.x) / eje.dir.x;
    txMin = Math.min(t1, t2); txMax = Math.max(t1, t2);
  }
  var tyMin = -Infinity, tyMax = Infinity;
  if (Math.abs(eje.dir.y) > 1e-6) {
    var t3 = (yMin - eje.anclaje.y) / eje.dir.y, t4 = (yMax - eje.anclaje.y) / eje.dir.y;
    tyMin = Math.min(t3, t4); tyMax = Math.max(t3, t4);
  }
  var tSegMin = Math.max(txMin, tyMin), tSegMax = Math.min(txMax, tyMax);
  var tRecortado = Math.min(Math.max(t, tSegMin), tSegMax);

  return { x: eje.anclaje.x + eje.dir.x * tRecortado, y: eje.anclaje.y + eje.dir.y * tRecortado };
}

// Dibuja una línea de entalpía constante (H=cte): el tramo físico (por debajo de la curva de
// saturación, HR<=100%) con trazo normal, y su prolongación MÁS ALLÁ de la saturación —
// calculada con la misma fórmula real (no una aproximación por tangente) — hasta que cruza
// efectivamente el eje recto de entalpía. Devuelve el punto de cruce (ahí va la marca).
 dibujaH(H, decimales, eje) {
  var ah = new AireHumedo();
  var curva = new Array();

  for (var T = Tmin; T <= Tmax; T += 0.5) {
    ah.setEstado('T', T, 'H', H);
    var hr = ah.get('HR');
    if (hr >= 0 && hr <= 100) curva.push({ T: T, W: ah.get('W') });
  }
  if (curva.length < 2) return null;

  this.dibujaCurva(curva);

  // Prolonga la MISMA línea (fórmula real T,H, no tangente) hasta cruzar el eje: la distancia
  // con signo al eje (proyección sobre su normal) cambia de signo justo al cruzarlo
  var extension = [curva[0]];
  var T2 = curva[0].T;
  var cruce = null;
  for (var iter = 0; iter < 400; iter++) {
    T2 -= 0.25;
    ah.setEstado('T', T2, 'H', H);
    var p = { T: T2, W: ah.get('W') };
    extension.push(p);
    var px = this.xT(p.T), py = this.yW(p.W);
    var d = (px - eje.anclaje.x) * eje.normal.x + (py - eje.anclaje.y) * eje.normal.y;
    if (d >= 0) { cruce = { x: px, y: py }; break; }
  }
  if (!cruce) return null;
  cruce = this.recortaPuntoEje(eje, cruce); // nunca más allá del margen seguro del lienzo
  extension[extension.length - 1] = { T: this.Tx(cruce.x), W: this.Wy(cruce.y) }; // la prolongación dibujada termina justo ahí

  const ctx = this.ctx;
  ctx.save();
  ctx.lineWidth = 0.5;
  this.dibujaCurva(extension);
  ctx.restore();

  return { punto: cruce, texto: H.toFixed(decimales) };
}

// Dibuja el eje de entalpía en sí: la recta calculada por calculaEjeEntalpia(), con marcas de
// graduación (todas paralelas entre sí, perpendiculares al eje), sus etiquetas y la leyenda —
// como cualquier otro eje del diagrama, solo que girado.
 dibujaEscalaEntalpia(eje, marcas) {
  if (marcas.length === 0) return;
  const ctx = this.ctx;

  ctx.save();
  ctx.setLineDash([]);
  ctx.strokeStyle = configSicro.h.color;

  // El eje: una recta que une los puntos de cruce extremos, con un pequeño saliente a cada lado
  var primero = marcas[0].punto, ultimo = marcas[marcas.length - 1].punto;
  var saliente = 10;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(primero.x - eje.dir.x * saliente, primero.y - eje.dir.y * saliente);
  ctx.lineTo(ultimo.x + eje.dir.x * saliente, ultimo.y + eje.dir.y * saliente);
  ctx.stroke();

  // Marcas de graduación (paralelas entre sí, perpendiculares al eje) + números — mismo
  // tamaño de letra que el resto de etiquetas del diagrama (HR=cte, TH=cte)
  var marcaLargo = 4, etiquetaLargo = 11;
  ctx.fillStyle = configSicro.h.color;
  ctx.font = '9px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  marcas.forEach(m => {
    var p = m.punto;
    ctx.beginPath();
    ctx.moveTo(p.x - eje.normal.x * marcaLargo, p.y - eje.normal.y * marcaLargo);
    ctx.lineTo(p.x + eje.normal.x * marcaLargo, p.y + eje.normal.y * marcaLargo);
    ctx.stroke();
    ctx.fillText(m.texto, p.x + eje.normal.x * etiquetaLargo, p.y + eje.normal.y * etiquetaLargo);
  });

  // Leyenda del eje: por encima (más alejada aún) del último número, en la misma dirección
  // radial que las etiquetas — no continuando la recta del eje, sino "flotando" sobre él
  var angulo = Math.atan2(eje.dir.y, eje.dir.x);
  if (angulo > Math.PI / 2 || angulo < -Math.PI / 2) angulo += Math.PI; // texto nunca cabeza abajo
  ctx.translate(ultimo.x + eje.normal.x * (etiquetaLargo + 16), ultimo.y + eje.normal.y * (etiquetaLargo + 16));
  ctx.rotate(angulo);
  ctx.font = '9px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Entalpía [kJ/kg as]', 0, 0);

  ctx.restore();
}

// Etiqueta pequeña y discreta centrada sobre un punto de una curva, del mismo color que su
// trazo (usada para las líneas de HR=cte, cuya etiqueta va en medio de la propia curva).
 etiquetaSobreCurva(texto, T, W) {
  const ctx = this.ctx;
  ctx.save();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.font = '9px Arial';
  ctx.fillText(texto, this.xT(T), this.yW(W) - 3);
  ctx.restore();
}

// Marca + etiqueta "de escala": dado un punto (T0,W0) sobre la curva de saturación y un
// segundo punto (T1,W1) de la misma línea hacia el interior del diagrama, dibuja una pequeña
// marca perpendicular-ish que se proyecta hacia fuera del área (extrapolando la dirección de
// la línea) y el texto justo más allá — el estilo de "escala junto a la saturación" que usan
// las líneas de TH=cte y de entalpía.
 etiquetaExterior(T0, W0, T1, W1, texto) {
  var p0 = { x: this.xT(T0), y: this.yW(W0) };
  var p1 = { x: this.xT(T1), y: this.yW(W1) };
  var dx = p0.x - p1.x, dy = p0.y - p1.y;
  var largo = Math.hypot(dx, dy) || 1;
  dx /= largo; dy /= largo;

  const ctx = this.ctx;
  var tickLargo = 8, etiquetaLargo = 16;
  ctx.save();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p0.x + dx * tickLargo, p0.y + dy * tickLargo);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = ctx.strokeStyle;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '9px Arial';
  ctx.fillText(texto, p0.x + dx * etiquetaLargo, p0.y + dy * etiquetaLargo);
}

 dibujaCurva(curva) {
  const ctx=this.ctx;
  //Dibuja Eje Y
  ctx.beginPath();
  ctx.moveTo(this.xT(curva[0].T), this.yW(curva[0].W));
  for (var i = 1; i < curva.length; i++) ctx.lineTo(this.xT(curva[i].T), this.yW(curva[i].W));
  ctx.stroke();

}


 // Posición del cursor relativa al canvas, en píxeles
 canvasXY(evt) {
   const rect = this.canvas.getBoundingClientRect();
   return {
     x: evt.clientX - rect.left,
     y: evt.clientY - rect.top
   };
 }

 escribePosicion(evt) {
  var ah = new AireHumedo();

  //ESCRIBE LA POSICIÓN DEL CURSOR

  //Posición del cursor relativa al ViewPort
  var x_vp = Number(evt.clientX).toFixed(1);
  var y_vp = Number(evt.clientY).toFixed(1);

  //Posición del cursor relativa al Canvas
  //IMPORTANTE: SI EL CONTENEDOR DEL CANVAS NO TIENE PADDING=0 HABRÍA QUE DESCONTARLO AQUÍ TAMBIÉN
  var rect = evt.target.getBoundingClientRect();
  var x_canvas = Number(x_vp - rect.left).toFixed(1);
  var y_canvas = Number(y_vp - rect.top).toFixed(1);

  const ctx = this.ctx;

  if (muestraCursor) {
    ctx.fillStyle = 'white';
    ctx.fillRect(pL, pT, 300, 200);
    ctx.font = '18pt Arial';
    ctx.fillStyle = 'red';
    ctx.fillText('(' + x_canvas + ' , ' + y_canvas + ')', pL, pT + 20);
  }


  //ESCRIBE EL ESTADO DE AIRE HÚMEDO DE LA POSICIÓN DEL CURSOR
  if (muestraEstadoCursor) {
    var x1 = 30;
    var y1 = 30;

    var T = this.Tx(x_canvas);
    var W = this.Wy(y_canvas);
    ah.setEstado('T', T, 'W', W);
    var HR = ah.get('HR');
    var TR = ah.get('TR');
    var TH = ah.get('TH');
    var H = ah.get('H');


    //limpia cuadro
    ctx.fillStyle = "whitesmoke";
    ctx.fillRect(x1 - 5, y1 - 5, 160, 130);

    //dibuja marco
    ctx.strokeStyle = 'brown';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.strokeRect(x1 - 6, y1 - 6, 161, 131);



    if ((T >= Tmin) && (T <= Tmax) && (HR <= 100) && (HR > 0)) {
      var iy1 = 20;

      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = '14px Arial';
      ctx.fillStyle = 'brown';


      ctx.fillText('T:  ' + Number(T).toFixed(1) + ' [ºC]', x1, y1);
      y1 += iy1;
      ctx.fillText('HR: ' + Number(HR).toFixed(1) + ' [%]', x1, y1);
      y1 += iy1;
      ctx.fillText('W: ' + Number(W).toFixed(2) + ' [gr H2O/kg as]', x1, y1);
      y1 += iy1;
      ctx.fillText('TR: ' + Number(TR).toFixed(1) + ' [ºC]', x1, y1);
      y1 += iy1;
      ctx.fillText('TH: ' + Number(TH).toFixed(1) + ' [ºC]', x1, y1);
      y1 += iy1;
      ctx.fillText('H:  ' + Number(H).toFixed(2) + ' [kJ/kg as]', x1, y1);
      y1 += iy1;
    }
  }


}

// ----------------------------------------------------------
//  ZOOM POR SELECCIÓN: pulsar y arrastrar dibuja un rectángulo que,
//  al soltar, se convierte en los nuevos límites Tmin/Tmax/Wmin/Wmax
//  (ejes y grid se recalculan de cero). Clic derecho restaura el zoom inicial.
// ----------------------------------------------------------

 onMouseMove(evt) {
   if (this._isSelecting) {
     const p = this.canvasXY(evt);
     this._selCurX = p.x;
     this._selCurY = p.y;
     this.reDibuja();
     return;
   }
   this.escribePosicion(evt);
 }

 onMouseDown(evt) {
   if (evt.button !== 0) return; // solo botón izquierdo
   const p = this.canvasXY(evt);
   this._isSelecting = true;
   this._selStartX = p.x;
   this._selStartY = p.y;
   this._selCurX = p.x;
   this._selCurY = p.y;
 }

 onMouseUp(evt) {
   if (!this._isSelecting) return;
   this._isSelecting = false;

   const MIN_PX = 15; // por debajo de esto se considera un clic, no una selección
   const anchoPx = Math.abs(this._selCurX - this._selStartX);
   const altoPx = Math.abs(this._selCurY - this._selStartY);

   if (anchoPx >= MIN_PX && altoPx >= MIN_PX) {
     const T1 = this.Tx(this._selStartX);
     const T2 = this.Tx(this._selCurX);
     const W1 = this.Wy(this._selStartY);
     const W2 = this.Wy(this._selCurY);

     // Arrastrar de izquierda a derecha (sentido normal) = zoom in a la selección.
     // Arrastrar de derecha a izquierda (sentido contrario) = zoom out: el rectángulo
     // dibujado indica cuánto se "encoge" la vista actual, expandiéndola alrededor
     // del centro del rectángulo en la misma proporción.
     const esZoomOut = this._selCurX < this._selStartX;

     if (esZoomOut) {
       const centroT = (T1 + T2) / 2;
       const centroW = (W1 + W2) / 2;
       const factorT = W / anchoPx;
       const factorH = H / altoPx;

       const nuevoRangoT = (this.viewTmax - this.viewTmin) * factorT;
       const nuevoRangoW = (this.viewWmax - this.viewWmin) * factorH;

       // No superar los límites por defecto configurados para el diagrama
       this.viewTmin = Math.max(configSicro.ejes.t.min, centroT - nuevoRangoT / 2);
       this.viewTmax = Math.min(configSicro.ejes.t.max, centroT + nuevoRangoT / 2);
       this.viewWmin = Math.max(configSicro.ejes.w.min, centroW - nuevoRangoW / 2);
       this.viewWmax = Math.min(configSicro.ejes.w.max, centroW + nuevoRangoW / 2);
     } else {
       this.viewTmin = Math.min(T1, T2);
       this.viewTmax = Math.max(T1, T2);
       this.viewWmin = Math.min(W1, W2);
       this.viewWmax = Math.max(W1, W2);
     }
   }

   this.reDibuja(); // recalcula ejes/grid con los nuevos límites (o limpia el rectángulo si no hubo selección válida)
 }

 onMouseLeave(evt) {
   if (this._isSelecting) {
     this._isSelecting = false;
     this.reDibuja();
   }
 }

 // Restaura el zoom a los límites por defecto configurados (pestaña Diagrama del modal
 // de configuración). La usa tanto el clic derecho como el propio modal al cambiarlos.
 restablecerZoom() {
   this.viewTmin = configSicro.ejes.t.min;
   this.viewTmax = configSicro.ejes.t.max;
   this.viewWmin = configSicro.ejes.w.min;
   this.viewWmax = configSicro.ejes.w.max;
   this.reDibuja();
 }

 // Clic derecho: restaura el zoom a los límites por defecto
 onResetZoom(evt) {
   evt.preventDefault();
   this.restablecerZoom();
 }

 /**
  * Dibuja una forma geométrica clásica de gráfico en el canvas.
  * Compatibilidad: si iconName es un carácter Unicode legacy (≤2 chars) usa fillText.
  * @param {CanvasRenderingContext2D} ctx
  * @param {string} iconName  - clave de forma o carácter Unicode legacy
  * @param {number} x         - centro X
  * @param {number} y         - centro Y
  * @param {number} r         - radio / semitamaño en píxeles
  */
 drawIcon(ctx, iconName, x, y, r = 6) {

   // ── Compatibilidad con iconos Unicode legacy (▲, ◆, ●, etc.) ──────────
   if (iconName && iconName.length <= 2) {
     ctx.font = `${r * 2.2}px Arial`;
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
     ctx.fillText(iconName, x, y);
     return;
   }

   ctx.beginPath();

   switch (iconName) {

     // ── Círculo relleno ────────────────────────────────────────────────────
     case 'circle':
       ctx.arc(x, y, r, 0, Math.PI * 2);
       ctx.fill();
       break;

     // ── Círculo vacío (solo contorno) ──────────────────────────────────────
     case 'circle-open':
       ctx.arc(x, y, r, 0, Math.PI * 2);
       ctx.save();
       ctx.lineWidth = Math.max(1.5, r * 0.25);
       ctx.strokeStyle = ctx.fillStyle;
       ctx.stroke();
       ctx.restore();
       break;

     // ── Cuadrado ───────────────────────────────────────────────────────────
     case 'square':
       ctx.rect(x - r, y - r, r * 2, r * 2);
       ctx.fill();
       break;

     // ── Triángulo hacia arriba ─────────────────────────────────────────────
     case 'triangle-up': {
       ctx.moveTo(x,       y - r);
       ctx.lineTo(x + r,   y + r);
       ctx.lineTo(x - r,   y + r);
       ctx.closePath();
       ctx.fill();
       break;
     }

     // ── Triángulo hacia abajo ──────────────────────────────────────────────
     case 'triangle-down': {
       ctx.moveTo(x,       y + r);
       ctx.lineTo(x + r,   y - r);
       ctx.lineTo(x - r,   y - r);
       ctx.closePath();
       ctx.fill();
       break;
     }

     // ── Rombo ──────────────────────────────────────────────────────────────
     case 'diamond': {
       ctx.moveTo(x,       y - r * 1.4);
       ctx.lineTo(x + r,   y);
       ctx.lineTo(x,       y + r * 1.4);
       ctx.lineTo(x - r,   y);
       ctx.closePath();
       ctx.fill();
       break;
     }

     // ── Estrella de 5 puntas ───────────────────────────────────────────────
     case 'star': {
       const spikes = 5;
       const innerR = r * 0.42;
       let rot = -(Math.PI / 2);
       const step = Math.PI / spikes;
       ctx.moveTo(x + r * Math.cos(rot), y + r * Math.sin(rot));
       for (let i = 0; i < spikes; i++) {
         rot += step;
         ctx.lineTo(x + innerR * Math.cos(rot), y + innerR * Math.sin(rot));
         rot += step;
         ctx.lineTo(x + r * Math.cos(rot), y + r * Math.sin(rot));
       }
       ctx.closePath();
       ctx.fill();
       break;
     }

     // ── Cruz / Plus ────────────────────────────────────────────────────────
     case 'cross': {
       const t = r * 0.35;  // semiancho del brazo
       ctx.moveTo(x - t, y - r);
       ctx.lineTo(x + t, y - r);
       ctx.lineTo(x + t, y - t);
       ctx.lineTo(x + r, y - t);
       ctx.lineTo(x + r, y + t);
       ctx.lineTo(x + t, y + t);
       ctx.lineTo(x + t, y + r);
       ctx.lineTo(x - t, y + r);
       ctx.lineTo(x - t, y + t);
       ctx.lineTo(x - r, y + t);
       ctx.lineTo(x - r, y - t);
       ctx.lineTo(x - t, y - t);
       ctx.closePath();
       ctx.fill();
       break;
     }

     // ── Fallback: círculo ──────────────────────────────────────────────────
     default:
       ctx.arc(x, y, r, 0, Math.PI * 2);
       ctx.fill();
   }
 }

 dibujaEstado(estado) {

  const ah = estado.getAireHumedo();
  
  var x = this.xT(ah.get('T'));
  var y = this.yW(ah.get('W'));

  if (muestraEstados) {
    var ctx = this.ctx;
    ctx.setLineDash([]);
    ctx.fillStyle = estado.getColor();

    this.drawIcon(ctx, estado.getIcon(), x, y, 6);

    if (muestraLeyendaEstados) {
      ctx.fillStyle = estado.getColor();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = '12px Arial';
      ctx.fillText(estado.getName(), x, y - 14);
    }
  }

}


 addNuevoEstado(evt) {

  if (permitir_agregarEstados_Dblclick) {
    //Posición del cursor relativa al ViewPort
    var x_vp = Number(evt.clientX).toFixed(1);
    var y_vp = Number(evt.clientY).toFixed(1);

    //Posición del cursor relativa al Canvas
    //IMPORTANTE: SI EL CONTENEDOR DEL CANVAS NO TIENE PADDING=0 HABRÍA QUE DESCONTARLO AQUÍ TAMBIÉN
    var rect = evt.target.getBoundingClientRect();
    var x_canvas = Number(x_vp - rect.left).toFixed(1);
    var y_canvas = Number(y_vp - rect.top).toFixed(1);

    var nEstado=new EstadoAireHumedo();

    var ah2 = nEstado.getAireHumedo();
    ah2.setPresion(configSicro.presionAbsoluta);

    var _T=this.Tx(x_canvas);
    var _W=this.Wy(y_canvas);
     ah2.setEstado('T',_T , 'W',_W );

    if (this.existeAireHumedo(ah2)){
     var a=this.estados.addState(nEstado);
     this.reDibuja();
     this.onStateChange(nEstado.getAireHumedo()); // Pasar el AireHumedo, no el EstadoAireHumedo

    }
  }
}

 checkEstado(estado){
  var ok=false;
  var ah=estado.getAireHumedo();
  var _T=ah.get('T');
  var _HR=ah.get('HR');
  if( (_T>=Tmin) && (_T<=Tmax) && (_HR>=0) && (_HR<=100)) ok=true;
  return ok;
}

existeAireHumedo(ah){
  var ok=false;
  var _T=ah.get('T');
  var _HR=ah.get('HR');
  if( (_HR>=0) && (_HR<=100)) ok=true;
  return ok;
}

}
