# SEQ
Convert number sequence to polynomial form 

Example:
I use the function generate to create a a sequence

```javascript
//this sequence was generated using x^3+7*x+7
var number_sequence = [ 7, 15, 29, 55, 99, 167, 265, 399, 575, 799, 1077 ];
```
We can then analyze it using SEQ

```javascript
var seq = new SEQ(number_sequence).analyze();
console.log(seq.toPolynomialString())
//x^3+7*x+7
```
We can get the next number in the sequence

```javascript
var next = seq.next();
console.log(next);
//1415
```
or get it in the form of a javascript function

```javascript
f = seq.toFunction();
console.log(f(7));
//399
```
You can tweak the tolerance and maximum iterations and the variable used when returning the polynomial string
using the 'setTolerance', 'setMaxIterations', and 'setVariable' methods. The default for 'setMaxIterations' 
is 1000 which roughly corresponds to highest degree polynomial expected.

It cannot calculate all sequence yet.
