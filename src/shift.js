var ShiftCipher = {
	shiftText: function ( text, shift ){
		return "SHIFTED (not really): " + text;
	},
	
	
	
	
    addEvent: function( target, eventName, func, capture )
    {
        if( target.addEventListener ){
            target.addEventListener( eventName, func, capture );
            return true;
        }   // end if: addEventListener
        else if( target.attachEvent )
            return target.attachEvent( 'on'+eventName, func );
    },  // end addEvent


    removeEvent: function( target, eventName, func, capture )
    {
        if( target.removeEventListener ){
            target.removeEventListener( eventName, func, capture );
            return true;
        }   // end if: removeEventListener
        else if( target.detachEvent )
            return target.detachEvent( 'on'+eventName, func );
    }   // end removeEvent

}