/**
 * @author Ismael Rodríguez Maestre (ismael.rodriguez@uca.es), Universidad de Cádiz
 * @version 1.0, Noviembre/2019
 * @description Clase para resolver procesos iterativos usando el método de Newton-Raphson
 * @description Basado en el código en java de Juan Fco. Coronel Toro
 */
export class NewtonRaphson {
    constructor(){
        this.x1=0.0;
        this.x2=0.0;
        this.f1=0.0;
        this.f2=0.0;
        this.toleranciaRel=1e-6;
        this.convergio=false;   
    }
    convergido(){return this.convergio;}
/*
    set this.x1(x){this._this.x1=x;} get this.x1(){return this._this.x1;}
    set this.x2(x){this._this.x2=x;} get this.x2(){return this._this.x2;}
    set this.f1(x){this._this.f1=x;} get this.f1(){return this._this.f1;}
    set this.f2(x){this._this.f2=x;} get this.f2(){return this._this.f2;}
    set toleranciaRel(x){this._toleranciaRel=x;} get toleranciaRel(){return this._toleranciaRel;}
    set this.convergio(x){this._this.convergio=x;} get this.convergio(){return this._this.convergio;}
*/ 
   /** Estimar y guardar nuevos valores */
    xEstimado(x0,f0,nIter) {
       
        var nuevaX = this.nuevoX(x0,f0,nIter);
        this.guardarValores(x0,f0,nIter); // Por si se sigue iterando
        return nuevaX;
    }

    /**
     * Método para estimar el siguiente valor de x
     * @param x0 (double) valor inicial de x
     * @param f0 (double) valor inicial de la función
     * @param nIter (int) número de iteraciones
     *
     */
    nuevoX(x0,f0,nIter) {
          
  	var xPerturb=0.02; // 2% JFC 4/10/2005
	var small=1e-14;
	// calculo de la tolerancia
	var xIterate=0;
	var tolerancia=0;
	var modo=0;
	// calcular la tolerancia
	if ( Math.abs(x0) < small)
            tolerancia = this.toleranciaRel*small;
	else
            tolerancia = this.toleranciaRel*Math.abs(x0);

	if ((Math.abs(x0-this.x1)<tolerancia && nIter>0) || f0==0.0) {
            // ya ha convergido
            this.convergio = true;
            return (x0);
	}

        // No ha convergido
        this.convergio = false;
	modo = nIter;

        while(true) {
            if (modo==0) { // perturbar ligeramente x
                if(Math.abs(x0)>small)
                    xIterate= x0 * (1.0+xPerturb);
                else
		xIterate=xPerturb;
            }
           else if(modo==1) {   // extrapolación lineal
                var pendiente=(this.f1-f0)/(this.x1-x0);
                if (pendiente==0) { // perturbar
			modo=0;
			continue;
                }
                else
                    xIterate=x0-f0/pendiente;
            }
            else {	// Extrapolacion cuadratica
		var coef=[];
		var check;
		var xLaOtra;
		// Si dos xi son iguales, cambiar a modo=1, extrapolacion lineal
		if(x0==this.x1) {
                    this.x1=this.x2;
                    this.f1=this.f2;
                    modo=1;
                    continue;
		}
		else if(x0==this.x2) {
                    modo=1;
                    continue;
		}
		// Determinar los coeficientes del ajuste cuadratico usando doble presicion
		coef[2]=((this.f2-f0)/(this.x2-x0)-(this.f1-f0)/(this.x1-x0))/(this.x2-this.x1);
		coef[1]=(this.f1-f0)/(this.x1-x0)-(this.x1+x0)*coef[2];
		coef[0]=f0-(coef[1]+coef[2]*x0)*x0;
		// Si los 3 puntos son colineales, interpolacion lineal
		if(Math.abs(coef[2])<1e-10) {
                    modo=1;
                    continue;
		}
		// chequeo de presicion, debido a los errores de redondeo
		if(Math.abs((coef[0]+(coef[1]+coef[2]*this.x1)*this.x1-this.f1)/this.f1)>1.e-4) {
			modo=1;
			continue;
		}
		// Chequear las raices imaginarias
		check=coef[1]*coef[1]-4*coef[0]*coef[2];
		if (check<0) { // raices imaginarias, interpolacion lineal
                    modo=1;
                    continue;
		}
		else if(check>0) { //raices reales,determinar la solucion mas cercana
			xIterate=(-coef[1]+Math.sqrt(check))/coef[2]/2.0;
			xLaOtra=-xIterate-coef[1]/coef[2];
			if (Math.abs(xIterate-x0)>Math.abs(xLaOtra-x0))
                            xIterate=xLaOtra;
		}
		else {// Raices iguales
                    xIterate=-coef[1]/coef[2]/2;
		}
            }

            
            // Devolver la nueva estimación
            return xIterate;
         }
              
    
      }
    
    /** Guardar valores para siguientes iteraciones */
     guardarValores( x0, f0, modo){
     if (modo<2) {
            this.x2=this.x1;
            this.f2=this.f1;
            this.x1=x0;
            this.f1=f0;
        }else {
            // Eliminar uno de los puntos previos basandonos en el signo y el valor de f(x)
            // Mantener al punto actual y eliminar uno de los anteriores
            if(this.f1*f0>0 && this.f2*f0>0) { // mismo signo
                if(Math.abs(this.f2)>Math.abs(this.f1)) {
                    this.x2=this.x1;
                    this.f2=this.f1;
                }
            } else { // diferente signo
                if(this.f2*f0>0) {
                    this.x2=this.x1;
                    this.f2=this.f1;
                }
            }
            this.x1=x0;
            this.f1=f0; 
        }  
    }

  static resuelve() {
    var nIterMax=1000;	
    var x = 0; // Valor inicial
    var i=0;
    var valorFuncion;
    var iteracion = new NewtonRaphson(); // proceso iterativ0
    var resultado; 
     for(i=0 ; i<nIterMax ; i++) {
       valorFuncion=(x*x*x-85);  
       x = iteracion.xEstimado(x,valorFuncion,i);
       if (iteracion.convergido()) break;
     }  
       if (iteracion.convergido()){
	resultado=x;
//	console.log("X = "+x+" convergió en "+i+" iteraciones");
       }else{
        resultado=-9999999;
//        console.log("El proceso iterativo no this.convergio");
       }
     
     return resultado; 
   }
  



}