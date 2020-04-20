// ==UserScript==
// @name         Roulette
// @namespace    http://tampermonkey.net/
// @version      0.1.6
// @description  Highlight series on roulette
// @author       Tokami
// @include      https://livecasino.oddsextra.com/*
// @downloadURL  https://raw.githubusercontent.com/T0kami/roulette/master/script.js
// @updateURL    https://raw.githubusercontent.com/T0kami/roulette/master/script.js
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM.getValue
// @grant        GM.setValue
// @run-at       document-end
// @resource html      https://raw.githubusercontent.com/T0kami/roulette/master/roulette.html
// @resource style     https://raw.githubusercontent.com/T0kami/roulette/master/roulette.css

// ==/UserScript==

(function() {
    'use strict';

    class Roulette {
        constructor(container) {
            this.numbers = [];
            this.container = container;
        }

        addNumber(value, color){
            this.numbers.push({value: value, color: color});
        }

        checkColorSerie(color, amount, superAmount, ignoreZero){
            let numbers = this.numbers;
            if(ignoreZero && numbers){
                for(let i = 0; i < numbers.length; i++){
                    if(numbers[i].value == 0 && numbers[i+1]) numbers[i].color = numbers[i+1].color;
                    if(numbers[i].value == 0 && !numbers[i+1]) numbers[i].color = numbers[i-1].color;
                }
            }

            if(numbers && superAmount <= numbers.length){
                let count = 1;
                for(let i = 0; i < superAmount; i++){
                    if((color === "all") && (numbers[i].color == numbers[i+1].color)) count += 1;
                    else if((numbers[i].color == color) && (numbers[i+1].color == color)) count += 1;
                    else break;
                }
                if(count >= superAmount) return "super";
                if(count >= amount) return true;
            }
            return false;
        }

        updateContainerStyle(isSerie, color){
           isSerie ? this.container.firstChild.style.border = "10px solid " + color : this.container.firstChild.style.border = "none";
        }

        switchToTop(){
            let parent = this.container.parentNode;
            let container = this.container
            parent.removeChild(this.container);
            parent.appendChild(container);
        }

        checkColor(classList){
            if (classList.includes("red")) return "red";
            else if (classList.includes("black")) return "black";
            else if (classList.includes("green")) return "green";
        }
    }

    function getRoulettes(){
        let numberContainers = document.querySelectorAll("[class^=recentNumbersContainer]");
        let roulettes = [];

        for(let container of numberContainers){

            let roulette = new Roulette(container.closest(".lobby-table-block"));
            let numbers = container.querySelectorAll("[class^=game-result]");

            for (let number of numbers){
                let color = roulette.checkColor(number.classList.value);
                let value = number.innerHTML;
                roulette.addNumber(value, color);
            }
            roulettes.push(roulette);
        }
        return roulettes;
    }

    function updateRoulettes(roulettes){
        for(let roulette of roulettes){
            (async ()=>{
                let minSerie = await GM.getValue("minSerie");
                let superSerie = await GM.getValue("superSerie");
                let isSerie = roulette.checkColorSerie("all", minSerie, superSerie, true);
                isSerie == "super" ? roulette.updateContainerStyle(isSerie, "red") : roulette.updateContainerStyle(isSerie, "blue");
            })();

        }
    }

    function initOptions(){
        var modal = document.getElementById("options-modal");
        var btn = document.getElementById("options-btn");
        var span = document.getElementsByClassName("close")[0];

        //Options inputs
        var minInput = document.getElementById("min-serie");
        var superInput = document.getElementById("super-serie");

        (async ()=>{
            minInput.value = await GM.getValue("minSerie", 6);
            superInput.value = await GM.getValue("superSerie", 9);
        })();

        btn.onclick = function() {
            modal.style.display = "block";
        }
        span.onclick = function() {
            modal.style.display = "none";
        }
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }

        for (const button of document.querySelectorAll("[name^=plus-button]")) {
            button.addEventListener('click', increaseValue);
        }
        for (const button of document.querySelectorAll("[name^=minus-button]")) {
            button.addEventListener('click', decreaseValue);
        }
        //Events for inputs
        minInput.addEventListener('change', (e) => {
            GM.setValue("minSerie", parseInt(e.target.value));
        });
        superInput.addEventListener('change', (e) => {
            GM.setValue("superSerie", parseInt(e.target.value));
        });
    }

    function increaseValue(e) {
        let value = parseInt(document.getElementById(e.previousSibling).value, 10);
        value = value > 9 ? 9 : value;
        value++;
        document.getElementById(e.previousSibling).value = value;
    }

    function decreaseValue(e) {
        let value = parseInt(document.getElementById(e.nextSibling).value, 10);
        value = value < 3 ? 3 : value;
        value--;
        document.getElementById(e.nextSibling).value = value;
    }

    function main(){

        //Inject options style and html
        GM_addStyle(GM_getResourceText("style"));
        document.body.insertAdjacentHTML('beforeend', GM_getResourceText("html"));
        initOptions();

        setInterval(function() {
            let roulettes = getRoulettes();
            if(roulettes){
                updateRoulettes(roulettes);
            }
        }, 3000);
    }

    window.addEventListener('load', function(){
        main();
    });

})();
