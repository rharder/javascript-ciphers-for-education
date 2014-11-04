




/* ********  V I G E N E R E   C I P H E R  ******** */

/**
 * Decipher help: http://www.cs.uri.edu/cryptography/classicalvigenerecryptdemo.htm
 * Decipher help: http://www.oxfordmathcenter.com/drupal7/node/169
 * 
 * @type type
 */
var VigenereCipher = {
    
    ALPHABET_LOWER : ['a','b','c','d','e','f','g','h','i','j','k','l','m',
                          'n','o','p','q','r','s','t','u','v','w','x','y','z'],
    
    ALPHABET_UPPER : ['A','B','C','D','E','F','G','H','I','J','K','L','M',
                          'N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
                          
//    ALPHABET_INDEX : {'A':1, 'B':2, 'C':3, 'D':4, 'E':5, 'F':6, 'G':7, 'H':8,
//                      'I':9, 'J':10, 'K':11, 'L':12, 'M':13, 'N':14, 'O':15,
//                      'P':16, 'Q':17, 'R':18, 'S':19, 'T':20, 'U':21, 'V':22,
//                      'W':23, 'X':24, 'Y':25, 'Z':26},
//
    // http://www.cryptograms.org/letter-frequencies.php
    ENGLISH_FREQUENCIES : [0.08167, 0.01492, 0.02782, 0.04253, 0.12702, 0.02228,
                           0.02015, 0.06094, 0.06966, 0.00153, 0.00772, 0.04025,
                           0.02406, 0.06749, 0.07507, 0.01929, 0.00095, 0.05987,
                           0.06327, 0.09056, 0.02758, 0.00978, 0.02360, 0.00150,
                           0.01974, 0.00074],

    _freqChart : null,
    _cipherText : "",
    _key : "A",
//    _originalShift : 0,
//    _paddedFrequencies : [],
//    _plainText : "",
    _plainTextCache : {},
    _listeners : {},
    _ignoreNonAlpha : true,
    
    
    addEventListener : function( eventType, callback ){
        if( this._listeners[eventType] == null ){
            this._listeners[eventType] = [callback];
        } else {
            this._listeners[eventType].push(callback);
        }
    },
    
    fireEvent : function( eventType, arg ){
        if( this._listeners[eventType] != null ){
            this._listeners[eventType].map(function(callback){
                callback(arg);
            });
        }
    },
    
    get cipherText() { return this._cipherText; },
    set cipherText ( text ){
        if( text === this._cipherText ) return;
        this._cipherText = text;
        this._plainTextCache = {}; // Clear cached deciphered contents
        var This = this;
        $.Deferred(function(){
            This.updateChart();
            This.fireEvent( "cipherTextChanged", This );
            This.fireEvent( "plainTextChanged", This );
        });
    },
    
    get key() { return this._key; },
    set key( key ){
        if( key === this._key ) return;
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
        var This = this;
        $.Deferred(function(){
            //This.updateChart();
            This.fireEvent( "keyChanged", This );
            This.fireEvent( "plainTextChanged", This );
        });
    },

    
    get plainText() {
        return this.getPlainText( this.key );
    },
    getPlainText : function( key ){
        if( this._plainTextCache[key] == null ){
            this._plainTextCache[key] = 
                this.decipher( this.cipherText, key );
        }
        return this._plainTextCache[key];
    },
    // No setter. Only use this._plainTextCache[..] internally
    
    get paddedFrequencies() { return this._paddedFrequencies; },
    set paddedFrequencies(pf) { this._paddedFrequencies = pf; },
    
    
    // Automatically (try to) decipher
    solve : function(){
        // Vigenere solve, not yet implemented
    },

    /**
     * Vigenere decipher
     */
    decipher : function ( text, key ){
        var output = '';
        var c;
        var len = text.length;
        
        // Prep the shifts for the key
        var origShift = [];
        var keyLength = key.length;
        for( var i = 0; i < keyLength; i++ ){
            origShift[i] = key.charCodeAt(i) - 64;
        }

        var pos = 0;
        for( var i = 0; i < len; i++ ){
            c = text.charCodeAt(i);
            if( i < 3 ){
            }
            if( c >= 65 && c <= 90 ){
                output += String.fromCharCode( (c - 65 + 26-origShift[pos%keyLength] ) % 26 + 65 );
                pos++;
            } else if( c >= 97 && c <= 122 ){
                output += String.fromCharCode( (c - 97 + 26-origShift[pos%keyLength]) % 26 + 97 );
                pos++
            } else {    
                    output += text.charAt(i);
                if( !this._ignoreNonAlpha ){
                    pos++;
                } 
            }
        }
        return output;
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
     * Returns the frequencies of characters in the text.
     * The returned value is a dictionary with every character
     * in the source text as a key (even punctuation, etc).
     */
    frequenciesCountChars : function( text ){
        var freqs = {};
        var c;
        for( var i = 0; i < text.length; i++ ){
            c = text.charAt(i);
            freqs[c] = freqs[c] ? freqs[c] + 1 : 1;
        }
        return freqs;
    },
    
    /**
     * Returns a frequency array of length 26
     * corresponding to each letter in the alphabet, A..Z
     */
    frequenciesPaddedAlphabet : function( text ){
        var rawFreqs = this.frequenciesCountChars( text );
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
            paddedFreqs[i] = 1.0 * paddedFreqs[i] / totalChars;
        }
        return paddedFreqs;
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
                    title: {
                        text: 'Frequency'
                    }
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
                series: [{
                    name: 'English',
                    data: this.ENGLISH_FREQUENCIES,
                    pointPadding: -0.3
                }, {
                    name: 'Ciphertext',
                    pointPadding: 0.1
                }]
            });
        } 
    },
    
    
    updateChart : function(){
        //this._freqChart.series[1].setData(this.shiftArray(this.paddedFrequencies,this.originalShift));
    },
    
    
};  // end VigenereCipher




