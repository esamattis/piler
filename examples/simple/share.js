(function(exports){

   exports.test = function(){
        return 'This is a shared module';
    };

}(typeof exports === 'undefined' ? this.share = {} : exports));
