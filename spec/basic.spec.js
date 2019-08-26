/* global expect */

var SEQ = require('../index.js');

describe('Basic tests for univariate', function() {
    /*
     * This one fails for irrationals with good reason.
     */
    it('Should calculate the sequence correctly for constants', function() {
        expect(new SEQ(SEQ.generate(() => 3)).analyze().toPolynomialString()).toEqual('3');
    }); 
    it('Should calculate the sequence correctly for single terms', function() {
        expect(new SEQ(SEQ.generate(x => x)).analyze().toPolynomialString()).toEqual('x');
    }); 
    it('Should calculate the sequence correctly for certain sequences with rational coefficients', function() {
        expect(new SEQ(SEQ.generate(x => 0.5*x+3/4)).analyze().toPolynomialString()).toEqual('0.5x+0.75');
    }); 
    it('Should calculate the sequence correctly for cubic sequences', function() {
        expect(new SEQ(SEQ.generate(x => x**3-x**2)).analyze().toPolynomialString()).toEqual('x^3-x^2');
    }); 
    it('Should calculate the sequence correctly for seventh order sequences', function() {
        expect(new SEQ(SEQ.generate(x => 5*x**7+2*x**2+1)).analyze().toPolynomialString()).toEqual('5x^7+2x^2+1');
    }); 
   
    
});