

// Requires ShiftCipher in shift.js


/* ********  V I G E N E R E   C I P H E R  ******** */

/**
 * Decipher help: http://www.cs.uri.edu/cryptography/classicalvigenerecryptdemo.htm
 * Decipher help: http://www.oxfordmathcenter.com/drupal7/node/169
 * 
 * @type type
 */
var VigenereCipher = {
    
    _freqChart : null,
    _cipherText : "",
    _key : null,
//    _originalShift : 0,
//    _paddedFrequencies : [],
//    _plainText : "",
    _plainTextCache : null,
    _listeners : null,
    _shiftCiphers : null,
    _shiftCipherDivs : null,
    
    // HTML elements
    _container : null,
    _shiftDivsContainer : null,
    
    
    init : function( domID ){
        this._listeners = {};
        this._shiftCiphers = [];
        this._shiftDivs = [];
        this._shiftCipherDivs = [];
        
        
        var This = this;
        This._container = document.getElementById( domID );
            This._shiftDivsContainer = document.createElement('div');
            This._container.appendChild( This._shiftDivsContainer );
        
        
        this.key = 'AAAAA';
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
            This.fireEvent( "cipherTextChanged", This );
            This.fireEvent( "plainTextChanged", This );
        //});
    },
    
    get key() { return this._key; },
    set key( key ){
        //if( key === this._key ) return;
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
                cipher._controlsTitleDiv.innerHTML = "Key Char " + (i+1);
                cipher.step = preppedKey.length;
                cipher.stepStart = i;
                cipher.cipherText = this.cipherText;
                
                cipher.addEventListener('originalShiftChanged', function(src){
                    var keyChar = String.fromCharCode( src.originalShift + 65 );
                    var oldKey = This.key;
                    var newKey = oldKey.substr(0, i) + keyChar + oldKey.substr(i+keyChar.length);
                    This.key = newKey;
                });
            }
        }
        
        if( preppedKey.length == this._shiftCiphers.length ){
            for( var i = 0; i < preppedKey.length; i++ ){
                this._shiftCiphers.originalShift = preppedKey[i].charCodeAt(0) - 65;
            }
        }
        
        
        var This = this;
        $.Deferred(function(){
            //This.updateChart();
            This.fireEvent( "keyChanged", This );
            This.fireEvent( "plainTextChanged", This );
        });
    },


    get keyLength(){ return this.key.length; },
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
    },

    
    get plainText() {
        return this.getPlainText( this.key );
    },
    getPlainText : function( key ){
        if( this._plainTextCache[key] == null ){
            var out = this.cipherText;
            this._shiftCiphers.map( function( cipher ){
                cipher.decipher( out, cipher.originalShift, cipher.stepStart, cipher.step, out );
            } );
            this._plainTextCache[key] = out;
        }
        return this._plainTextCache[key];
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
        if( this._listeners != null && this._listeners[eventType] != null ){
            this._listeners[eventType].map(function(callback){
                callback(arg);
            });
        }
    }
    
    
    
};  // end VigenereCipher




