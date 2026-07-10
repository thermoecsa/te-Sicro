// /AireHumedo/estadoAireHumedo.js

import { AireHumedo } from './aireHumedo.js';

export class EstadoAireHumedo {
    constructor() {
        this.name = 'E' + (Math.random() * 100).toFixed(0);  // Nombre único por defecto

        this.temperature = 25;  // Temperatura predeterminada
        this.humidity = 50;     // Humedad predeterminada
        this.aireHumedo = new AireHumedo(); // Instancia de AireHumedo

        this.color = this.getRandomColor(); // Color aleatorio
        this.visible = true;  // Por defecto, el estado es visible
        this.icon = this.getRandomIcon();  // Icono aleatorio

        //Para el diagrama (REVISAR)
        this.label = this.name ;
        this.colorBorde = "black";
        this.size = 5; //diámetro del punto
        
    }

    getName() { return this.name; }
    setName(name) { 
        this.name = name; 
        this.label = name;
    }
     
    getVisible() { return this.visible; }
    setVisible(visible) { this.visible = visible; }

    getColor(){return this.color;}
    setColor(color){this.color=color;}

    getIcon(){return this.icon;}    
    setIcon(icon){this.icon=icon;}



    getAireHumedo(){return this.aireHumedo;}


    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }


    getRandomIcon() {
        const icons = ['circle', 'square', 'triangle-up', 'triangle-down', 'diamond', 'star', 'cross', 'circle-open'];
        return icons[Math.floor(Math.random() * icons.length)];
    }
}
