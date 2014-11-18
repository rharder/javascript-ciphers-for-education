

// Requires ShiftCipher in shift.js


/* ********  V I G E N E R E   C I P H E R  ******** */

/**
 * Decipher help: http://www.cs.uri.edu/cryptography/classicalvigenerecryptdemo.htm
 * Decipher help: http://www.oxfordmathcenter.com/drupal7/node/169
 * 
 * @type type
 */
var VigenereCipher = {
    
    _cipherText : "",
    _key : null,
    _plainTextCache : null,
    _listeners : null,
    _shiftCiphers : null,
    _shiftCipherDivs : null,
    
    // HTML elements
    _container : null,
    _vigDiv : null,
    _keyLengthDiv : null,
    _keyLengthControlsDiv : null,
    _controlsTitleDiv : null,
    _keyInputTitleDiv : null,
    _keyInput : null,
    _keyLengthTitleDiv : null,
    _keyLengthInput : null,
    _keyLengthChartDiv : null,
    _keyLengthChart : null,
    _shiftDivsContainer : null,
    _guessBtn: null,
    
    
    init : function( domID ){
        var This = this;
        this._listeners = {};
        this._plainTextCache = {};
        this._shiftCiphers = [];
        this._shiftDivs = [];
        this._shiftCipherDivs = [];
        
        // Get/Create
        This._container = document.getElementById( domID );
            This._vigDiv = document.createElement('div');
                This._keyLengthDiv = document.createElement('div');
                    This._keyLengthControlsDiv = document.createElement('div');
                        This._controlsTitleDiv = document.createElement('div');
                        This._keyInputTitleDiv = document.createElement('div');
                        This._keyInput = document.createElement('input');
                        This._keyLengthTitleDiv = document.createElement('div');
                        This._keyLengthInput = document.createElement('input');
                        This._guessBtn        = document.createElement('input');
                    This._keyLengthChartDiv = document.createElement('div');
                This._shiftDivsContainer = document.createElement('div');
            
        // Append
        This._container.appendChild( This._vigDiv );
            This._vigDiv.appendChild( This._keyLengthDiv );        
                This._keyLengthDiv.appendChild( This._keyLengthControlsDiv );
                    This._keyLengthControlsDiv.appendChild( This._controlsTitleDiv );
                    This._keyLengthControlsDiv.appendChild( This._keyInputTitleDiv );
                    This._keyLengthControlsDiv.appendChild( This._keyInput );
                    This._keyLengthControlsDiv.appendChild( This._keyLengthTitleDiv );
                    This._keyLengthControlsDiv.appendChild( This._keyLengthInput );
                    //This._keyLengthControlsDiv.appendChild( document.createElement('div') );
                    //This._keyLengthControlsDiv.appendChild( This._guessBtn );
                This._keyLengthDiv.appendChild( This._keyLengthChartDiv );
            This._vigDiv.appendChild( This._shiftDivsContainer );
            
        // Outer Vig
        This._vigDiv.setAttribute('class','vigenere');
        
        // Left most controls
        This._keyLengthDiv.setAttribute('class','keyLength jquery-shadow jquery-shadow-standard');
        This._keyLengthControlsDiv.setAttribute('class','keyLengthControls controls');
        This._keyInputTitleDiv.innerHTML = "Key";
        This._keyLengthTitleDiv.innerHTML = "Length";

        // Key
        var keyInputId = 'keyInput_' + This.generateUUID();
        This._keyInput.setAttribute('type', 'text');
        This._keyInput.setAttribute('class', 'vigKey');
        This._keyInput.setAttribute('size', 6);
        This._keyInput.setAttribute('id', keyInputId);
        $(This._keyInput).on('input propertychange paste',function(){
            This.key = $(this).val();
        });
        This._keyInput.setAttribute('value', This.key );
        
        // Key Length
        var keyLengthInputId = 'keyLengthInput_' + This.generateUUID();
        This._keyLengthInput.setAttribute('type', 'text');
        This._keyLengthInput.setAttribute('class', 'vigKeyLength');
        This._keyLengthInput.setAttribute('size', 2);
        This._keyLengthInput.setAttribute('id', keyLengthInputId);
        $(This._keyLengthInput).on('input propertychange paste',function(){
            This.keyLength = $(this).val();
        });
        This._keyLengthInput.setAttribute('value', This.keyLength );

        // Guess
        var guessId = 'guess_' + this.generateUUID();
        This._guessBtn.setAttribute('type', 'button');
        This._guessBtn.setAttribute('value', 'Guess Keys');
        $( This._guessBtn ).on('click',function(){
            This.guess();
        });

        // Chart
        var keyLengthChartId = 'keyLengthChart_' + this.generateUUID();
        This._keyLengthChartDiv.setAttribute('class', 'keyLengthChart chart');
        This._keyLengthChartDiv.setAttribute('id', keyLengthChartId);
        This.initKeyLengthChart(keyLengthChartId);

        
        this.key = 'A';
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
    
    
    guess : function(animate){
        this._shiftCiphers.map( function( cipher ){
                cipher.guess(animate);
            } );
    },
    
    
    get cipherText() { return this._cipherText; },
    set cipherText ( text ){
        if( text === this._cipherText ) return;
        this._cipherText = text;
        this._plainTextCache = {}; // Clear cached deciphered contents
        var This = this;
        //$.Deferred(function(){
            this._shiftCiphers.map( function( cipher ){
                cipher.cipherText = text;
            } );
            This.updateKeyLengthChart();
            This.fireEvent( "cipherTextChanged", This );
            This.fireEvent( "plainTextChanged", This );
        //});
    },
    
    get key() { return this._key; },
    set key( key ){
        //if( key === this._key ) return;
        var This = this;
        var preppedKey = '';
        for( var i = 0 ; i < key.length; i++ ){
            var c = key.charCodeAt( i );
            if( c >= 65 && c <= 90 ){
                preppedKey += String.fromCharCode( c );
            } else if( c >= 97 && c <= 122 ){
                preppedKey += String.fromCharCode( c-32 ); // Make uppercase
            } else {
                // Skip character
            }
        }
        this._key = preppedKey;
        
        // Update UI
        $(this._keyInput).val(this._key );
        $(this._keyLengthInput).val(this.keyLength );
        
        // Make sure there's a shift cipher for each character in key
        var This = this;
        if( preppedKey.length > this._shiftCiphers.length ){ // Add shift ciphers
            for( var i = this._shiftCiphers.length; i < preppedKey.length; i++ ){
                var cipher = Object.create(ShiftCipher);
                this._shiftCiphers[i] = cipher;
                var cipherDiv = document.createElement('div');
                    this._shiftCipherDivs[i] = cipherDiv;
                    this._shiftDivsContainer.appendChild( cipherDiv );
                    var cipherId = 'vigenere_shift_' + cipher.generateUUID();
                    cipherDiv.setAttribute('id', cipherId);
                    cipherDiv.setAttribute('class', 'shift');
                
                cipher.init( cipherId );
                cipher._controlsTitleDiv.innerHTML = "Key Position " + (i+1);
                cipher.step = preppedKey.length;
                cipher.stepStart = i;
                cipher.cipherText = this.cipherText;
                
                
                var vigListener = function(src){
                    var keyChar = String.fromCharCode( src.originalShift + 65 );
                    var oldKey = This.key;
                    var keyPos = src.stepStart;
                    var newKey = oldKey.substr(0, keyPos) + keyChar + oldKey.substr(keyPos+1);
                    This.key = newKey;
                };
                cipher.addEventListener('originalShiftChanged', vigListener);
                cipher._vig_removeVigenereListener = function(){
                    cipher.removeEventListener('originalShiftChanged', vigListener);
                };
                
            }
        } else if( preppedKey.length < this._shiftCiphers.length ){ // Remove ciphers
            while( preppedKey.length < this._shiftCiphers.length ){
                $.Deferred(function(){
                    var cipher = This._shiftCiphers.pop();
                    cipher._vig_removeVigenereListener();
                    var cipherDiv = This._shiftCipherDivs.pop();
                    This._shiftDivsContainer.removeChild( cipherDiv );
                });
            }
        }
        
        //if( preppedKey.length == this._shiftCiphers.length ){
            for( var i = 0; i < preppedKey.length; i++ ){
                var x = i;
                This._shiftCiphers[i].batch(function(){
                    //This._shiftCiphers[x].setStepStartShift( preppedKey.length, x, preppedKey.charCodeAt(x) - 65);
                    This._shiftCiphers[x].step = preppedKey.length;
                    This._shiftCiphers[x].stepStart = x;
                    This._shiftCiphers[x].originalShift = preppedKey.charCodeAt(x) - 65;
                });
            }
        //} 
        
        
        //$.Deferred(function(){
            This.updateKeyLengthChart('keyLength');
            This.fireEvent( "keyChanged", This );
            This.fireEvent( "plainTextChanged", This );
        //});
    },


    get keyLength(){ return this.key == null ? 0 : this.key.length; },
    set keyLength( len ){
        if( len > this.key.length ){
            var newKey = this.key;
            for( var i = newKey.length; i < len; i++ ){
                newKey += 'A';
            }
            this.key = newKey;
        } else {
            this.key = this.key.substring( 0, len );
        }
        $(this._keyLengthInput).val(this.keyLength );
    },

    
    get plainText() {
        return this._getPlainText( this.key );
    },
    _getPlainText : function( key ){
        if( key == null ) return '';
        if( this._plainTextCache[key] == null ){
            //var out = this.cipherText;
            var plains = [];
            var keyLength = this.keyLength;
            for( var i = 0; i < keyLength; i++ ){
                plains[i] = this._shiftCiphers[i].plainText;
            }
            var output = '';
            var c;
            var cipherText = this.cipherText;
            var textLength = cipherText.length;
            var alphaPos = 0;
            for( var i = 0; i < textLength; i++ ){
                c = cipherText.charCodeAt(i);
                if( (c >= 65 && c <= 90) || (c >= 97 && c <= 122) ){ // alpha
                    output += plains[alphaPos%keyLength].charAt(i);
                    alphaPos++;
                } else {
                    output +=  cipherText.charAt(i) ;
                }
            }
            
            this._plainTextCache[key] = output;
        }
        return this._plainTextCache[key];
    },
    
    
    /**
     * For assisting in guessing key length, shift the
     * cipher text and count how often there's a match
     * between the original array and the shifted one.
     * @returns {undefined}
     */
    calculateMatches : function(){
        var text = this.extractAlphaUpper( this.cipherText );
        var freqs = [];
        var textLength = text.length;
        for( var shift = 1; shift < 22; shift++ ){
            freqs[shift-1] = 0;
            for( var i = 0; i < textLength-shift; i++ ){
                if( text.charAt(i) === text.charAt(i+shift) ){
                    freqs[shift-1]++;
                }
            }
        }
        return freqs;
    },
    
    
    
    calculateSumOfSquares : function(){
        var sumSquaresByKeyLength = []; // Zero index is key length one
        var text = this.cipherText;
        
        // Go through each key length
        for( var keyLengthI = 0; keyLengthI <= 20; keyLengthI++ ){
            
            // Calc and average sumSquares for each character in the key
            var totalForAvg = 0;
            for( var keyPosI = 0; keyPosI <= keyLengthI; keyPosI++ ){
                var rawCount     = ShiftCipher.frequenciesCountChars(text,keyPosI,keyLengthI+1);
                var paddedFreqs  = ShiftCipher.padFrequencies( rawCount );
                var alignedFreqs = ShiftCipher.alignToE( paddedFreqs );
                
                // Calc the differences and square them
                var freqLength = alignedFreqs.length;
                var sumSquares = 0;
                var diff;
                for( var i = 0; i < freqLength; i++ ){
                    diff = alignedFreqs[i] - ShiftCipher.ENGLISH_FREQUENCIES[i];
                    sumSquares += diff*diff;
                }
                totalForAvg += sumSquares;
                
            }   // end for: key pos
            sumSquaresByKeyLength[keyLengthI] = 1/(totalForAvg / (keyLengthI + 1));
        }   // end for: each keylength
        
        return sumSquaresByKeyLength;
    },
    
    
    
    /**
     * Extracts the alpha characters from the cipher text
     * and ensures they are all uppercase.
     * @returns {undefined}
     */
    extractAlphaUpper : function(text){
        var out = '';
        var textLength = text.length;
        var c;
        for( var i = 0; i < textLength; i++ ){
            c = text.charCodeAt(i);
            if( c >= 65 && c <= 90 ){ // UPPER
                out += String.fromCharCode(c);
            } else if( c >= 97 && c <= 122 ){ // lower, make upper
                out += String.fromCharCode( c - 32 );
            }
        }
        return out;
    },
    
    
    
    initKeyLengthChart : function( containerID ){
        var xCat = [];
        for( var i = 0; i < 19; i++ ){
            xCat[i] = i+1;
        }
        if( this._keyLengthChart == null ){
            
            this._keyLengthChart = new Highcharts.Chart({
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
                    //categories: ShiftCipher.ALPHABET_UPPER
                    categories: xCat,
                    max: 20
                },
                yAxis: {
                    title: {text: '1/SSE'},
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
                    name: '1/SSE',
                    type: 'line'
                }, {
                    name: 'Key Length',
                    type: 'column',
                    pointPadding: 0.1
                }]
            });
        } 
    },
    
    
    
    updateKeyLengthChart : function(toUpdate){
        var This = this;
        var func = function(){
            //var dots = This.dotProductCoincidence;
            //var matches = This.calculateMatches();
            var ss = null;
            if( toUpdate == null || toUpdate === 'matches' ){
                //This._dotChart.series[0].setData( dots == null ? [] : dots );
                //This._keyLengthChart.series[0].setData( matches == null ? [] : matches );
            }
            if( toUpdate == null || toUpdate === 'sumSquares' ){
                ss = This.calculateSumOfSquares();
                This._keyLengthChart.series[0].setData( ss == null ? [] : ss );
            }
            if( toUpdate == null || toUpdate === 'keyLength' ){
                if( ss == null ) {
                    ss = This.calculateSumOfSquares();
                }
                var lengthMarker = [];
                for( var i = 0; i < ss.length; i++ ){
                    lengthMarker[i] = 0;
                }
                lengthMarker[ This.keyLength-1 ] = ss[ This.keyLength-1 ];
                if( This._keyLengthChart != null ){
                    This._keyLengthChart.series[1].setData( lengthMarker == null ? [] : lengthMarker );
                }
            }
        };
        if( This._suspendUpdates ){
            This._toUpdate['updateKeyLengthChart'] = func;
        } else {
            func();
        }
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
    
    fireEvent : function( eventType, arg ){
        if( arg == null ) arg = this;
        if( this._listeners != null && this._listeners[eventType] != null ){
            this._listeners[eventType].map(function(callback){
                callback(arg);
            });
        }
    }
    
    
    
};  // end VigenereCipher




