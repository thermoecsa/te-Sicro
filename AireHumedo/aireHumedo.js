//-----------------------
/*
 * 
 *      PROPIEDADES DEL AIRE HÚMEDO                                        
 * 
 * 
FUENTE: 

    Substance AIRH2O implements air-water vapor mixture (psychrometric) properties using thermodynamic 
    data from the built-in AIR and STEAM property relations from Hyland and Wexler, 
    "Formulations for the Thermodynamic Properties of the Saturated Phases of H2O from 173.15 K to 473.15 K, 
    ASHRAE Transactions, Part 2A,Paper 2793 (RP-216), (1983).
*/



/**
 * @author Ismael Rodríguez Maestre (ismael.rodriguez@uca.es), Universidad de Cádiz
 * @version 1.0, Noviembre/2019
 * @description Clase para el cálculo de propiedades sicrométricas del aire
 * @description Basado en el código en java de Juan Fco. Coronel Toro
 */


import { NewtonRaphson } from '/AireHumedo/NewtonRaphson.js';

const REL_MM = 0.62198;
const CP=1050;         // J/kg*K
const NU=0.0000134;    // m2/s   
const Ru=8.314472 //m3*kPa(K*kmol)
const Maire=28.84;    //kg/kmol

export class AireHumedo {
  constructor(){
      this.presion = 101325;
            
      this.T = 25;     //ºC
      this.Hr=50;      //% 
      this.W = 9.882;  //gr H20/kg as 
      this.Tr=13.86;   //ºC
      this.Th=17.89;  //ºC
      this.H=50.27;   //kJ/kg as
      this.v=1.177;    //m3/kg as
      
      this.Pv=1584.6;       //mbar
      this.Pv_sat=3169.2;   //Pa
      this.W_sat;           //kJ/kg as
   }  
  
    get(V){
         
     if(V=='P') { return Number(this.presion)};
     if(V=='T') { return Number(this.T)};
     if(V=='HR'){ return Number(this.Hr)};
     if(V=='W') { return Number(this.W)};
     if(V=='TR') { return Number(this.Tr)};
     if(V=='TH') { return Number(this.Th)};
     if(V=='H') { return Number(this.H)};
     if(V=='V') { return Number(this.v)};
     if(V=='PV') { return Number(this.Pv)};
     if(V=='PVSAT') { return Number(this.Pv_sat)};
     if(V=='WSAT') { return Number(this.W_sat)};
           
    }  
    
    setPresion(Patm){
     this.presion=Patm;   
    }
  
    setEstado(tipoV1,V1,tipoV2,V2){
    var existeOpcion=false; 
      if( ((tipoV1=='T')&&(tipoV2=='HR'))){this.calculaEstado_T_HR(V1,V2);existeOpcion=true;}    
      if( ((tipoV1=='HR')&&(tipoV2=='T'))){this.calculaEstado_T_HR(V2,V1);existeOpcion=true;}

      if( ((tipoV1=='T')&&(tipoV2=='W'))){this.calculaEstado_T_W(V1,V2);existeOpcion=true;}
      if( ((tipoV1=='W')&&(tipoV2=='T'))){this.calculaEstado_T_W(V2,V1);existeOpcion=true;}

      if( ((tipoV1=='T')&&(tipoV2=='TR'))){this.calculaEstado_T_TR(V1,V2);existeOpcion=true;}
      if( ((tipoV1=='TR')&&(tipoV2=='T'))){this.calculaEstado_T_TR(V2,V1);existeOpcion=true;}

      if( ((tipoV1=='T')&&(tipoV2=='TH'))){this.calculaEstado_T_TH(V1,V2);existeOpcion=true;}
      if( ((tipoV1=='TH')&&(tipoV2=='T'))){this.calculaEstado_T_TH(V2,V1);existeOpcion=true;}

      if( ((tipoV1=='T')&&(tipoV2=='H'))){this.calculaEstado_T_H(V1,V2);existeOpcion=true;}
      if( ((tipoV1=='H')&&(tipoV2=='T'))){this.calculaEstado_T_H(V2,V1);existeOpcion=true;}
 
      if( ((tipoV1=='T')&&(tipoV2=='V'))){this.calculaEstado_T_V(V1,V2);existeOpcion=true;}
      if( ((tipoV1=='V')&&(tipoV2=='T'))){this.calculaEstado_T_V(V2,V1);existeOpcion=true;}

      if( ((tipoV1=='HR')&&(tipoV2=='W'))){this.calculaEstado_HR_W(V1,V2);existeOpcion=true;}
      if( ((tipoV1=='W')&&(tipoV2=='HR'))){this.calculaEstado_HR_W(V2,V1);existeOpcion=true;}
 
      if( ((tipoV1=='HR')&&(tipoV2=='TR'))){this.calculaEstado_HR_TR(V1,V2);existeOpcion=true;}
      if( ((tipoV1=='TR')&&(tipoV2=='HR'))){this.calculaEstado_HR_TR(V2,V1);existeOpcion=true;}

      if( ((tipoV1=='HR')&&(tipoV2=='TH'))){this.calculaEstado_HR_TH(V1,V2);existeOpcion=true;}
      if( ((tipoV1=='TH')&&(tipoV2=='HR'))){this.calculaEstado_HR_TH(V2,V1);existeOpcion=true;}
 
      if( ((tipoV1=='HR')&&(tipoV2=='H'))){this.calculaEstado_HR_H(V1,V2);existeOpcion=true;}
      if( ((tipoV1=='H')&&(tipoV2=='HR'))){this.calculaEstado_HR_H(V2,V1);existeOpcion=true;}
 
      if( ((tipoV1=='HR')&&(tipoV2=='V'))){this.calculaEstado_HR_V(V1,V2);existeOpcion=true;}
      if( ((tipoV1=='V')&&(tipoV2=='HR'))){this.calculaEstado_HR_V(V2,V1);existeOpcion=true;}
         
      if( ((tipoV1=='W')&&(tipoV2=='TR'))){existeOpcion=false;}
      if( ((tipoV1=='TR')&&(tipoV2=='W'))){existeOpcion=false;}

      if( ((tipoV1=='W')&&(tipoV2=='TH'))){this.calculaEstado_W_TH(V1,V2);existeOpcion=true;}
      if( ((tipoV1=='TH')&&(tipoV2=='W'))){this.calculaEstado_W_TH(V2,V1);existeOpcion=true;}

      if( ((tipoV1=='W')&&(tipoV2=='H'))){this.calculaEstado_W_H(V1,V2);existeOpcion=true;}
      if( ((tipoV1=='H')&&(tipoV2=='W'))){this.calculaEstado_W_H(V2,V1);existeOpcion=true;}

      if( ((tipoV1=='W')&&(tipoV2=='V'))){this.calculaEstado_W_V(V1,V2);existeOpcion=true;}
      if( ((tipoV1=='V')&&(tipoV2=='W'))){this.calculaEstado_W_V(V2,V1);existeOpcion=true;}

      if( ((tipoV1=='TR')&&(tipoV2=='TH'))){this.calculaEstado_TR_TH(V1,V2);existeOpcion=true;}
      if( ((tipoV1=='TH')&&(tipoV2=='TR'))){this.calculaEstado_TR_TH(V2,V1);existeOpcion=true;}

      if( ((tipoV1=='TR')&&(tipoV2=='H'))){this.calculaEstado_TR_H(V1,V2);existeOpcion=true;}
      if( ((tipoV1=='H')&&(tipoV2=='TR'))){this.calculaEstado_TR_H(V2,V1);existeOpcion=true;}

      if( ((tipoV1=='TR')&&(tipoV2=='V'))){this.calculaEstado_TR_V(V1,V2);existeOpcion=true;}
      if( ((tipoV1=='V')&&(tipoV2=='TR'))){this.calculaEstado_TR_V(V2,V1);existeOpcion=true;}

      if( ((tipoV1=='TH')&&(tipoV2=='H'))){existeOpcion=false;}
      if( ((tipoV1=='H')&&(tipoV2=='TH'))){existeOpcion=false;}

      if( ((tipoV1=='TH')&&(tipoV2=='V'))){this.calculaEstado_TH_V(V1,V2);existeOpcion=true;}
      if( ((tipoV1=='V')&&(tipoV2=='TH'))){this.calculaEstado_TH_V(V2,V1);existeOpcion=true;}

      if( ((tipoV1=='H')&&(tipoV2=='V'))){this.calculaEstado_H_V(V1,V2);existeOpcion=true;}
      if( ((tipoV1=='V')&&(tipoV2=='H'))){this.calculaEstado_H_V(V2,V1);existeOpcion=true;}

        return existeOpcion; 
    }
    
    calculaEstado_T_HR(T,HR){

     this.T=T;
     this.Hr=HR;

     this.Pv_sat = this.pSatVap(T);
     this.Pv = HR/100*this.pSatVap(T);
     this.W_sat =this.humedadAbsoluta(this.Pv_sat);
     this.W= this.humedadAbsoluta(this.Pv);  
             
     this.Tr=this.Tsat(this.Pv);
     this.Th=this.TemperaturaHumeda(T,this.W);
     this.H=this.entalpia(this.T,this.W);
     
     this.v=1000*(Ru/Maire)*(T+273.15)/(this.presion-this.Pv);
           
    }
    
    calculaEstado_T_W(T,W){
     this.T=T;
     this.W=W;

     this.Pv_sat = this.pSatVap(T);
     this.Pv = (W/1000)/((W/1000)+REL_MM)*this.presion;
     this.Hr=this.Pv/this.Pv_sat*100; 

     this.calculaEstado_T_HR(this.T,this.Hr);
    }
   
     calculaEstado_T_TR(T,TR){

     this.T=T;
     this.Tr=TR;

     this.Pv_sat = this.pSatVap(TR);
     this.W= this.humedadAbsoluta(this.Pv_sat);  
     
     this.calculaEstado_T_W(T,this.W);
            
    }
    
    
    calculaEstado_T_TH(T,TH){

     this.T=T;
     this.Th=TH;

     var Pv_ = this.pSatVap(TH);  //Pv(TH)=Pv_sat(TH)
     var W_= this.humedadAbsoluta(Pv_); 
     
     this.H=this.entalpia(TH,W_);
     this.W=(this.H-1.006*T)*1000/(2500+1.805*T);
     
     this.calculaEstado_T_W(T,this.W);
            
    }
    
    calculaEstado_T_H(T,H){

     this.T=T;
     this.H=H;
     this.W=(this.H-1.006*T)*1000/(2500+1.805*T);
     
     this.calculaEstado_T_W(T,this.W);
            
    }

   calculaEstado_T_V(T,V){

     this.T=T;
     this.v=V;
     if(V>0){
         
      this.Pv=this.presion-(1000*(Ru/Maire)*(T+273.15))/this.v;
      this.W=this.HumedadAbsoluta(this.Pv);
     
      this.calculaEstado_T_W(T,this.W);
     }          
    }
    
    calculaEstado_HR_W(HR,W){
      var nIterMax=50;
      var i;

      this.Hr=HR;
      this.W=W;
      
          //Busqueda de la temperatura que con HR=100% que tiene la misma entalpía que el estado de entrada (T,W)
        var iteracion = new NewtonRaphson(); // proceso iterativo
        
        this.T=25; //estimación inicial  
        //iteracion.setToleranciaRel(1e-3);
	for(i=0 ; i<nIterMax ; i++) {
           this.Pv_sat = this.pSatVap(this.T);
           this.Pv = HR/100*this.pSatVap(this.T);
           var W_= this.humedadAbsoluta(this.Pv);  
            this.T = iteracion.xEstimado(this.T,W-W_,i);
            if (iteracion.convergido())
		break;
           }
	if(!iteracion.convergido())
	{
            // De momento casca
        //    assert (false);
            // sal.error(Salida.FIN_PROCESO_ITERATIVO,"CorrienteAire.tBulboHumedo(t,w)");
	}
  
       this.calculaEstado_T_HR(this.T,this.Hr);
             
    }
    
     calculaEstado_HR_TR(HR,TR){

     this.Hr=HR;
     this.Tr=TR;

       this.Pv_sat = this.pSatVap(TR);
       this.W= this.humedadAbsoluta(this.Pv_sat);  
       this.Pv=HR/100*this.Pv_sat;         
       
       this.calculaEstado_HR_W(HR,this.W)
    }

    calculaEstado_HR_TH(HR,TH){

     this.Hr=HR;
     this.Th=TH;

       var Pv_sat_ = this.pSatVap(TH);
       var W_= this.humedadAbsoluta(Pv_sat_);  
       this.H=this.entalpia(TH,W_);
       
       this.T=(this.H-2500*this.W/1000)/(1.805*this.W/1000+1.006);
       
       this.calculaEstado_T_HR(this.T,this.H); 
        
    }
    
    calculaEstado_HR_H(HR,H){
     var i;
     var nIterMax=300;
     this.Hr=HR;
     this.H=H;

       //Busqueda de la temperatura que con HR tiene la entalpía H
       var iteracion = new NewtonRaphson(); // proceso iterativo
   
       this.T=25; //estimación inicial  
        //iteracion.setToleranciaRel(1e-3);
	for(i=0 ; i<nIterMax ; i++) {
           this.Pv_sat = this.pSatVap(this.T);
           this.Pv = HR/100*this.pSatVap(this.T);
           this.W=this.humedadAbsoluta(this.Pv);
           var H_= this.entalpia(this.T,this.W);  
            this.T = iteracion.xEstimado(this.T,this.H-H_,i);
            if (iteracion.convergido())
		break;
           }
	if(!iteracion.convergido())
	{
            // De momento casca
        //    assert (false);
            // sal.error(Salida.FIN_PROCESO_ITERATIVO,"CorrienteAire.tBulboHumedo(t,w)");
	}
  
       this.calculaEstado_T_HR(this.T,this.Hr);
    
              
    }

  calculaEstado_HR_V(HR,V){
 
     this.Hr=HR;
     this.V=V;

   //Busqueda de la temperatura que con HR tiene la entalpía H
       var iteracion = new NewtonRaphson(); // proceso iterativo
   
       this.T=25; //estimación inicial  
        //iteracion.setToleranciaRel(1e-3);
	for(i=0 ; i<nIterMax ; i++) {
           this.Pv_sat = this.pSatVap(this.T);
           this.Pv = HR/100*this.pSatVap(this.T);
           this.W=this.humedadAbsoluta(this.Pv);
           var H_= this.entalpia(this.T,this.W);  
            this.T = iteracion.xEstimado(this.T,this.H-H_,i);
            if (iteracion.convergido())
		break;
           }
	if(!iteracion.convergido())
	{
            // De momento casca
        //    assert (false);
            // sal.error(Salida.FIN_PROCESO_ITERATIVO,"CorrienteAire.tBulboHumedo(t,w)");
	}
  
       this.calculaEstado_T_HR(this.T,this.Hr);

    
  }

 
  calculaEstado_W_TH(W,TH){
     this.W=W;
     this.Th=TH;
 
     var i;
     var nIterMax=300;
  
     var Pv_sat_ = this.pSatVap(this.Th);
     var W_=this.humedadAbsoluta(Pv_sat_);
     this.H=this.entalpia(TH,W_);   
 //Busqueda de la temperatura que con igual entalpía
       var iteracion = new NewtonRaphson(); // proceso iterativo  
       this.T=25; //estimación inicial  
        //iteracion.setToleranciaRel(1e-3);
	for(i=0 ; i<nIterMax ; i++) {
            var H_= this.entalpia(this.T,this.W);  
            this.T = iteracion.xEstimado(this.T,this.H-H_,i);
            if (iteracion.convergido())
		break;
           }
	if(!iteracion.convergido())
	{
            // De momento casca
        //    assert (false);
            // sal.error(Salida.FIN_PROCESO_ITERATIVO,"CorrienteAire.tBulboHumedo(t,w)");
	}
  
       this.calculaEstado_T_W(this.T,this.W);
              
    }

 calculaEstado_W_H(W,H){

     this.W=W;
     this.H=H;

   var i;
     var nIterMax=300;
  
 //Busqueda de la temperatura que con igual entalpía
       var iteracion = new NewtonRaphson(); // proceso iterativo  
       this.T=25; //estimación inicial  
        //iteracion.setToleranciaRel(1e-3);
       for(i=0 ; i<nIterMax ; i++) {
         var H_=this.entalpia(this.T,this.W);   
         this.T = iteracion.xEstimado(this.T,this.H-H_,i);
         if (iteracion.convergido())
        	break;
         }
	if(!iteracion.convergido())
	{
            // De momento casca
        //    assert (false);
            // sal.error(Salida.FIN_PROCESO_ITERATIVO,"CorrienteAire.tBulboHumedo(t,w)");
	}
  
       this.calculaEstado_T_W(this.T,this.W);
           
        
  }

 calculaEstado_W_V(W,V){

     this.W=W;
     this.V=V;

              
  }

calculaEstado_TR_TH(TR,TH){
     this.Tr=TR;
     this.Th=TH;

     var Pv_sat_ = this.pSatVap(this.Tr);
     this.W=this.humedadAbsoluta(Pv_sat_);
     this.calculaEstado_W_TH(this.W,TH);
              
  }

calculaEstado_TR_H(TR,H){

     this.TR=TR;
     this.H=H;
 
     var Pv_sat_ = this.pSatVap(this.Tr);
     this.W=this.humedadAbsoluta(Pv_sat_);

     this.calculaEstado_W_H(this.W,H);         
  }
  
 calculaEstado_TR_V(TR,V){

     this.TR=TR;
     this.V=V; 
     
  } 
  
 

  calculaEstado_TH_V(TH,V){

     this.TH=TH;
     this.V=V; 
     
  } 
  
   calculaEstado_H_V(H,V){

     this.H=H;
     this.V=V; 
     
  } 


   //---------------------------------------------------------------------------------------------------------- 
   //------------------------------    FUNCIONES GENÉRICAS                ------------------------------------- 
   //---------------------------------------------------------------------------------------------------------- 
    
   /**
     * Método que calcula la presion de saturacion para una temperatura.
     * Ashrae fundamentals, 1997. Hyland-Wexler.
     * @param T2 (float) Temperatura en ºC, valido para -100ºC < t < 200ºC
     * @return (float) Presión de saturación en Pa
     */
    pSatVap(T2){
        var presion=0;
	var c=[-5800.2206,1.3914993,-4.8640239e-2,4.1764768e-5,-1.4452093e-8,6.5459673];
	var d=[-5674.5359,6.3925247,-0.9677843e-2,0.62215701e-6,0.20747825e-8,-0.9484024e-12,4.1635019];
        
          // Chequear rango de temperaturas [-100,200]
       // t = chequearRango(t,-100f,200f,"CorrienteAire.pSatVap(t)");
        var T=T2+ 273.15;   // pasar a temperatura absoluta
	if (T< 273.15)
	{
		presion = Math.exp(d[0]/T + d[1] + d[2]*T + d[3]*Math.pow(T,2) + d[4]*Math.pow(T,3)+d[5]*Math.pow(T,4) + d[6]*Math.log(T));
	}
	else
	{
		presion =  Math.exp( c[0]/T + c[1] + c[2]*T + c[3]*Math.pow(T,2)+ c[4]*Math.pow(T,3) + c[5]*Math.log(T));
	}
 	return presion;
        
        
    }
       /**
     * Método que calcula la temperatura de saturacion para una presión.
     * Utilizando un proceso iterativo sobre pSatVap
     * @param P (float) Presión en Pa
     * @return (float) Temperatura en ºC
     */
    Tsat(P){
        let nIterMax=50;
	let i=0;
	let tSat = 100; // Valor inicial
        let pSat=0;
	let iteracion = new NewtonRaphson(); // proceso iterativo
 
        for(i=0;i<nIterMax;i++){
            pSat = this.pSatVap(tSat);
            tSat = iteracion.xEstimado(tSat,P-pSat,i);
            if(iteracion.convergido())i=i+1;// break;
	}

        return tSat;
    
   }
    /**
     * Método que calcula la temperatura de Bulbo húmedo.
     * @param t (float) Temperatura seca (ºC)
     * @param w (float) Humedad absoluta (kg H2O/kg a.s.)
     * @return (float) Temperatura de Bulbo húmedo en ºC
     */
    TemperaturaHumeda(T,W) {
        var nIterMax=50;
	var i;

        // Estimacion inicial de la temperatura humeda
        var TH=T; 
    	if (T >= 99.9)
		TH =99.9;
	else if ( TH < 0 )TH = 0;


        var H=this.entalpia(T,W);
        
        //Busqueda de la temperatura que con HR=100% que tiene la misma entalpía que el estado de entrada (T,W)
        var iteracion = new NewtonRaphson(); // proceso iterativo
        //iteracion.setToleranciaRel(1e-3);
	for(i=0 ; i<nIterMax ; i++) {
            var Psat = this.pSatVap(TH);
            var Wsat = this.humedadAbsoluta(Psat);
            var nuevaH =this.entalpia(TH,Wsat);
            TH = iteracion.xEstimado(TH,H-nuevaH,i);
            if (iteracion.convergido())
		break;
           }
	if(!iteracion.convergido())
	{
            // De momento casca
        //    assert (false);
            // sal.error(Salida.FIN_PROCESO_ITERATIVO,"CorrienteAire.tBulboHumedo(t,w)");
	}
        // Por problemas de convergencia th > t
        if(TH > T) TH = T;
        
	return TH;
     }
    entalpia(T,W){return (2500+1.805*T)*W/1000+1.006*T;}
    humedadAbsoluta(Pv){return 1000*(REL_MM *Pv)/(this.presion-Pv);}


   static ckeck(){
     var ah=new AireHumedo();
     var P=ah.pSatVap(32);
     return ah.Tsat(P);   
   } 
}



    