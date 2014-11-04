


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
    _paddedFrequencies : [],
    _plainText : "",
    _plainTextCache : {},
    _listeners : {},
    
    
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
        var This = this;
        $.Deferred(function(){
            This._cipherText = text;
            This._plainTextCache = {}; // Clear cached deciphered contents
            This.paddedFrequencies = This.frequenciesPaddedAlphabet( This.cipherText );
            This.updateFrequencyChart();
            This.updateDotProductChart();
            This.fireEvent( "cipherTextChanged", This );
            This.fireEvent( "plainTextChanged", This );
        
            // Pre-cache the deciphered text
            $.Deferred(function(){
                for( var i = 0; i < 26; i++ ){
                    This.getPlainText(i); // pre-cache
                }
            });
        });
    },
    
    get originalShift() { return this._originalShift; },
    set originalShift ( shift ){
        if( shift === this._originalShift ) return;
        var This = this;
        $.Deferred(function(){
            This._originalShift = shift;
            This.updateFrequencyChart();
            This.updateDotProductChart('shift');
            This.fireEvent( "originalShiftChanged", This );
            This.fireEvent( "plainTextChanged", This );
        });
    },
    
    get plainText() {
        return this.getPlainText( this.originalShift );
    },
    getPlainText : function( origShift ){
        if( this._plainTextCache[origShift] == null ){
            this._plainTextCache[origShift] = 
                this.decipher( this.cipherText, origShift );
        }
        return this._plainTextCache[origShift];
    },
    // No setter. Only use this._plainTextCache[..] internally
    
    get paddedFrequencies() { return this._paddedFrequencies; },
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
    decipher : function ( text, origShift ){
        origShift = origShift % 26;
        var output = '';
        var c;
        var textLength = text.length;
        for( var i = 0; i < textLength; i++ ){
            c = text.charCodeAt(i);
            if( c >= 65 && c <= 90 ){
                output += String.fromCharCode( (c - 65 + 26-origShift ) % 26 + 65 );
            } else if( c >= 97 && c <= 122 ){
                output += String.fromCharCode( (c - 97 + 26-origShift) % 26 + 97 );
            } else {
                output += text.charAt(i);
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
        var shiftedFreqs = this.shiftArray(this.paddedFrequencies,this.originalShift);
        this._freqChart.series[1].setData(shiftedFreqs);
        
        //var one = this.shiftArray( this.ARRAY_ONE, this.originalShift );
        //var dot = this.dotProduct( shiftedFreqs, one, 'first' );
        //this._dotChart.series[1].setData( dot );
        //this._dotChart.series[1].setData(shiftedFreqs);
    },
    
    updateDotProductChart : function(toUpdate){
        //var dot = this.dotProduct( this.paddedFrequencies, this.ENGLISH_FREQUENCIES, 'both' );
        var dots = this.dotProductCoincidence;
        if( toUpdate == null || toUpdate === 'freq' ){
            this._dotChart.series[0].setData( dots );
        }
        if( toUpdate == null || toUpdate === 'shift' ){
            var shiftMarker = [];
            for( var i = 0; i < 26; i++ ){
                shiftMarker[i] = 0;
            }
            shiftMarker[ this.originalShift ] = dots[ this.originalShift ];
            this._dotChart.series[1].setData( shiftMarker );
        }
    }
    
    
};  // end ShiftCipher


