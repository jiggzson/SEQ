/*
 * Author : Martin Donk
 * Website : http://www.nerdamer.com
 * Email : martin.r.donk@gmail.com
 * Source : https://github.com/jiggzson/nerdamer
 */

var SEQ = (function() {
    
    /**
     * Calculates the factorial of a number
     * @param {Number} n
     * @returns {Number}
     */
    function factorial(n) {
        if(n === 0)
            return 1;
        var f = n;
        while(n > 1) {
            f *= --n;
        }
        return f;
    };
    
    /**
     * Rounds a number
     * @param {Number} x
     * @param {Number} s The number of significant figures to round to
     * @returns {Number}
     */
    function round(x, s) { 
        s = s || 11;
        return Math.round( x*Math.pow( 10,s ) )/Math.pow( 10,s );
    }

    /**
     * 
     * @param {Number} n1
     * @param {Number} n2
     * @param {Number} tol
     * @returns {Boolean}
     */
    function near(n1, n2, tol) {
        tol = tol || 0.1;
        return Math.abs(n1-n2) < tol;
    }
    
    /**
     * Calcuates the sum of the numbers in a given array
     * @param {Array} arr
     * @returns {Number}
     */
    function sum(arr) {
        var s = 0, l=arr.length;
        for(var i=0; i<l; i++) s += arr[i];
        return s;
    }
    
    /**
     * Calcuates the average of numbers in a given array
     * @param {Array} arr
     * @returns {Number}
     */
    function avg(arr) {
        if(arr.length === 0) return 0;
        return sum(arr)/arr.length;
    }
    
    /**
     * Forces stop of the analysis
     * @returns {undefined}
     */
    function stop() {
        throw new Error('Maximum iterations reached! No solutions found.');
    }
    
    /**
     * The number sequence
     * @param {Array} sequence
     * @returns {Sequence}
     */
    function Sequence(sequence) {
        //set the sequence
        this.sequence = sequence;
        
        //the maximum iterations before giving up
        this.max_iter = 1000;
        
        //the variable that will be used when creating the polynomial string
        this.variable = 'x';
        
        //set the maximum allowable tolerance
        this.tolerance = 1e-3;
    }
    
    Sequence.generate = function(callback, n) {
        n = n || 10;
        var sequence = [];
        for(var i=0; i<n; i++) {
            sequence.push(callback.call(undefined, i));
        }
        return sequence;
    };
    
    /**
     * Calcuates the polynomial given a sequence
     * @returns {Sequence}
     */
    Sequence.prototype.analyze = function() {
        //clear the terms
        this.terms = [];
        
        //point to this sequece
        var seq = this.sequence;
        
        //the number of items
        var n = seq.length;
        
        if(this.sequence.length < 2) 
            throw new Error('Sequence must contain at least 2 numbers');
        
        var number_sequence = seq.slice();
        var outer_iter = 0;
        do {
            var iter = 0;
            do {
                var diffs = [],
                    l = seq.length; //get the last sequence
                for(var i=0; i<(l-1); i++) {
                    //get differences between each sequence
                    diffs.push(seq[i+1]-seq[i]); 
                }  

                var diff_avgs =  avg(diffs),
                    seq_avgs = avg(seq),
                    slope = diff_avgs/seq_avgs;

                seq = diffs; //use the differences for the next iteration
                if(iter > this.max_iter) 
                    stop();
                iter++; 
            } 
            while(slope >= this.tolerance);

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
            if(coeff !== 0) 
                this.terms[pow] = coeff;
            //set the next sequence
            seq = next_seq; //reset the inner sequence
            number_sequence = seq; //reset the outer sequence
            
            //reset the iterator
            iter = 0;
            outer_iter++;
            if(outer_iter > this.max_iter) 
                stop();
        }
        while(seq_avgs >= this.tolerance || neg_slope)
        
        //fill the holes
        this.fillHoles();
        
        //create a temporary sequence for making corrections
        var temp = this.copy();

        //we're going to adjust until we find the right polynomial for a predefined number of times
        for(var i=0; i<50; i++) {
            //recalculate this sequence
            temp.recalculate(n);
            
            if(temp.matches(this))
                break;
            
            //calcuate the deltas
            var deltas = [];
            //calculate the differences between these two
            for(var i=0, l=this.sequence.length; i<l; i++) {
                deltas.push(this.sequence[i]-this.at(i));
            }

            //analyze the delta sequence and inherit its terms
            var delta_sequence = this.add(new Sequence(deltas).analyze());
            //copy over the terms to this sequence
            temp.terms = delta_sequence.terms;
        }
        
        //copy over the corrected terms
        this.terms = temp.terms;
        
        return this.trim();
    };
    
    /**
     * Creates a copy of a Sequence
     * @returns {Sequence}
     */
    Sequence.prototype.copy = function() {
        var seq = new Sequence();
        seq.sequence = this.sequence.slice();
        //copy over the terms
        seq.terms = this.terms.slice();
        seq.max_iter = this.max_iter;
        seq.variable = this.variable;
        seq.tolerance = this.tolerance;
        
        return seq;
    };
    
    /**
     * Fills empty terms in the Sequence polynomial with zeroes
     * @returns {Sequence}
     */
    Sequence.prototype.fillHoles = function() {
        for(var i=0, l=this.terms.length; i<l; i++) {
            if(typeof this.terms[i] === 'undefined')
                this.terms[i] = 0;
        }
        
        return this;
    };
    
    /**
     * Adds the terms of two Sequence polynomials
     * @param {Sequence} sequence
     * @returns {Sequence}
     */
    Sequence.prototype.add = function(sequence) {
        var terms = [];
        
        var a = this;
        var b = sequence;
        //get the longer length out of the two
        var l = Math.max(a.sequence.length, b.sequence.length);
        //init
        for(var i=0; i<l; i++) {
            var e1 = a.getTerm(i);
            var e2 = b.getTerm(i);
            //add the two terms together
            terms[i] = e1 + e2;
        }
        
        return Sequence.fromArray(terms);
    };
    
    /**
     * Creates a Sequence object given an array
     * @param {Array} arr
     * @returns {Sequence}
     */
    Sequence.fromArray = function(arr) {
        var sequence = new Sequence([]);
        sequence.terms = arr;
        return sequence;
    };
    
    /**
     * Gets the coefficients of then nth term
     * @param {type} i
     * @returns {Number}
     */
    Sequence.prototype.getTerm = function(i) {
        var term = this.terms[i];
        //return 0 for blank terms
        return (typeof term === 'undefined' ? 0 : term);
    };
    
    /**
     * 
     * @param {Function} callback
     * @param {Array} arr the array in which the values will be inserted
     * @param {boolean} skip_zeroes will not insert zero terms if this is true
     * @returns {Array|undefined} return the array which was provide if one was provided
     */
    Sequence.prototype.eachTerm = function(callback, arr, skip_zeroes) {
        for(var i=0,l=this.terms.length, last=l-1; i<l; i++) {
            var result = callback.call(this, this.terms[i], i, last);
            if(!(skip_zeroes && result === '') && arr)
                arr.push(result);
        }
        return arr;
    };
    
    /**
     * Remove empty terms at the beginning of the polynomial.
     * @returns {Sequence}
     */
    Sequence.prototype.trim = function() {
        while(this.terms.length && this.terms[this.terms.length-1] === 0)
            this.terms.pop();
        
        return this;
    };
    
    /**
     * Generates a polynomial string for this Sequence based on its current terms
     * @returns {String}
     */
    Sequence.prototype.toPolynomialString = function() {
        var terms_array = [];

        this.eachTerm(function(e, i, last) {
            var retval, coeff, power;
            if(e === 0)
                retval = '';
            //The zeroth term is a special case since where x^0 = 1. No neet to display that
            //All we need is the coefficient
            else if(i === 0) {
                //if it's a constant then just return that since no formatting is needed
                if(i === last)
                    retval = e;
                //add the plus for positve terms not being first or last
                else if(e > 0)
                    retval = '+'+e;
                else 
                    retval = e;
            }
            else {
                //prepare the coefficient
                if(e === 1) {
                    //the one is implied
                    coeff = i === last ? '' : '+';
                }
                else if(e === -1)
                    //just the sign is needed
                    coeff = '-';
                //the highest power doesn't carry the plus sign
                else if(i !== last && e > 0) { 
                    coeff = '+'+e;
                }
                else {
                    coeff = e;
                }
                
                //prepare the power
                if(i === 1)
                    power = '';
                else 
                    power = '^'+i;
                
                retval = coeff+this.variable+power;
            }
            
            return retval;
        }, terms_array);
       
       //Just join them together with a blank string
       return terms_array.reverse().join('');
    };
    
    /**
     * Generates a JavaScript function for this Sequence based on its terms
     * @returns {Function}
     */
    Sequence.prototype.toFunction = function() {
        //grab the array with term definitions
        var fn_array = this.eachTerm(function(e, i, last){
            //return blank for zero terms
            if(e === 0)
                return '';
            //i is the power of this term
            if(i === 0) 
                return e;
            else if(i === 1) 
                return e+'*'+this.variable;
            else 
                return e+'*Math.pow('+this.variable+','+i+')';
        }, [], true);
        //compile the string
        var fn_str = fn_array.join('+')+';';
        //build the function
        return new Function([this.variable], 'return '+fn_str);
    };
    
    /**
     * Gets the value for a number for this Sequence based on its terms
     * @param {Number} x
     * @returns {Number}
     */
    Sequence.prototype.at = function(x) {
        return sum(this.eachTerm(function(e, i) {
            if(e === 0)
                return e;
            return e*Math.pow(x, i);
        }, []));
    };
    
    /**
     * Gets the next value for this Sequence based on its terms
     * @param {Boolean} append Set to true if the next value should be added to sequence
     * @returns {Number}
     */
    Sequence.prototype.next = function(append) {
        var next = this.at(this.sequence.length+1);
        if(append)
            this.sequence.push(next);
        return next;
    };
    
    /**
     * Checks to see if this Sequence matches the provided Sequence
     * @param {Sequence} sequence
     * @returns {Boolean}
     */
    Sequence.prototype.matches = function(sequence) {
        var l = Math.max(this.sequence.length, sequence.sequence.length);
        //if this or the other sequence don't have equal terms then make them equal
        if(this.sequence.length < l)
            this.calculate(l);
        if(sequence.sequence < l)
            sequence.calculte(l);

        //compare
        for(var i=0; i<l; i++) {
            if(this.sequence[i] !== sequence.sequence[i])
                return false;
        }
        
        //they match otherwise this would have exited already
        return true;
    };
    
    /**
     * Calcuates the sequence based on its terms
     * @param {type} n
     * @returns {Sequence}
     */
    Sequence.prototype.calculate = function(n) {
        for(var i=0; i<n; i++) {
            this.sequence.push(this.at(i));
        }
        return this;
    };
    
    /**
     * Wipes the current sequence and calculates the values of the sequence based on its terms
     * @param {Number} n The number of items to generate
     * @returns {Sequence}
     */
    Sequence.prototype.recalculate = function(n) {
        this.sequence = [];
        this.calculate(n);
        return this;
    };
    
    /**
     * Set the tolerance for getting the polynomial
     * @param {Number} tol
     * @returns {Sequence}
     */
    Sequence.prototype.setTolerance = function(tol) {
        this.tolerance = tol;
        
        return this;
    };
    
    /**
     * Sets the maximum allowed iterations before giving up when calculating the polynomial
     * @param {type} iters
     * @returns {Sequence}
     */
    Sequence.prototype.setMaxIterations = function(iters) {
        this.max_iter = iters;
        
        return this;
    };
    
    /**
     * The variable to be used when creating the polynomial string. Default is x.
     * @param {String} variable
     * @returns {Sequence}
     */
    Sequence.prototype.setVariable = function(variable) {
        this.variable = variable;
        
        return this;
    };
    
    return Sequence;
    
})();

if ((typeof module) !== 'undefined') {
    module.exports = SEQ;
}