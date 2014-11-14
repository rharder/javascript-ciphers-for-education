


var ShiftCipher = {
    
    ALPHABET_LOWER : ['a','b','c','d','e','f','g','h','i','j','k','l','m',
                          'n','o','p','q','r','s','t','u','v','w','x','y','z'],
    
    ALPHABET_UPPER : ['A','B','C','D','E','F','G','H','I','J','K','L','M',
                          'N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],

    // http://www.cryptograms.org/letter-frequencies.php
    ENGLISH_FREQUENCIES : [0.08167, 0.01492, 0.02782, 0.04253, 0.12702, 0.02228,
                           0.02015, 0.06094, 0.06966, 0.00153, 0.00772, 0.04025,
                           0.02406, 0.06749, 0.07507, 0.01929, 0.00095, 0.05987,
                           0.06327, 0.09056, 0.02758, 0.00978, 0.02360, 0.00150,
                           0.01974, 0.00074],
    ARRAY_ONE : [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ARRAY_ZEROES : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],


    _freqChart : null,
    _dotChart : null,
    _cipherText : "",
    _originalShift : 0, // 0=A
    _paddedFrequencies : null,
    _plainText : "",
    _step : 1,
    _stepStart : 0,
    _plainTextCache : null,
    _listeners : null,
    _suspendUpdates : false,
    _toUpdate : null,
    
    // HTML elements
    _container : null,
    _shiftDiv : null,
    _controlsDiv : null,
        _controlsTitleDiv : null,
        _shiftAlphaInput : null,
        _shiftNumInput : null,
        _sliderDiv : null,
        _guessBtn : null,
    _freqDiv : null,
    _dotDiv : null,
    
    /**
     * Initializes a shift cipher HTML element, loading
     * the controls, charts, etc and interconnecting them.
     * 
     * @param {type} domID
     * @returns {undefined}
     */
    init : function( domID ){
  /*<div class="shift">
    <div class="controls" >
        <div>Original Shift</div>
        <input type="text" id="sc_shiftAlpha" style="width:2em; text-align:center; font-size: larger" value="A" />
        <input type="text" id="sc_shiftNum" style="width:2em; text-align:center; font-size: larger" value="0" />
        <div id="sc_slider" class="slider" >&nbsp;</div>
        <input type="button" value="Guess" onclick="shiftCipher.guess();" />
    </div>
    <div id="sc_freqChart" class="freqChart chart" ></div>
    <div id="sc_dotChart" class="dotChart chart" ></div>
  </div> */        
        
        this._toUpdate = {};
        this._plainTextCache = {};
        this._listeners = {};
        
        var This = this;
        This._container = document.getElementById( domID );
            This._shiftDiv = document.createElement('div');
                This._controlsDiv = document.createElement('div');
                This._freqDiv = document.createElement('div');
                This._dotDiv  = document.createElement('div');
        This._container.appendChild(This._shiftDiv);
            This._shiftDiv.appendChild(This._controlsDiv);
            This._shiftDiv.appendChild(This._freqDiv);
            This._shiftDiv.appendChild(This._dotDiv);
            
        // Out shift div
        This._shiftDiv.setAttribute('class', 'shift');
        
        // Controls
        This._controlsDiv.setAttribute('class', 'controls');
        This._controlsTitleDiv= document.createElement('div');
        This._shiftAlphaInput = document.createElement('input');
        This._shiftNumInput   = document.createElement('input');
        This._sliderDiv       = document.createElement('div');
        This._guessBtn        = document.createElement('input');
        This._controlsDiv.appendChild( This._controlsTitleDiv );
        This._controlsDiv.appendChild( This._shiftAlphaInput );
        This._controlsDiv.appendChild( This._shiftNumInput );
        This._controlsDiv.appendChild( This._sliderDiv );
        This._controlsDiv.appendChild( This._guessBtn );
            
            This._controlsTitleDiv.innerHTML = "Original Shift";
        
            // Shift: Alpha
            var shiftAlphaId = 'shiftAlpha_' + this.generateUUID();
            This._shiftAlphaInput.setAttribute('type', 'text');
            This._shiftAlphaInput.setAttribute('class', 'shiftAlpha');
            This._shiftAlphaInput.setAttribute('id', shiftAlphaId);
            $(This._shiftAlphaInput).on('input propertychange paste',function(){
                var c = $(this).val().charCodeAt(0);
                if( c >= 65 && c <= 90 ){
                    This.originalShift = c - 65;
                } else if( c >= 97 && c <= 122 ){
                    This.originalShift = c - 97;
                } else {
                    This.originalShift = 0;0
                }
            });
            This._shiftAlphaInput.setAttribute('value', String.fromCharCode( This.originalShift+65 ) );
            
            // Shift: Numeric
            var shiftNumId = 'shiftNum_' + this.generateUUID();
            This._shiftNumInput.setAttribute('type', 'text');
            This._shiftNumInput.setAttribute('class', 'shiftNum');
            This._shiftNumInput.setAttribute('id', shiftNumId);
            $(This._shiftNumInput).on('input propertychange paste',function(){
                var s = parseInt( $(this).val() );
                This.originalShift = isNaN(s) ? 0 : Math.abs(s % 26);
            });
            This._shiftNumInput.setAttribute('value', This.originalShift );
            
            // Shift: Slider
            var sliderId = 'shiftSlider_' + this.generateUUID();
            This._sliderDiv.setAttribute('class', 'slider');
            This._sliderDiv.setAttribute('id', sliderId);
            $( This._sliderDiv ).slider({
                value: 0, min: 0, max: 25, step: 1,
                slide: function( event, ui ) {
                    This.originalShift = ui.value ;
                }
              });
              
              // Guess
              var guessId = 'guess_' + this.generateUUID();
              This._guessBtn.setAttribute('type', 'button');
              This._guessBtn.setAttribute('value', 'Max Dot Product');
              $( This._guessBtn ).on('click',function(){
                  This.guess();
              });

            // 
            this.addEventListener('originalShiftChanged',function(src){
                $.Deferred(function(){
                    var shift = src.originalShift;
                    $( This._shiftNumInput ).val( shift );
                    $( This._shiftAlphaInput ).val( String.fromCharCode( shift+65 ) );
                    $( This._sliderDiv ).slider({ value: shift });    
                });
            });

        
        
        // Frequency chart
        var freqId = 'freqChart_' + this.generateUUID();
        This._freqDiv.setAttribute('id', freqId );
        This._freqDiv.setAttribute('class', 'freqChart chart');
        this.initFrequencyChart( freqId );
        
        // Dot product chart
        var dotId = 'dotChart_' + this.generateUUID();
        This._dotDiv.setAttribute('id', dotId );
        This._dotDiv.setAttribute('class', 'dotChart chart');
        this.initDotProductChart( dotId );
        
        
    },  // end init
    
    
    
    get controlsTitle(){
        return this._controlsTitleDiv == null ? null : this._controlsTitleDiv.innerHTML;
    },
    set controlsTitle( innerHTML ){
        if( this._controlsTitleDiv != null ){
            this._controlsTitleDiv.innerHTML = innerHTML;
        }
    },
    
    
    
    
    
    
    generateUUID : function(){
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x7|0x8)).toString(16);
        });
        return uuid;
    },
    
    
    
    addEventListener : function( eventType, callback ){
        if( this._listeners == null ){
            this._listeners = {};
        }
        if( this._listeners[eventType] == null ){
            this._listeners[eventType] = [callback];
        } else {
            this._listeners[eventType].push(callback);
        }
    },
    
    removeEventListener : function( eventType, callback ){
        if( this._listeners == null ) return;
        if( this._listeners[eventType] == null ) return;
        var index = this._listeners[eventType].indexOf( callback );
        if( index > -1 ){
            this._listeners[eventType] = this._listeners[eventType].splice(index,1);
        }
    },
    
    fireEvent : function( eventType ){
        var This = this;
        var func = function(){
            if( This._listeners != null && This._listeners[eventType] != null ){
                This._listeners[eventType].map(function(callback){
                    callback(This);
                });
            }
        };
        if( This._suspendUpdates ){
            This._toUpdate[eventType] = func;
        } else {
            func();
        }
    },
    
    batch : function( doThisBatch ){
        //this._toUpdate = {};
        //this._suspendUpdates = true;
        doThisBatch();
        /*this._suspendUpdates = false;
        var getType = {};
        for( f in this._toUpdate ){
            if( f && getType.toString.call(f) === '[object Function]' ){
                f();
            }
        }
        this._toUpdate = {};*/
    },
    
    get cipherText() { return this._cipherText; },
    set cipherText ( text ){
        if( text === this._cipherText ) return;
        var This = this;
        $.Deferred(function(){
            This._cipherText = text;
            This._plainTextCache = {}; // Clear cached deciphered contents
            
            This.paddedFrequencies = This.frequenciesPaddedAlphabet( This.cipherText );
            This.updateFrequencyChart();
            This.updateDotProductChart();
            This.fireEvent( "cipherTextChanged" );
            This.fireEvent( "plainTextChanged" );
        
            // Pre-cache the deciphered text
            $.Deferred(function(){
                for( var i = 0; i < 26; i++ ){
                    This.getPlainText(i); // pre-cache
                }
            });
        });
    },
    
    get stepStart() { return this._stepStart; },
    set stepStart( start ){
        if( start === this._stepStart ) return;
        var This = this;
        //$.Deferred(function(){
            This._stepStart = start;
            This._plainTextCache = {}; // Clear cached deciphered contents
            This.paddedFrequencies = This.frequenciesPaddedAlphabet( This.cipherText, This.stepStart, This.step );
            
            This.updateFrequencyChart();
            This.updateDotProductChart();
            This.fireEvent( "stepStartChanged" );
            This.fireEvent( "plainTextChanged" );
        
            // Pre-cache the deciphered text
            //$.Deferred(function(){
            //    for( var i = 0; i < 26; i++ ){
            //        This.getPlainText(i); // pre-cache
            //    }
            //});
        //});
    },
    
    get step() { return this._step; },
    set step( step ){
        if( step === this._step ) return;
        var This = this;
        //$.Deferred(function(){
            This._step = step;
            This._plainTextCache = {}; // Clear cached deciphered contents
            This.paddedFrequencies = This.frequenciesPaddedAlphabet( This.cipherText, This.stepStart, This.step );
            
            This.updateFrequencyChart();
            This.updateDotProductChart();
            This.fireEvent( "stepChanged" );
            This.fireEvent( "plainTextChanged" );
        
            // Pre-cache the deciphered text
            //$.Deferred(function(){
            //    for( var i = 0; i < 26; i++ ){
            //        This.getPlainText(i); // pre-cache
            //    }
            //});
        //});
    },
    
    get originalShift() { return this._originalShift; },
    set originalShift ( shift ){
        if( shift === this._originalShift ) return;
        var This = this;
        //$.Deferred(function(){
            This._originalShift = shift;

            This.updateFrequencyChart();
            This.updateDotProductChart('shift');
            This.fireEvent( "originalShiftChanged" );
            This.fireEvent( "plainTextChanged" );
        //});
    },
    
/*
    setStepStartShift : function( step, start, shift ){
        var This = this;
        This._step = step;
        This._stepStart = start;
        This._originalShift = shift;
        This._plainTextCache = {}; // Clear cached deciphered contents
        This.paddedFrequencies = This.frequenciesPaddedAlphabet( This.cipherText, start, step );
            
        This.updateFrequencyChart();
        This.updateDotProductChart('shift');
       
        This.fireEvent( "stepChanged" );
        This.fireEvent( "stepStartChanged" );
        //This.fireEvent( "originalShiftChanged" ); // Infinite loop
        This.fireEvent( "plainTextChanged" );
        
    },
*/
    
    get plainText() {
        return this.getPlainText( this.originalShift );
    },
    getPlainText : function( origShift ){
        if( this._plainTextCache == null ){
            this._plainTextCache = {};
        }
        if( this._plainTextCache[origShift] == null ){
            this._plainTextCache[origShift] = 
                this.decipher( this.cipherText, origShift, this.stepStart, this.step );
        }
        return this._plainTextCache[origShift];
    },
    // No setter. Only use this._plainTextCache[..] internally
    
    get paddedFrequencies() { return this._paddedFrequencies == null ? [] : this._paddedFrequencies; },
    set paddedFrequencies(pf) { this._paddedFrequencies = pf; },
    
    
    // Automatically (try to) decipher
    guess : function(){
        var indexOfMax = 0;
        var dots = this.dotProductCoincidence;
        for( var i = 0; i < dots.length; i++ ){
            if( dots[i] > dots[indexOfMax] ){
                indexOfMax = i;
            }
        }
        // How far is max from the letter 'e'?
        this.originalShift = indexOfMax;//(26 + indexOfMax - 4) % 26;
    },

    /**
     * Shifts the given text, maintaining case and preserving
     * non-latin characters (non a-z).  For example a call
     * with the text "cat" and a shift of 2 would return "ecv".
     */
    decipher : function ( text, origShift, start, step, optionalInterleaveSource ){
        origShift = origShift % 26;
        var output = '';
        var c;
        var textLength = text.length;
        var alphaPos = 0;
        for( var i = 0; i < textLength; i++ ){
            c = text.charCodeAt(i);
            if( c >= 65 && c <= 90 ){ // UPPER
                if( (alphaPos-start) % step === 0 ){
                    output += String.fromCharCode( (c - 65 + 26-origShift ) % 26 + 65 );
                } else {
                    output += optionalInterleaveSource == null ? text.charAt(i) : optionalInterleaveSource.charAt(i);
                }
                alphaPos++;
            } else if( c >= 97 && c <= 122 ){ // lower
                if( (alphaPos-start) % step === 0 ){
                    output += String.fromCharCode( (c - 97 + 26-origShift) % 26 + 97 );
                } else {
                    output += optionalInterleaveSource == null ? text.charAt(i) : optionalInterleaveSource.charAt(i);
                }
                alphaPos++;
            } else {
                output += optionalInterleaveSource == null ? text.charAt(i) : optionalInterleaveSource.charAt(i);
            }
        }
        return output;
    },
    
    
    /**
     * Returns the frequencies of characters in the text.
     * The returned value is a dictionary with every character
     * in the source text as a key (even punctuation, etc).
     */
    frequenciesCountChars : function( text, start, step ){
        var freqs = {};
        var textLength = text.length;
        var alphaPos = 0;
        var c;
        var cChar;
        for( var i = 0; i < textLength; i++ ){
            c = text.charCodeAt(i);
            if( (c >= 65 && c <= 90) || (c >= 97 && c <= 122) ){ // alpha
                if( (alphaPos-start) % step === 0 ){
                    cChar = text.charAt(i);
                    freqs[cChar] = freqs[cChar] ? freqs[cChar] + 1 : 1;
                }
                alphaPos++;
            }
        }
        return freqs;
    },
    
    /**
     * Takes an array (presumably of frequencies) and shifts
     * the values in order to plot them appropriately.
     */
    shiftArray : function ( input, origShift/*0..26*/ ){
        var output = [];
        for( var i = 0; i < input.length; i++ ){
            output[i] = input[ (i+origShift) % input.length ];
        }
        return output;
    },
    
    
    
    /**
     * Returns a frequency array of length 26
     * corresponding to each letter in the alphabet, A..Z
     */
    frequenciesPaddedAlphabet : function( text ){
        var rawFreqs = this.frequenciesCountChars( text, this.stepStart, this.step );
        var paddedFreqs = [];
        var totalChars = 0;
        for( var i = 0; i < this.ALPHABET_UPPER.length; i++ ){
            var count = 0;
            if( !isNaN( rawFreqs[this.ALPHABET_LOWER[i]] ) ){
                count += rawFreqs[this.ALPHABET_LOWER[i]]
            }
            if( !isNaN( rawFreqs[this.ALPHABET_UPPER[i]] ) ){
                count += rawFreqs[this.ALPHABET_UPPER[i]]
            }
            paddedFreqs[ i ] = count;
            totalChars += count;
        }
        for( var i = 0; i < paddedFreqs.length; i++ ){
            paddedFreqs[i] = paddedFreqs[i] == null || totalChars == 0 ? 0.0 : 1.0 * paddedFreqs[i] / totalChars;
        }
        return paddedFreqs;
    },
    
    dotProduct : function( u, v ){
        var len = Math.min( u.length, v.length );
        var sum = 0;
        for( var i = 0; i < len; i++ ){
            sum += u[i] * v[i];
        }
        return sum;
    },
    
    get dotProductCoincidence(){
        var u = this.paddedFrequencies;
        var v = this.ENGLISH_FREQUENCIES;
        var len = Math.min( u.length, v.length );
        var dots = [];
        for( var i = 0; i < len; i++ ){
            dots[i] = this.dotProduct( u, this.shiftArray(v,25-i) );
        }
        return this.shiftArray(dots,25); // I'm off by one and have to shift.
    },
    
    
    /**
     * Sets up the frequency bar chart in the given HTML element.
     */
    initFrequencyChart : function( containerID ){
        
        if( this._freqChart == null ){
            
            this._freqChart = new Highcharts.Chart({
                chart: {
                    renderTo: containerID,
                    type: 'column'
                },
                colors: ['#777777', '#dd1111'],
                plotOptions: {
                                column: {
                                    grouping: false,
                                    shadow: false
                                },
                                dataLabels: { enabled: true },
                            },
                title: {
                    text: null//'Frequency Analysis'
                },
                xAxis: {
                    categories: this.ALPHABET_UPPER
                },
                yAxis: {
                    title: { text: 'Frequency' },
                    labels: {enabled: false}
                },
                legend: {
                    layout: 'vertical',
                    backgroundColor: '#FFFFFF',
                    align: 'right',
                    verticalAlign: 'top',
                    x: -5,
                    y: 5,
                    floating: true,
                    shadow: true
                },
                tooltip: {
                    enabled: false,
                    shared: true,
                    valueDecimals: 0,
                    pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y}%</b>\u00a0\u00a0<br/>'
                },
                series: [{
                    name: 'English',
                    data: this.ENGLISH_FREQUENCIES.map(function(x){return x*100;}),
                    pointPadding: -0.3
                }, {
                    name: 'Ciphertext',
                    pointPadding: 0.1
                }]
            });
        } 
    },
    
    
    
    /**
     * Sets up the frequency bar chart in the given HTML element.
     */
    initDotProductChart : function( containerID ){
        
        if( this._dotChart == null ){
            
            this._dotChart = new Highcharts.Chart({
                chart: {
                    renderTo: containerID,
                    type: 'column'
                },
                colors: ['#777777', '#dd1111'],
                plotOptions: {
                                column: {
                                    grouping: false,
                                    shadow: false
                                },
                                dataLabels: { enabled: true },
                                series: { marker: { enabled: false } }
                            },
                title: {
                    text: null//'Frequency Analysis'
                },
                xAxis: {
                    categories: this.ALPHABET_UPPER
                },
                yAxis: {
                    title: {text: 'Dot Product'},
                    labels: {enabled: false}
                },
                legend: {
                    layout: 'vertical',
                    backgroundColor: '#FFFFFF',
                    align: 'right',
                    verticalAlign: 'top',
                    x: -5,
                    y: 5,
                    floating: true,
                    shadow: true
                },
                tooltip: {
                    enabled: false,
                    shared: true
                },
                series: [{
                    name: 'Dot Product',
                    type: 'line',
                    //data: this.ENGLISH_FREQUENCIES,
                    pointPadding: -0.3
                }, {
                    name: 'Shift',
                    type: 'column',
                    pointPadding: 0.1
                }]
            });
        } 
    },
    
    
    updateFrequencyChart : function(){
        var This = this;
        var func = function(){
            var shiftedFreqs = This.shiftArray(This.paddedFrequencies,This.originalShift);
            if( This._freqChart != null ){
                if( shiftedFreqs == null ){
                    This._freqChart.series[1].setData([]);
                } else {
                    This._freqChart.series[1].setData(shiftedFreqs.map(function(x){return x*100;}));

                }
            }
        };
        if( This._suspendUpdates ){
            This._toUpdate['updateFrequencyChart'] = func;
        } else {
            func();
        }
    },
    
    updateDotProductChart : function(toUpdate){
        var This = this;
        var func = function(){
            var dots = This.dotProductCoincidence;
            if( toUpdate == null || toUpdate === 'freq' ){
                This._dotChart.series[0].setData( dots == null ? [] : dots );
            }
            if( toUpdate == null || toUpdate === 'shift' ){
                var shiftMarker = [];
                for( var i = 0; i < 26; i++ ){
                    shiftMarker[i] = 0;
                }
                shiftMarker[ This.originalShift ] = dots[ This.originalShift ];
                if( This._dotChart != null ){
                    This._dotChart.series[1].setData( shiftMarker == null ? [] : shiftMarker );
                }
            }
        };
        if( This._suspendUpdates ){
            This._toUpdate['updateDotProductChart'] = func;
        } else {
            func();
        }
    }
    
    
};  // end ShiftCipher


