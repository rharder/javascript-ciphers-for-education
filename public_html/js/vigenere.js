

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
    _controlsDiv : null,
    _keyInput : null,
    _shiftDivsContainer : null,
    
    
    init : function( domID ){
        this._listeners = {};
        this._shiftCiphers = [];
        this._shiftDivs = [];
        this._shiftCipherDivs = [];
        
        
        var This = this;
        This._container = document.getElementById( domID );
            This._controlsDiv = document.createElement('div');
            This._controlsDiv.setAttribute('class','vigenere');
            This._controlsDiv.innerHTML = 'Key: ';
            
            this._keyInput = document.createElement('input');
                var keyInputId = 'keyInput_' + This.generateUUID();
                This._keyInput.setAttribute('type', 'text');
                This._keyInput.setAttribute('class', 'vigKey');
                This._keyInput.setAttribute('id', keyInputId);
                $(This._keyInput).on('input propertychange paste',function(){
                    This.key = $(this).val();
                });
                This._keyInput.setAttribute('value', This.key );
            
            
            This._shiftDivsContainer = document.createElement('div');
            This._container.appendChild( This._controlsDiv );
                This._controlsDiv.appendChild( This._keyInput );
            This._container.appendChild( This._shiftDivsContainer );
        
        
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
        $(this._keyInput).val(this._key );
        
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
                var cipher = this._shiftCiphers.pop();
                cipher._vig_removeVigenereListener();
                var cipherDiv = this._shiftCipherDivs.pop();
                this._shiftDivsContainer.removeChild( cipherDiv );
                
            }
        }
        
        //if( preppedKey.length == this._shiftCiphers.length ){
            for( var i = 0; i < preppedKey.length; i++ ){
                this._shiftCiphers[i].step = preppedKey.length;
                this._shiftCiphers[i].stepStart = i;
                this._shiftCiphers[i].originalShift = preppedKey.charCodeAt(i) - 65;
            }
        //} 
        
        
        var This = this;
        //$.Deferred(function(){
            //This.updateChart();
            This.fireEvent( "keyChanged", This );
            This.fireEvent( "plainTextChanged", This );
        //});
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
        return this._getPlainText( this.key );
    },
    _getPlainText : function( key ){
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




