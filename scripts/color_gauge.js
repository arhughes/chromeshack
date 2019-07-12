
settingsLoadedEvent.addHandler(() => {
    if (objContains("color_gauges", getSetting("enabled_scripts"))) {
        var guages = document.querySelectorAll('.progress');
        
        for(var i=0;i<guages.length;i++){
            var gauge = guages[i];
            var val = Number(gauge.style.width.substr(0,gauge.style.width.length-1)); //remove percent (%)
            if(val > 99.9){ //about 1 minute left or less
                gauge.classList.add('gauge_dead');
            }else if(val > 88.8){ //about 2 hours left
                gauge.classList.add('gauge_red');
            }else if(val > 77.7){//about 4 hours left
                gauge.classList.add('gauge_orange');
            }else if(val > 66.6){//about 6 hours left
                gauge.classList.add('gauge_yellow');
            }else if(val > 55.5){//about 8 hours left
                gauge.classList.add('gauge_lime');
            }else if(val < 11.1){//up to about 2 hours old
                gauge.classList.add('gauge_blue');
            }else if(val < 22.2){//up to about 4 hours old
                gauge.classList.add('gauge_cyan');
            }else{
                gauge.classList.add('gauge_green');
            }
            
            var origval = val;
            val *= 18/100;
            val = 18 - val;
            var hour = Math.floor(val);
            val -= hour;
            var minutes = Math.floor(val * 60);
            
            var text = "";
            if(hour > 1 ){
                if(minutes > 1 || minutes ==0) {
                    text = `About ${hour} hours and ${minutes} minutes remaining`;
                } else {
                    text = `About ${hour} hours and 1 minute remaining`;
                }
            }else if( hour == 1){
                if(minutes > 1 || minutes ==0) {
                    text = `About 1 hour and ${minutes} minutes remaining`;
                } else {
                    text = `About 1 hour and 1 minute remaining`;
                }
            }else{
                if(minutes > 1 ) {
                    text = `About ${minutes} minutes remaining`;
                } else if (minutes == 0) {
                    text = `Thread Expired!`;
                } else {
                    text = `About 1 minute remaining`;
                }
            }
            gauge.parentNode.setAttribute('title',text); 

        }
    }
});
