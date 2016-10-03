// carrousel_vs3.js
//
// Copyright 2010 francky kleyneman
// See http://clba.nl/sitepoint/photo-carrousel_vs3.php
// Fading script inspired by: http://hungred.com/how-to/tutorial-how-does-image-fade-in-when-picture-loaded/ 
// Published under Creative Commons License "Attribution-Noncommercial-Share Alike 3.0 Unported"
// Toegestaan is: 
//      kopieren, verspreiden en doorgeven,
//      en bewerking naar eigen smaak; :-)
//      op voorwaarde van opnemen van deze bronvermelding in de broncode;
//      alleen voor niet-commercieel gebruik;
//      verspreiden van een bewerking kan alleen onder dezelfde voorwaarden.
// See: http://creativecommons.org/licenses/by-nc-sa/3.0/nl/ (voor NL tekst)
//  or: http://creativecommons.org/licenses/by-nc-sa/3.0/    (for EN text)

if (!setPause){ var setPause = 1; } // for safety

var pause = setPause*1000; // now in millisec
var carr = document.getElementById('carrousel');
var bgImg = carr.getElementsByTagName('img')[0];
carr.style.background = 'url('+bgImg.src+') no-repeat 23px 5px';

var carrLi = carr.getElementsByTagName('li');
for (var i = 0; i<carrLi.length; i++){
    carrLi[i].style.position = 'absolute'; /* IE! */
}

var actual = 0;
var fadeImg = carr.getElementsByTagName('img')[1];
var c;
var opacity;
var t = window.setTimeout('fadeIn()', pause*.95); // start

function carrousel(){
    fadeImg.style.display = 'none';
    if (actual < carr.getElementsByTagName('img').length-1){ 
        actual = actual+1; 
        fadeImg = carr.getElementsByTagName('img')[actual+1];
    }
    if (actual == carr.getElementsByTagName('img').length-1){ 
        fadeImg = carr.getElementsByTagName('img')[0];
        actual = -1;
    }
    fadeIn();
}

function setBrowser(opacity) {
    fadeImg.style.MSFilter = "progid:DXImageTransform.Microsoft.Alpha(Opacity="+opacity+")"; // IE8
    fadeImg.style.filter = "alpha(opacity:"+opacity+")"; // older IE/Win
    fadeImg.style.KHTMLOpacity = opacity/100;            // Safari<1.2, Konqueror
    fadeImg.style.MozOpacity = opacity/100;              // older Mozilla and Firefox
    fadeImg.style.opacity = opacity/100;                 // modern browsers
}

function fadeIn(opacity) {
    if ( !opacity ){  // no need to give a starting opacity value (i.e.: 0)
        opacity = 0;
    }
    if (opacity <= 50) {                                   // soft starting
        setBrowser(opacity);
        opacity += 1;
        clearTimeout(t);
        t = setTimeout("fadeIn("+opacity+")", 25);
    }
    if ( opacity > 50 && opacity <= 70) {                  // speeding up 
        setBrowser(opacity);
        opacity += 1;
        clearTimeout(t);
        t = setTimeout("fadeIn("+opacity+")", 15);
    }
    if ( opacity > 70 && opacity < 100) {                  // fast ending 
        setBrowser(opacity);
        opacity += 1;
        clearTimeout(t);
        t = setTimeout("fadeIn("+opacity+")", 5);
    }
    if (opacity == 100){
        carr.style.backgroundImage = 'url('+fadeImg.src+')';
        clearTimeout(c);
        c = setTimeout('carrousel()', pause);
    }
    fadeImg.style.display = "block";
}
