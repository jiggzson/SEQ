var SEQ = (function(){
    
    var max_iter = 1000,
        polynomials = [],
        tol = 1e-3,
        variable = 'x',
        sequence = [];
    
    //http://stackoverflow.com/questions/3959211/fast-factorial-function-in-javascript
    var facts = [];
    function factorial (n) {
        if (n === 0 || n === 1)
            return 1;
        if (facts[n] > 0)
            return facts[n];
        return facts[n] = factorial(n-1) * n;
    };

    function round(x, s) { 
        s = s || 11;
        return Math.round( x*Math.pow( 10,s ) )/Math.pow( 10,s );
    }


    //checks if a number is near another
    function near(n1, n2, tol) {
        tol = tol || 0.1;
        return Math.abs(n1-n2) < tol;
    }

    function sum(arr) {
        var s = 0, l=arr.length;
        for(var i=0; i<l; i++) s += arr[i];
        return s;
    }

    function avg(arr) {
        if(arr.length === 0) return 0;
        return sum(arr)/arr.length;
    }
    
    function stop() {
        throw new Error('Maximum iterations reached! No solutions found.');//safety
    }


    function analyze(seq) {
        if(seq.length < 2) throw new Error('Sequence must contain at least 2 numbers');
        
        var number_sequence = seq.slice();
        var outer_iter = 0;
        do {
            var iter = 0;
            do {
                var diffs = [],
                    l = seq.length; //get the last sequence
                for(var i=0; i<(l-1); i++) {
                    //get differences
                    diffs.push(seq[i+1]-seq[i]); 
                }  

                var diff_avgs =  avg(diffs),
                    seq_avgs = avg(seq),
                    slope = diff_avgs/seq_avgs;

                seq = diffs; //use the differences for the next iteration
                if(iter > max_iter) stop();
                iter++; 
            } 
            while(slope >= tol);

            //the power of that polynomial is the number of layers minus the original layer
            var pow = iter-1,
                //get the coefficient
                coeff = round(seq_avgs/factorial(pow)),
                //prepare the next sequence
                next_seq = [],
                //if the slope of the current polynomial is negative then we're not done and 
                //must find others
                neg_slope = (iter > 0 && seq_avgs < 0);
            for(var i=0; i<l; i++) {
                next_seq.push(number_sequence[i] - coeff*Math.pow(i+1, pow));
            }
            //record the  polynomial
            if(coeff !== 0) polynomials.push([coeff, pow]);
            //set the next sequence
            seq = next_seq; //reset the inner sequence
            number_sequence = seq; //reset the outer sequence
            
            //reset the iterator
            iter = 0;
            outer_iter++;
            if(outer_iter > max_iter) stop();
        }
        while(seq_avgs >= tol || neg_slope)

        return polynomials;
    }
    
    return {
        setMaxIterations: function(val) {
            max_iter = val;
            return this;
        },
        setTolerance: function(val) {
            tol = val;
            return this;
        },
        setVariable: function(val) {
            variable = val;
            return this;
        },
        analyze: function(seq) {
            sequence = seq;
            analyze(seq);
            return this;
        },
        eachPolynomial: function(f) {
            var arr = [],
                l = polynomials.length;
            for(var i=0; i<l; i++) {
                arr.push(f(polynomials[i], i, i===l-1));
            }
            return arr;
        },
        toPolynomialString: function() {
            var poly_array = this.eachPolynomial(function(p_array, index, last) {
                //get the coefficient
                var c = Math.abs(p_array[0]),
                    //get the power
                    p = p_array[1],
                    //get the sign
                    s = p_array[0] < 1 ? '-' : '',
                    //remove the variable for zero powers
                    v = p === 0 ? '' : variable;
                //get rid of a one coefficient
                if(c === 1 && !last) c = '';
                //place the multiplication sign
                if(p !==0 && c !== '') c = c+'*';
                //get rid of one as power
                p = p === 1 || p === 0 ? '' : '^'+p;
                
                return s+c+v+p;
            });

            return poly_array.join('+').replace('+-', '-');
        },
        sequence: function() {
            return sequence;
        },
        next: function() {
            var n = sequence.length+1;
            return sum(this.eachPolynomial(function(p){
                return p[0]*Math.pow(n, p[1]);
            }));
        },
        toFunction: function() {
            return new Function([variable], 'return '+this.eachPolynomial(function(p){
                var pow = p[1], c = p[0];
                if(pow === 0) return c;
                else if(pow === 1) return c+'*'+variable;
                else return c+'*Math.pow('+variable+','+pow+')';
            }).join('+')+';');
        }
    };
    
})();
